/**
 * @fileoverview Asset key generation utilities and type definitions
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Key conventions
 * @see docs/ANIMATIONS.md - Animation key format
 */

// =============================================================================
// Action IDs
// =============================================================================

/**
 * Canonical action identifiers.
 * Add new actions here when extending the game.
 */
export const ACTION_IDS = [
  'idle',
  'idle2',
  'walk',
  'run',
  'jump',
  'hurt',
  'dead',
  'attack1',
  'attack2',
  'attack3',
  'special',
  'cast',
  'eating',
  'spine',
  'blade',
  'kunai',
  'dart',
  'shot',
  'disguise',
  'charge',
  'charge1',
  'charge2',
  'fire1',
  'fire2',
  'protect',
  'protection',
  'lightball',
  'lightcharge',
] as const;

/** Type for action identifiers */
export type ActionId = (typeof ACTION_IDS)[number];

// =============================================================================
// Fighter Keys
// =============================================================================

/**
 * Generate texture key for a fighter action.
 *
 * @param fighterId - Fighter identifier
 * @param actionId - Action identifier
 * @returns Texture key in format "fighter/<fighterId>/<actionId>"
 *
 * @example
 * ```typescript
 * getFighterTextureKey('kunoichi', 'idle') // "fighter/kunoichi/idle"
 * ```
 */
export function getFighterTextureKey(
  fighterId: string,
  actionId: ActionId
): string {
  return `fighter/${fighterId}/${actionId}`;
}

/**
 * Generate animation key for a fighter action.
 *
 * @param fighterId - Fighter identifier
 * @param actionId - Action identifier
 * @returns Animation key in format "fighter:<fighterId>:<actionId>"
 *
 * @example
 * ```typescript
 * getFighterAnimationKey('kunoichi', 'idle') // "fighter:kunoichi:idle"
 * ```
 */
export function getFighterAnimationKey(
  fighterId: string,
  actionId: ActionId
): string {
  return `fighter:${fighterId}:${actionId}`;
}

/**
 * Parse a fighter texture key into its components.
 *
 * @param key - Texture key to parse
 * @returns Object with fighterId and actionId, or null if invalid
 */
export function parseFighterTextureKey(
  key: string
): { fighterId: string; actionId: ActionId } | null {
  const parts = key.split('/');
  if (parts.length !== 3 || parts[0] !== 'fighter') {
    return null;
  }
  const actionId = parts[2] as ActionId;
  if (!ACTION_IDS.includes(actionId)) {
    return null;
  }
  return { fighterId: parts[1] ?? '', actionId };
}

/**
 * Parse a fighter animation key into its components.
 *
 * @param key - Animation key to parse
 * @returns Object with fighterId and actionId, or null if invalid
 */
export function parseFighterAnimationKey(
  key: string
): { fighterId: string; actionId: ActionId } | null {
  const parts = key.split(':');
  if (parts.length !== 3 || parts[0] !== 'fighter') {
    return null;
  }
  const actionId = parts[2] as ActionId;
  if (!ACTION_IDS.includes(actionId)) {
    return null;
  }
  return { fighterId: parts[1] ?? '', actionId };
}

// =============================================================================
// Background Keys
// =============================================================================

/**
 * Generate texture key for a background.
 *
 * @param backgroundId - Background identifier
 * @returns Texture key in format "bg/<backgroundId>"
 *
 * @example
 * ```typescript
 * getBackgroundTextureKey('dojo') // "bg/dojo"
 * ```
 */
export function getBackgroundTextureKey(backgroundId: string): string {
  return `bg/${backgroundId}`;
}

/**
 * Generate asset key for a background (image or video).
 * Alias for getBackgroundTextureKey for semantic clarity.
 *
 * @param backgroundId - Background identifier
 * @returns Asset key in format "bg/<backgroundId>"
 */
export function getBackgroundKey(backgroundId: string): string {
  return `bg/${backgroundId}`;
}

/**
 * Parse a background texture key.
 *
 * @param key - Texture key to parse
 * @returns Background ID or null if invalid
 */
export function parseBackgroundTextureKey(key: string): string | null {
  const parts = key.split('/');
  if (parts.length !== 2 || parts[0] !== 'bg') {
    return null;
  }
  return parts[1] ?? null;
}

// =============================================================================
// Filename Mapping
// =============================================================================

/**
 * Map action ID to expected filename.
 * This is used for registry validation and auto-detection.
 */
export const ACTION_TO_FILENAME: Record<ActionId, string> = {
  idle: 'Idle.png',
  idle2: 'Idle_2.png',
  walk: 'Walk.png',
  run: 'Run.png',
  jump: 'Jump.png',
  hurt: 'Hurt.png',
  dead: 'Dead.png',
  attack1: 'Attack_1.png',
  attack2: 'Attack_2.png',
  attack3: 'Attack_3.png',
  special: 'Special.png',
  cast: 'Cast.png',
  eating: 'Eating.png',
  spine: 'Spine.png',
  blade: 'Blade.png',
  kunai: 'Kunai.png',
  dart: 'Dart.png',
  shot: 'Shot.png',
  disguise: 'Disguise.png',
  charge: 'Charge.png',
  charge1: 'Charge_1.png',
  charge2: 'Charge_2.png',
  fire1: 'Fire_1.png',
  fire2: 'Fire_2.png',
  protect: 'Protect.png',
  protection: 'Protection.png',
  lightball: 'Light_ball.png',
  lightcharge: 'Light_charge.png',
};

/**
 * Map filename to action ID.
 */
export const FILENAME_TO_ACTION: Record<string, ActionId> = Object.entries(
  ACTION_TO_FILENAME
).reduce(
  (acc, [action, filename]) => {
    acc[filename] = action as ActionId;
    return acc;
  },
  {} as Record<string, ActionId>
);
