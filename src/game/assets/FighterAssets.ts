/**
 * @fileoverview Fighter asset loading utilities
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Sprite conventions and frame detection
 */

import type Phaser from 'phaser';

import {
  DEFAULT_FRAME_RATE,
  ACTION_FRAME_RATES,
  LOOPING_ACTIONS,
} from '../config/constants';
import { logger } from '../utils/logger';

import type { ActionId } from './AssetKeys';
import { getFighterTextureKey, getFighterAnimationKey } from './AssetKeys';
import {
  FIGHTER_REGISTRY,
  FIGHTER_IDS,
  type FighterId,
} from './fighterRegistry';

// =============================================================================
// Loading
// =============================================================================

/**
 * Load all fighter sprite sheets.
 *
 * @param scene - Phaser scene with loader
 */
export function loadAllFighters(scene: Phaser.Scene): void {
  logger.info(`Loading ${FIGHTER_IDS.length} fighters...`);

  for (const fighterId of FIGHTER_IDS) {
    loadFighter(scene, fighterId);
  }
}

/**
 * Load sprite sheets for a single fighter.
 *
 * @param scene - Phaser scene with loader
 * @param fighterId - Fighter to load
 */
export function loadFighter(scene: Phaser.Scene, fighterId: FighterId): void {
  const fighter = FIGHTER_REGISTRY[fighterId];
  if (!fighter) {
    logger.warn(`Fighter not found in registry: ${fighterId}`);
    return;
  }

  for (const [actionId, filename] of Object.entries(fighter.actions)) {
    const textureKey = getFighterTextureKey(fighterId, actionId as ActionId);
    const path = `${fighter.basePath}/${filename}`;

    scene.load.spritesheet(textureKey, path, {
      frameWidth: fighter.frameWidth,
      frameHeight: fighter.frameHeight,
    });
  }

  logger.debug(`Queued loading for fighter: ${fighterId}`);
}

// =============================================================================
// Animation Creation
// =============================================================================

/**
 * Create animations for all loaded fighters.
 * Call this after all assets are loaded.
 *
 * @param scene - Phaser scene with animation manager
 */
export function createAllFighterAnimations(scene: Phaser.Scene): void {
  logger.info('Creating fighter animations...');

  for (const fighterId of FIGHTER_IDS) {
    createFighterAnimations(scene, fighterId);
  }
}

/**
 * Create animations for a single fighter.
 *
 * @param scene - Phaser scene with animation manager
 * @param fighterId - Fighter to create animations for
 */
export function createFighterAnimations(
  scene: Phaser.Scene,
  fighterId: FighterId
): void {
  const fighter = FIGHTER_REGISTRY[fighterId];
  if (!fighter) {
    logger.warn(`Fighter not found in registry: ${fighterId}`);
    return;
  }

  for (const actionId of Object.keys(fighter.actions) as ActionId[]) {
    createFighterAnimation(scene, fighterId, actionId);
  }
}

/**
 * Create a single animation for a fighter action.
 *
 * @param scene - Phaser scene
 * @param fighterId - Fighter identifier
 * @param actionId - Action identifier
 * @returns True if animation was created successfully
 */
export function createFighterAnimation(
  scene: Phaser.Scene,
  fighterId: FighterId,
  actionId: ActionId
): boolean {
  const textureKey = getFighterTextureKey(fighterId, actionId);
  const animKey = getFighterAnimationKey(fighterId, actionId);
  const fighter = FIGHTER_REGISTRY[fighterId];

  if (!fighter) {
    logger.warn(`Fighter not found in registry: ${fighterId}`);
    return false;
  }

  // Check if texture exists
  if (!scene.textures.exists(textureKey)) {
    logger.warn(`Texture not found: ${textureKey}`);
    return false;
  }

  // Auto-detect frame count from texture dimensions
  const texture = scene.textures.get(textureKey);
  const source = texture.source[0];
  
  if (!source) {
    logger.warn(`No source for texture: ${textureKey}`);
    return false;
  }

  const frameCount = Math.floor(source.width / fighter.frameWidth);

  if (frameCount <= 0) {
    logger.warn(`Invalid frame count for ${textureKey}: ${frameCount}`);
    return false;
  }

  // Determine frame rate and looping
  const frameRate = ACTION_FRAME_RATES[actionId] ?? DEFAULT_FRAME_RATE;
  const repeat = LOOPING_ACTIONS.includes(actionId) ? -1 : 0;

  // Create the animation
  scene.anims.create({
    key: animKey,
    frames: scene.anims.generateFrameNumbers(textureKey, {
      start: 0,
      end: frameCount - 1,
    }),
    frameRate,
    repeat,
  });

  logger.debug(
    `Created animation: ${animKey} (${frameCount} frames, ${frameRate} fps, ${repeat === -1 ? 'loop' : 'once'})`
  );

  return true;
}

// =============================================================================
// Animation Helpers
// =============================================================================

/**
 * Check if an animation exists for a fighter action.
 *
 * @param scene - Phaser scene
 * @param fighterId - Fighter identifier
 * @param actionId - Action identifier
 * @returns True if animation exists
 */
export function hasAnimation(
  scene: Phaser.Scene,
  fighterId: FighterId,
  actionId: ActionId
): boolean {
  const animKey = getFighterAnimationKey(fighterId, actionId);
  return scene.anims.exists(animKey);
}

/**
 * Get all available action IDs for a fighter.
 *
 * @param fighterId - Fighter identifier
 * @returns Array of available action IDs
 */
export function getAvailableActions(fighterId: FighterId): ActionId[] {
  const fighter = FIGHTER_REGISTRY[fighterId];
  if (!fighter) {
    return [];
  }
  return Object.keys(fighter.actions) as ActionId[];
}

/**
 * Get frame count for a fighter animation.
 *
 * @param scene - Phaser scene
 * @param fighterId - Fighter identifier
 * @param actionId - Action identifier
 * @returns Frame count or 0 if not found
 */
export function getFrameCount(
  scene: Phaser.Scene,
  fighterId: FighterId,
  actionId: ActionId
): number {
  const animKey = getFighterAnimationKey(fighterId, actionId);
  const anim = scene.anims.get(animKey);
  return anim?.frames.length ?? 0;
}
