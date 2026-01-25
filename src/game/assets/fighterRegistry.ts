/**
 * @fileoverview Fighter registry with dynamic JSON loading support
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Fighter asset conventions
 * @see docs/EXTENSIBILITY.md - How to add new fighters
 */

import type { ActionId } from './AssetKeys';

// =============================================================================
// Types
// =============================================================================

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
  /** Base path relative to assets folder */
  readonly basePath: string;
  /** Frame width in pixels (default 128) */
  readonly frameWidth: number;
  /** Frame height in pixels (default 128) */
  readonly frameHeight: number;
  /** Action to filename mapping */
  readonly actions: Partial<Record<ActionId, string>>;
}

/**
 * JSON structure for fighters data file
 */
export interface FightersJsonData {
  fighters: FighterRegistryEntry[];
}

// =============================================================================
// Dynamic Registry Storage
// =============================================================================

/** Dynamic fighter registry (populated from JSON) */
let fighterRegistry: Record<string, FighterRegistryEntry> = {};

/** Array of all fighter IDs (populated from JSON) */
let fighterIds: string[] = [];

/** Flag to check if registry is loaded */
let isLoaded = false;

// =============================================================================
// JSON Loading
// =============================================================================

/**
 * Load fighters from JSON file.
 * Call this during game initialization before accessing registry.
 * 
 * @returns Promise that resolves when fighters are loaded
 */
export async function loadFightersFromJson(): Promise<void> {
  try {
    // eslint-disable-next-line no-undef
    const response = await fetch('data/fighters.json');
    if (!response.ok) {
      throw new Error(`Failed to load fighters.json: ${response.status}`);
    }
    
    const data: FightersJsonData = await response.json();
    
    // Build registry from JSON data
    fighterRegistry = {};
    fighterIds = [];
    
    for (const fighter of data.fighters) {
      fighterRegistry[fighter.id] = fighter;
      fighterIds.push(fighter.id);
    }
    
    isLoaded = true;
    // eslint-disable-next-line no-console
    console.log(`Loaded ${fighterIds.length} fighters from JSON`);
  } catch (error) {
    console.error('Error loading fighters from JSON:', error);
    throw error;
  }
}

/**
 * Check if registry is loaded.
 * @returns True if registry has been loaded from JSON
 */
export function isFighterRegistryLoaded(): boolean {
  return isLoaded;
}

// =============================================================================
// Registry Access (Backward Compatible)
// =============================================================================

/**
 * Get the fighter registry object.
 * Note: Returns a read-only view of the dynamically loaded registry.
 * @returns Read-only fighter registry
 */
export function getFighterRegistry(): Readonly<Record<string, FighterRegistryEntry>> {
  if (!isLoaded) {
    console.warn('Fighter registry accessed before loading from JSON');
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

/** Fighter ID type - now a string since registry is dynamic */
export type FighterId = string;

/** Get array of all fighter IDs
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

/** Get number of registered fighters
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
