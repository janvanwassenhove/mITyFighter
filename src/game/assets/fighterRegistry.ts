/**
 * @fileoverview Fighter registry with dynamic pack loading support
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Pack format conventions
 * @see docs/EXTENSIBILITY.md - How to add new fighters
 */

import type { ActionId } from './AssetKeys';
import {
  loadPackIndex,
  loadPackManifest,
  storeManifest,
} from './PackLoader';
import type {
  PackManifest,
  PackProfilePic,
} from './PackTypes';
import { resolvePackAction, DEFAULT_SPECIAL_COMBO } from './PackTypes';

// =============================================================================
// Types
// =============================================================================

/**
 * Animation data stored per action in the registry.
 */
export interface FighterAnimationData {
  /** Whether this animation loops */
  readonly loop: boolean;
  /** Total frame count */
  readonly frameCount: number;
  /** Per-frame delays in ms */
  readonly frameDelays: readonly number[];
  /** Pack folder name (for spritesheet path resolution) */
  readonly folder: string;
}

/**
 * Fighter registry entry type.
 */
export interface FighterRegistryEntry {
  /** Unique identifier (matches registry key) */
  readonly id: string;
  /** Display name for UI */
  readonly displayName: string;
  /** Character tagline */
  readonly tagline: string;
  /** Character bio/story */
  readonly bio: string;
  /** Character motivation */
  readonly motivation: string;
  /** Frame width in pixels */
  readonly frameWidth: number;
  /** Frame height in pixels */
  readonly frameHeight: number;
  /** Available actions mapped to animation data */
  readonly actions: Partial<Record<ActionId, FighterAnimationData>>;
  /** Profile pictures */
  readonly profilePics: readonly PackProfilePic[];
  /** Special combo display notation */
  readonly specialCombo: string;
}

// =============================================================================
// Dynamic Registry Storage
// =============================================================================

/** Dynamic fighter registry (populated from packs) */
let fighterRegistry: Record<string, FighterRegistryEntry> = {};

/** Array of all fighter IDs (populated from packs) */
let fighterIds: string[] = [];

/** Flag to check if registry is loaded */
let isLoaded = false;

// =============================================================================
// Pack Loading
// =============================================================================

/**
 * Load fighters from pack manifests.
 * Fetches packs.json, then loads each pack's manifest, and populates the registry.
 *
 * @returns Promise that resolves when all packs are loaded
 */
export async function loadFightersFromPacks(): Promise<void> {
  try {
    const packIds = await loadPackIndex();

    // Load all manifests in parallel
    const manifestPromises = packIds.map((id) => loadPackManifest(id));
    const packManifests = await Promise.all(manifestPromises);

    // Build registry from manifests
    fighterRegistry = {};
    fighterIds = [];

    for (const manifest of packManifests) {
      const entry = manifestToRegistryEntry(manifest);
      fighterRegistry[entry.id] = entry;
      fighterIds.push(entry.id);
      storeManifest(manifest);
    }

    isLoaded = true;
    // eslint-disable-next-line no-console
    console.log(`Loaded ${fighterIds.length} fighters from packs`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading fighters from packs:', error);
    throw error;
  }
}

/**
 * Convert a PackManifest into a FighterRegistryEntry.
 *
 * @param manifest - Pack manifest
 * @returns Fighter registry entry
 */
function manifestToRegistryEntry(manifest: PackManifest): FighterRegistryEntry {
  const actions: Partial<Record<ActionId, FighterAnimationData>> = {};

  for (const anim of manifest.animations) {
    const actionId = resolvePackAction(anim.folder);
    if (!actionId) continue;

    actions[actionId] = {
      loop: anim.loop === 'loop',
      frameCount: anim.frameCount,
      frameDelays: anim.frames.map((f) => f.delay),
      folder: anim.folder,
    };
  }

  return {
    id: manifest.character.id,
    displayName: manifest.character.displayName,
    tagline: manifest.character.tagline,
    bio: manifest.character.bio,
    motivation: manifest.character.motivation,
    frameWidth: manifest.spriteSize.width,
    frameHeight: manifest.spriteSize.height,
    actions,
    profilePics: manifest.profilePics,
    specialCombo: DEFAULT_SPECIAL_COMBO,
  };
}

/**
 * Check if registry is loaded.
 *
 * @returns True if registry has been loaded from packs
 */
export function isFighterRegistryLoaded(): boolean {
  return isLoaded;
}

// =============================================================================
// Registry Access
// =============================================================================

/**
 * Get the fighter registry object.
 *
 * @returns Read-only fighter registry
 */
export function getFighterRegistry(): Readonly<Record<string, FighterRegistryEntry>> {
  if (!isLoaded) {
    // eslint-disable-next-line no-console
    console.warn('Fighter registry accessed before loading from packs');
  }
  return fighterRegistry;
}

/**
 * Legacy constant for backward compatibility.
 * Proxies to the dynamic registry.
 */
export const FIGHTER_REGISTRY = new Proxy({} as Record<string, FighterRegistryEntry>, {
  get(_, prop: string): FighterRegistryEntry | undefined {
    return fighterRegistry[prop];
  },
  ownKeys(): string[] {
    return fighterIds;
  },
  getOwnPropertyDescriptor(_, prop: string): PropertyDescriptor | undefined {
    if (prop in fighterRegistry) {
      return {
        enumerable: true,
        configurable: true,
        value: fighterRegistry[prop],
      };
    }
    return undefined;
  },
  has(_, prop: string): boolean {
    return prop in fighterRegistry;
  },
});

// =============================================================================
// Type Exports
// =============================================================================

/** Fighter ID type - string since registry is dynamic */
export type FighterId = string;

/**
 * Get array of all fighter IDs.
 *
 * @returns Array of fighter IDs
 */
export function getFighterIds(): readonly string[] {
  return fighterIds;
}

/**
 * Legacy constant for backward compatibility.
 * Proxies to the dynamic IDs array.
 */
export const FIGHTER_IDS: readonly string[] = new Proxy([] as string[], {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_, prop): any {
    if (prop === 'length') return fighterIds.length;
    if (prop === Symbol.iterator) return (): Iterator<string> => fighterIds[Symbol.iterator]();
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return fighterIds[Number(prop)];
    }
    if (prop === 'indexOf') return (id: string): number => fighterIds.indexOf(id);
    if (prop === 'includes') return (id: string): boolean => fighterIds.includes(id);
    if (prop === 'map') return <T>(fn: (_id: string) => T): T[] => fighterIds.map(fn);
    if (prop === 'forEach') return (fn: (_id: string) => void): void => fighterIds.forEach(fn);
    if (prop === 'filter') return (fn: (_id: string) => boolean): string[] => fighterIds.filter(fn);
    return undefined;
  },
});

/**
 * Get number of registered fighters.
 *
 * @returns Number of fighters
 */
export function getFighterCount(): number {
  return fighterIds.length;
}

/**
 * Legacy constant for backward compatibility.
 */
export const FIGHTER_COUNT = {
  valueOf(): number {
    return fighterIds.length;
  },
  toString(): string {
    return String(fighterIds.length);
  },
} as unknown as number;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get a fighter registry entry by ID.
 *
 * @param id - Fighter identifier
 * @returns Fighter registry entry or undefined if not found
 */
export function getFighter(id: FighterId): FighterRegistryEntry | undefined {
  return fighterRegistry[id];
}

/**
 * Check if a fighter ID is valid.
 *
 * @param id - String to check
 * @returns True if valid fighter ID
 */
export function isValidFighterId(id: string): id is FighterId {
  return id in fighterRegistry;
}

/**
 * Get the next fighter ID in the list (wrapping).
 *
 * @param currentId - Current fighter ID
 * @param direction - 1 for next, -1 for previous
 * @returns Next fighter ID
 */
export function getNextFighterId(
  currentId: FighterId,
  direction: 1 | -1
): FighterId {
  const currentIndex = fighterIds.indexOf(currentId);
  const count = fighterIds.length;
  const nextIndex = (currentIndex + direction + count) % count;
  return fighterIds[nextIndex] ?? currentId;
}
