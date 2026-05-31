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
 * Pack folder names are mapped to these via PACK_ACTION_MAP in PackTypes.ts.
 */
export const ACTION_IDS = [
  'idle',
  'walk',
  'run',
  'jump',
  'crouch',
  'block',
  'hurt',
  'dead',
  'attack1',
  'attack2',
  'special',
  'win',
  'intro',
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
// Profile Pic Keys
// =============================================================================

/**
 * Generate texture key for a fighter profile pic.
 *
 * @param fighterId - Fighter identifier
 * @param picType - Profile pic type (e.g., 'head-closeup', 'fighting-pose')
 * @returns Texture key in format "profile/<fighterId>/<picType>"
 */
export function getProfilePicKey(fighterId: string, picType: string): string {
  return `profile/${fighterId}/${picType}`;
}
