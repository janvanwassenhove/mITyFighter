/**
 * @fileoverview Fighter asset loading utilities (pack-based)
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Pack format and sprite conventions
 */

import type Phaser from 'phaser';

import { logger } from '../utils/logger';

import type { ActionId } from './AssetKeys';
import { getFighterAnimationKey } from './AssetKeys';
import {
  loadPackAssets,
  loadPackProfilePics,
  createPackAnimations,
  getAllManifests,
} from './PackLoader';
import {
  FIGHTER_IDS,
  type FighterId,
  FIGHTER_REGISTRY,
} from './fighterRegistry';

// =============================================================================
// Loading
// =============================================================================

/**
 * Load all fighter sprite sheets from packs.
 *
 * @param scene - Phaser scene with loader
 */
export function loadAllFighters(scene: Phaser.Scene): void {
  logger.info(`Loading ${FIGHTER_IDS.length} fighters from packs...`);

  const manifests = getAllManifests();
  for (const fighterId of FIGHTER_IDS) {
    const manifest = manifests[fighterId];
    if (manifest) {
      loadPackAssets(scene, manifest);
      loadPackProfilePics(scene, manifest);
    } else {
      logger.warn(`No manifest found for fighter: ${fighterId}`);
    }
  }
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
  logger.info('Creating fighter animations from packs...');

  const manifests = getAllManifests();
  for (const fighterId of FIGHTER_IDS) {
    const manifest = manifests[fighterId];
    if (manifest) {
      createPackAnimations(scene, manifest);
    }
  }
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
