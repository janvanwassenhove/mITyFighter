/**
 * @fileoverview Pack format type definitions and action mapping
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Pack format conventions
 */

import type { ActionId } from './AssetKeys';

// =============================================================================
// Pack Manifest Types
// =============================================================================

/**
 * Top-level manifest.json structure for a fighter pack.
 */
export interface PackManifest {
  readonly name: string;
  readonly version: string;
  readonly character: PackCharacter;
  readonly spriteSize: PackSpriteSize;
  readonly animationCount: number;
  readonly profilePicCount: number;
  readonly animations: readonly PackAnimation[];
  readonly profilePics: readonly PackProfilePic[];
  readonly exportedAt: string;
}

/**
 * Character identity from manifest.
 */
export interface PackCharacter {
  readonly id: string;
  readonly displayName: string;
  readonly tagline: string;
  readonly bio: string;
  readonly motivation: string;
}

/**
 * Sprite dimensions from manifest.
 */
export interface PackSpriteSize {
  readonly width: number;
  readonly height: number;
}

// =============================================================================
// Pack Animation Types
// =============================================================================

/**
 * A single animation entry in the manifest.
 */
export interface PackAnimation {
  readonly name: string;
  readonly folder: string;
  readonly frameCount: number;
  readonly loop: 'loop' | 'once';
  readonly totalDuration: number;
  readonly frames: readonly PackFrame[];
  readonly spriteSheet: string;
  readonly gif: string;
}

/**
 * A single frame within an animation.
 * Delay is in milliseconds.
 */
export interface PackFrame {
  readonly index: number;
  readonly delay: number;
  readonly hitboxes: readonly PackHitbox[];
}

/**
 * Hitbox definition per frame.
 * Currently unused at runtime — interface defined for future collision data.
 */
export interface PackHitbox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly type: 'hurt' | 'hit';
}

// =============================================================================
// Pack Metadata Types (per-action metadata.json)
// =============================================================================

/**
 * Spritesheet metadata from <action>/metadata.json.
 */
export interface PackMetadata {
  readonly frames: readonly PackMetadataFrame[];
  readonly meta: PackMetadataMeta;
}

/**
 * A single frame in the metadata atlas.
 */
export interface PackMetadataFrame {
  readonly filename: string;
  readonly frame: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly duration: number;
}

/**
 * Atlas meta info from metadata.json.
 */
export interface PackMetadataMeta {
  readonly image: string;
  readonly size: { readonly w: number; readonly h: number };
  readonly format: string;
  readonly scale: number;
}

// =============================================================================
// Pack Profile Pics
// =============================================================================

/**
 * Profile picture entry from manifest.
 */
export interface PackProfilePic {
  readonly type: string;
  readonly filename: string;
}

// =============================================================================
// Pack Index
// =============================================================================

/**
 * packs.json structure — index of available fighter packs.
 */
export interface PackIndex {
  readonly packs: readonly string[];
}

// =============================================================================
// Pack Action Mapping
// =============================================================================

/**
 * Maps pack folder names to game ActionId values.
 * Pack folders not listed here map 1:1 to ActionId (e.g., 'idle' → 'idle').
 */
export const PACK_ACTION_MAP: Record<string, ActionId> = {
  punch: 'attack1',
  kick: 'attack2',
  ko: 'dead',
};

/**
 * Resolve a pack folder name to the game's ActionId.
 *
 * @param folder - Pack animation folder name (e.g., 'punch', 'idle')
 * @returns The mapped ActionId, or the folder name if it maps 1:1
 */
export function resolvePackAction(folder: string): ActionId | null {
  if (folder in PACK_ACTION_MAP) {
    return PACK_ACTION_MAP[folder]!;
  }
  // Check if the folder name is itself a valid ActionId
  const ACTION_IDS_SET = new Set([
    'idle', 'walk', 'run', 'jump', 'crouch', 'block',
    'hurt', 'dead', 'attack1', 'attack2', 'special',
    'win', 'intro',
  ]);
  if (ACTION_IDS_SET.has(folder)) {
    return folder as ActionId;
  }
  return null;
}

/**
 * Default special combo input sequence.
 * ↓↓ + Attack1 (double-tap down + punch).
 */
export const DEFAULT_SPECIAL_COMBO = '↓↓+A1';
