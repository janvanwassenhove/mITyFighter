/**
 * @fileoverview Background registry with dynamic JSON loading support
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Background asset conventions
 * @see docs/EXTENSIBILITY.md - How to add new backgrounds
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Background registry entry type.
 */
export interface BackgroundRegistryEntry {
  /** Unique identifier (matches registry key) */
  readonly id: string;
  /** Display name for UI */
  readonly displayName: string;
  /** Description of the background */
  readonly description: string;
  /** Filename relative to backgrounds folder */
  readonly file: string;
  /** Type of background asset */
  readonly type: 'image' | 'video' | 'gif';
}

/**
 * JSON structure for backgrounds data file
 */
export interface BackgroundsJsonData {
  backgrounds: BackgroundRegistryEntry[];
}

// =============================================================================
// Dynamic Registry Storage
// =============================================================================

/** Dynamic background registry (populated from JSON) */
let backgroundRegistry: Record<string, BackgroundRegistryEntry> = {};

/** Array of all background IDs (populated from JSON) */
let backgroundIds: string[] = [];

/** Flag to check if registry is loaded */
let isLoaded = false;

// =============================================================================
// JSON Loading
// =============================================================================

/**
 * Load backgrounds from JSON file.
 * Call this during game initialization before accessing registry.
 * 
 * @returns Promise that resolves when backgrounds are loaded
 */
export async function loadBackgroundsFromJson(): Promise<void> {
  try {
    const response = await fetch('data/backgrounds.json');
    if (!response.ok) {
      throw new Error(`Failed to load backgrounds.json: ${response.status}`);
    }
    
    const data: BackgroundsJsonData = await response.json();
    
    // Build registry from JSON data
    backgroundRegistry = {};
    backgroundIds = [];
    
    for (const background of data.backgrounds) {
      backgroundRegistry[background.id] = background;
      backgroundIds.push(background.id);
    }
    
    isLoaded = true;
    console.log(`Loaded ${backgroundIds.length} backgrounds from JSON`);
  } catch (error) {
    console.error('Error loading backgrounds from JSON:', error);
    throw error;
  }
}

/**
 * Check if registry is loaded.
 * @returns True if registry has been loaded from JSON
 */
export function isBackgroundRegistryLoaded(): boolean {
  return isLoaded;
}

// =============================================================================
// Registry Access (Backward Compatible)
// =============================================================================

/**
 * Get the background registry object.
 * Note: Returns a read-only view of the dynamically loaded registry.
 */
export function getBackgroundRegistry(): Readonly<Record<string, BackgroundRegistryEntry>> {
  if (!isLoaded) {
    console.warn('Background registry accessed before loading from JSON');
  }
  return backgroundRegistry;
}

/**
 * Legacy constant for backward compatibility.
 * Proxies to the dynamic registry.
 */
export const BACKGROUND_REGISTRY = new Proxy({} as Record<string, BackgroundRegistryEntry>, {
  get(_, prop: string) {
    return backgroundRegistry[prop];
  },
  ownKeys() {
    return backgroundIds;
  },
  getOwnPropertyDescriptor(_, prop: string) {
    if (prop in backgroundRegistry) {
      return {
        enumerable: true,
        configurable: true,
        value: backgroundRegistry[prop],
      };
    }
    return undefined;
  },
  has(_, prop: string) {
    return prop in backgroundRegistry;
  },
});

// =============================================================================
// Type Exports
// =============================================================================

/** Background ID type - now a string since registry is dynamic */
export type BackgroundId = string;

/** Get array of all background IDs */
export function getBackgroundIds(): readonly string[] {
  return backgroundIds;
}

/**
 * Legacy constant for backward compatibility.
 * Proxies to the dynamic IDs array.
 */
export const BACKGROUND_IDS: readonly string[] = new Proxy([] as string[], {
  get(_, prop) {
    if (prop === 'length') return backgroundIds.length;
    if (prop === Symbol.iterator) return () => backgroundIds[Symbol.iterator]();
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return backgroundIds[Number(prop)];
    }
    if (prop === 'indexOf') return (id: string) => backgroundIds.indexOf(id);
    if (prop === 'includes') return (id: string) => backgroundIds.includes(id);
    if (prop === 'map') return <T>(fn: (id: string, index: number, array: string[]) => T) => backgroundIds.map(fn);
    if (prop === 'forEach') return (fn: (id: string, index: number, array: string[]) => void) => backgroundIds.forEach(fn);
    if (prop === 'filter') return (fn: (id: string, index: number, array: string[]) => boolean) => backgroundIds.filter(fn);
    return undefined;
  },
});

/** Get number of registered backgrounds */
export function getBackgroundCount(): number {
  return backgroundIds.length;
}

/**
 * Legacy constant for backward compatibility.
 */
export const BACKGROUND_COUNT = {
  valueOf(): number {
    return backgroundIds.length;
  },
  toString(): string {
    return String(backgroundIds.length);
  },
} as unknown as number;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get a background registry entry by ID.
 *
 * @param id - Background identifier
 * @returns Background registry entry or undefined if not found
 */
export function getBackground(id: BackgroundId): BackgroundRegistryEntry | undefined {
  return backgroundRegistry[id];
}

/**
 * Check if a background ID is valid.
 *
 * @param id - String to check
 * @returns True if valid background ID
 */
export function isValidBackgroundId(id: string): id is BackgroundId {
  return id in backgroundRegistry;
}

/**
 * Get the next background ID in the list (wrapping).
 *
 * @param currentId - Current background ID
 * @param direction - 1 for next, -1 for previous
 * @returns Next background ID
 */
export function getNextBackgroundId(
  currentId: BackgroundId,
  direction: 1 | -1
): BackgroundId {
  const currentIndex = backgroundIds.indexOf(currentId);
  const count = backgroundIds.length;
  const nextIndex = (currentIndex + direction + count) % count;
  return backgroundIds[nextIndex] ?? currentId;
}
