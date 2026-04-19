/**
 * @fileoverview Pack loading orchestrator for fighter packs
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Pack format conventions
 */

import type Phaser from 'phaser';

import { logger } from '../utils/logger';

import type { ActionId } from './AssetKeys';
import { getFighterTextureKey, getFighterAnimationKey, getProfilePicKey } from './AssetKeys';
import type {
  PackIndex,
  PackManifest,
  PackAnimation,
} from './PackTypes';
import { resolvePackAction } from './PackTypes';

// =============================================================================
// Pack Index Loading
// =============================================================================

/**
 * Fetch the pack index from public/data/packs.json.
 *
 * @returns List of pack IDs
 */
export async function loadPackIndex(): Promise<readonly string[]> {
  // eslint-disable-next-line no-undef
  const response = await fetch('data/packs.json');
  if (!response.ok) {
    throw new Error(`Failed to load packs.json: ${response.status}`);
  }
  const data: PackIndex = await response.json();
  return data.packs;
}

// =============================================================================
// Pack Manifest Loading
// =============================================================================

/**
 * Fetch a single pack's manifest.
 *
 * @param packId - Pack folder name (e.g., 'ninja_jan')
 * @returns Parsed PackManifest
 */
export async function loadPackManifest(packId: string): Promise<PackManifest> {
  // eslint-disable-next-line no-undef
  const response = await fetch(`packs/${packId}/manifest.json`);
  if (!response.ok) {
    throw new Error(`Failed to load manifest for pack "${packId}": ${response.status}`);
  }
  const data: PackManifest = await response.json();
  return data;
}

// =============================================================================
// Pack Asset Loading (Phaser spritesheets)
// =============================================================================

/**
 * Queue Phaser spritesheet loads for all animations in a pack.
 * Call this during a scene's preload() phase.
 *
 * @param scene - Phaser scene with loader
 * @param manifest - Loaded pack manifest
 */
export function loadPackAssets(
  scene: Phaser.Scene,
  manifest: PackManifest
): void {
  const fighterId = manifest.character.id;
  const { width, height } = manifest.spriteSize;

  for (const anim of manifest.animations) {
    const actionId = resolvePackAction(anim.folder);
    if (!actionId) {
      logger.warn(`Unknown pack action folder: ${anim.folder} (skipped)`);
      continue;
    }

    const textureKey = getFighterTextureKey(fighterId, actionId);
    const path = `packs/${fighterId}/${anim.spriteSheet}`;

    scene.load.spritesheet(textureKey, path, {
      frameWidth: width,
      frameHeight: height,
    });
  }

  logger.debug(`Queued spritesheet loading for pack: ${fighterId}`);
}

// =============================================================================
// Pack Profile Pic Loading
// =============================================================================

/**
 * Queue Phaser image loads for all profile pics in a pack.
 *
 * @param scene - Phaser scene with loader
 * @param manifest - Loaded pack manifest
 */
export function loadPackProfilePics(
  scene: Phaser.Scene,
  manifest: PackManifest
): void {
  const fighterId = manifest.character.id;

  for (const pic of manifest.profilePics) {
    const key = getProfilePicKey(fighterId, pic.type);
    const path = `packs/${fighterId}/${pic.filename}`;
    scene.load.image(key, path);
  }

  logger.debug(`Queued profile pic loading for pack: ${fighterId}`);
}

// =============================================================================
// Pack Animation Creation
// =============================================================================

/**
 * Create Phaser animations for all actions in a pack.
 * Uses per-frame durations from the pack's animation data.
 * Call this after all assets are loaded (in create()).
 *
 * @param scene - Phaser scene with animation manager
 * @param manifest - Loaded pack manifest
 */
export function createPackAnimations(
  scene: Phaser.Scene,
  manifest: PackManifest
): void {
  const fighterId = manifest.character.id;

  for (const anim of manifest.animations) {
    const actionId = resolvePackAction(anim.folder);
    if (!actionId) continue;

    createSinglePackAnimation(scene, fighterId, actionId, anim);
  }

  logger.debug(`Created animations for pack: ${fighterId}`);
}

/**
 * Create a single Phaser animation from pack animation data.
 *
 * @param scene - Phaser scene
 * @param fighterId - Fighter identifier
 * @param actionId - Resolved game ActionId
 * @param anim - Pack animation data
 * @returns True if animation was created successfully
 */
function createSinglePackAnimation(
  scene: Phaser.Scene,
  fighterId: string,
  actionId: ActionId,
  anim: PackAnimation
): boolean {
  const textureKey = getFighterTextureKey(fighterId, actionId);
  const animKey = getFighterAnimationKey(fighterId, actionId);

  if (!scene.textures.exists(textureKey)) {
    logger.warn(`Texture not found for pack animation: ${textureKey}`);
    return false;
  }

  // Skip if animation already exists
  if (scene.anims.exists(animKey)) {
    return true;
  }

  // Build per-frame config with individual durations
  const frames = anim.frames.map((frame) => ({
    key: textureKey,
    frame: frame.index,
    duration: frame.delay,
  }));

  const repeat = anim.loop === 'loop' ? -1 : 0;

  scene.anims.create({
    key: animKey,
    frames,
    repeat,
  });

  logger.debug(
    `Created pack animation: ${animKey} (${anim.frameCount} frames, ${anim.loop})`
  );

  return true;
}

// =============================================================================
// Manifest Storage
// =============================================================================

/** Stored manifests keyed by fighter ID */
const manifests: Record<string, PackManifest> = {};

/**
 * Store a loaded manifest for later access.
 *
 * @param manifest - Pack manifest to store
 */
export function storeManifest(manifest: PackManifest): void {
  manifests[manifest.character.id] = manifest;
}

/**
 * Get a stored manifest by fighter ID.
 *
 * @param fighterId - Fighter identifier
 * @returns Pack manifest or undefined
 */
export function getManifest(fighterId: string): PackManifest | undefined {
  return manifests[fighterId];
}

/**
 * Get all stored manifests.
 *
 * @returns Record of fighter ID to manifest
 */
export function getAllManifests(): Readonly<Record<string, PackManifest>> {
  return manifests;
}
