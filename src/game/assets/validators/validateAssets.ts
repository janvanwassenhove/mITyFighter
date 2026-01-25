/**
 * @fileoverview Asset validation utilities
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/QUALITY_GATES.md - validate:assets script
 */

import type { ActionId } from '../AssetKeys';
import type { FighterId } from '../fighterRegistry';
import type { BackgroundId } from '../backgroundRegistry';
import { FRAME_WIDTH, FRAME_HEIGHT } from '../../config/constants';

// =============================================================================
// Types
// =============================================================================

/**
 * Validation error.
 */
export interface ValidationError {
  type: 'fighter' | 'background';
  id: string;
  action?: ActionId;
  message: string;
}

/**
 * Asset info from validation.
 */
export interface AssetInfo {
  path: string;
  width: number;
  height: number;
  frameCount: number;
}

/**
 * Validation result.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  assets: Map<string, AssetInfo>;
}

// =============================================================================
// Validation Logic
// =============================================================================

/**
 * Validate sprite dimensions.
 *
 * @param width - Image width
 * @param height - Image height
 * @returns Object with validation result and frame count
 */
export function validateSpriteDimensions(
  width: number,
  height: number
): { valid: boolean; frameCount: number; error?: string } {
  // Height must match frame height
  if (height !== FRAME_HEIGHT) {
    return {
      valid: false,
      frameCount: 0,
      error: `Height ${height} does not match expected ${FRAME_HEIGHT}`,
    };
  }

  // Width must be multiple of frame width
  if (width % FRAME_WIDTH !== 0) {
    return {
      valid: false,
      frameCount: 0,
      error: `Width ${width} is not a multiple of ${FRAME_WIDTH}`,
    };
  }

  const frameCount = width / FRAME_WIDTH;

  if (frameCount < 1) {
    return {
      valid: false,
      frameCount: 0,
      error: `Invalid frame count: ${frameCount}`,
    };
  }

  return { valid: true, frameCount };
}

/**
 * Build asset path for a fighter action.
 *
 * @param basePath - Fighter base path
 * @param filename - Action filename
 * @returns Full asset path
 */
export function buildFighterAssetPath(
  basePath: string,
  filename: string
): string {
  return `${basePath}/${filename}`;
}

/**
 * Build asset path for a background.
 *
 * @param filename - Background filename
 * @returns Full asset path
 */
export function buildBackgroundAssetPath(filename: string): string {
  return `backgrounds/${filename}`;
}

// =============================================================================
// Registry Validation (for unit tests)
// =============================================================================

/**
 * Validate that a fighter ID exists in the registry.
 *
 * @param fighterId - Fighter ID to validate
 * @param registry - Fighter registry
 * @returns True if valid
 */
export function isValidFighterInRegistry(
  fighterId: string,
  registry: Record<string, unknown>
): fighterId is FighterId {
  return fighterId in registry;
}

/**
 * Validate that a background ID exists in the registry.
 *
 * @param backgroundId - Background ID to validate
 * @param registry - Background registry
 * @returns True if valid
 */
export function isValidBackgroundInRegistry(
  backgroundId: string,
  registry: Record<string, unknown>
): backgroundId is BackgroundId {
  return backgroundId in registry;
}

/**
 * Get expected filename for an action.
 *
 * @param actionId - Action ID
 * @returns Expected filename or null
 */
export function getExpectedFilename(actionId: ActionId): string {
  const mapping: Record<ActionId, string> = {
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

  return mapping[actionId];
}
