/**
 * @fileoverview Background asset loading utilities
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Background asset conventions
 */

import type Phaser from 'phaser';

import { logger } from '../utils/logger';

import { getBackgroundKey } from './AssetKeys';
import {
  BACKGROUND_REGISTRY,
  BACKGROUND_IDS,
  type BackgroundId,
} from './backgroundRegistry';

/** Base path for background assets */
const BACKGROUNDS_BASE_PATH = 'backgrounds';

// =============================================================================
// Loading
// =============================================================================

/**
 * Load all background images and videos.
 *
 * @param scene - Phaser scene with loader
 */
export function loadAllBackgrounds(scene: Phaser.Scene): void {
  logger.info(`Loading ${BACKGROUND_IDS.length} backgrounds...`);

  for (const backgroundId of BACKGROUND_IDS) {
    loadBackground(scene, backgroundId);
  }
}

/**
 * Load a single background (image or video).
 *
 * @param scene - Phaser scene with loader
 * @param backgroundId - Background to load
 */
export function loadBackground(
  scene: Phaser.Scene,
  backgroundId: BackgroundId
): void {
  // Early exit if no backgrounds registered
  if (BACKGROUND_IDS.length === 0) {
    return;
  }

  const background = BACKGROUND_REGISTRY[backgroundId];
  if (!background) {
    logger.warn(`Background not found in registry: ${backgroundId}`);
    return;
  }

  const assetKey = getBackgroundKey(backgroundId);
  const path = `${BACKGROUNDS_BASE_PATH}/${background.file}`;

  if (background.type === 'video') {
    // Load as video - Phaser 3.90 takes (key, url, noAudio?)
    scene.load.video(assetKey, path, true);
    logger.debug(`Queued loading for video background: ${String(backgroundId)}`);
  } else {
    // Load as image (gif will be loaded as static image)
    scene.load.image(assetKey, path);
    logger.debug(`Queued loading for image background: ${String(backgroundId)}`);
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if a background asset is loaded.
 *
 * @param scene - Phaser scene
 * @param backgroundId - Background identifier
 * @returns True if asset exists
 */
export function hasBackground(
  scene: Phaser.Scene,
  backgroundId: BackgroundId
): boolean {
  const assetKey = getBackgroundKey(backgroundId);
  const background = BACKGROUND_REGISTRY[backgroundId];
  
  if (!background) {
    return false;
  }
  
  if (background.type === 'video') {
    return scene.cache.video.exists(assetKey);
  }
  return scene.textures.exists(assetKey);
}
