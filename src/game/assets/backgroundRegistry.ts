/**
 * @fileoverview Background registry with typed definitions
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
  /** Filename relative to backgrounds folder */
  readonly file: string;
  /** Type of background asset */
  readonly type: 'image' | 'video' | 'gif';
}

// =============================================================================
// Registry
// =============================================================================

/**
 * Background registry.
 * Add new backgrounds here following EXTENSIBILITY.md guidelines.
 */
export const BACKGROUND_REGISTRY = {
  pit: {
    id: 'pit',
    displayName: 'The Pit',
    file: '3yEmUFm.mp4',
    type: 'video',
  },
  courtyard: {
    id: 'courtyard',
    displayName: 'Courtyard',
    file: '4003cn5.mp4',
    type: 'video',
  },
  throne: {
    id: 'throne',
    displayName: 'Throne Room',
    file: '9DMQ7ae.mp4',
    type: 'video',
  },
  temple: {
    id: 'temple',
    displayName: 'Temple',
    file: 'aTCokPU.mp4',
    type: 'video',
  },
  forest: {
    id: 'forest',
    displayName: 'Living Forest',
    file: 'bMq9APc.mp4',
    type: 'video',
  },
  bridge: {
    id: 'bridge',
    displayName: 'Bridge',
    file: 'bsdz2KK.mp4',
    type: 'video',
  },
  arena: {
    id: 'arena',
    displayName: 'Arena',
    file: 'davQLBo.mp4',
    type: 'video',
  },
  portal: {
    id: 'portal',
    displayName: 'Portal',
    file: 'NW0mK39.mp4',
    type: 'video',
  },
  tower: {
    id: 'tower',
    displayName: 'Tower',
    file: 'NYFd64r.mp4',
    type: 'video',
  },
  wasteland: {
    id: 'wasteland',
    displayName: 'Wasteland',
    file: 'szTQ7dL.mp4',
    type: 'video',
  },
  dungeon: {
    id: 'dungeon',
    displayName: 'Dungeon',
    file: 'XQiErrk.mp4',
    type: 'video',
  },
  dojo_1: {
    id: 'dojo_1',
    displayName: 'Dojo',
    file: 'undefined - Imgur.gif',
    type: 'gif',
  },
  dojo_2: {
    id: 'dojo_2',
    displayName: 'Dojo Night',
    file: 'undefined - Imgur (1).gif',
    type: 'gif',
  },
  street: {
    id: 'street',
    displayName: 'Street',
    file: 'undefined - Imgur (2).gif',
    type: 'gif',
  },
  rooftop: {
    id: 'rooftop',
    displayName: 'Rooftop',
    file: 'undefined - Imgur (3).gif',
    type: 'gif',
  },
  cave: {
    id: 'cave',
    displayName: 'Cave',
    file: 'undefined - Imgur (4).gif',
    type: 'gif',
  },
  garden: {
    id: 'garden',
    displayName: 'Garden',
    file: 'undefined - Imgur (5).gif',
    type: 'gif',
  },
  battlefield: {
    id: 'battlefield',
    displayName: 'Battlefield',
    file: 'undefined - Imgur (6).gif',
    type: 'gif',
  },
  shrine: {
    id: 'shrine',
    displayName: 'Shrine',
    file: 'undefined - Imgur (7).gif',
    type: 'gif',
  },
  palace: {
    id: 'palace',
    displayName: 'Palace',
    file: 'undefined - Imgur (8).gif',
    type: 'gif',
  },
} as const satisfies Record<string, BackgroundRegistryEntry>;

// =============================================================================
// Type Exports
// =============================================================================

/** Background ID type derived from registry keys */
export type BackgroundId = keyof typeof BACKGROUND_REGISTRY;

/** Array of all background IDs */
export const BACKGROUND_IDS = Object.keys(BACKGROUND_REGISTRY) as BackgroundId[];

/** Number of registered backgrounds */
export const BACKGROUND_COUNT = BACKGROUND_IDS.length;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get a background registry entry by ID.
 *
 * @param id - Background identifier
 * @returns Background registry entry
 */
export function getBackground(id: BackgroundId): BackgroundRegistryEntry {
  return BACKGROUND_REGISTRY[id];
}

/**
 * Check if a background ID is valid.
 *
 * @param id - String to check
 * @returns True if valid background ID
 */
export function isValidBackgroundId(id: string): id is BackgroundId {
  return id in BACKGROUND_REGISTRY;
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
  const currentIndex = BACKGROUND_IDS.indexOf(currentId);
  const nextIndex =
    (currentIndex + direction + BACKGROUND_COUNT) % BACKGROUND_COUNT;
  return BACKGROUND_IDS[nextIndex] as BackgroundId;
}
