/**
 * @fileoverview Game constants and configuration values
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Frame dimensions
 * @see docs/ANIMATIONS.md - Frame rates
 */

import type { ActionId } from '../assets/AssetKeys';

// =============================================================================
// Display
// =============================================================================

/** Game canvas width in pixels */
export const GAME_WIDTH = 1280;

/** Game canvas height in pixels */
export const GAME_HEIGHT = 720;

/** Ground offset from bottom of canvas */
export const GROUND_OFFSET = 100;

/** Ground Y position */
export const GROUND_Y = GAME_HEIGHT - GROUND_OFFSET;

// =============================================================================
// Sprites
// =============================================================================

/** Width of a single sprite frame in pixels */
export const FRAME_WIDTH = 128;

/** Height of a single sprite frame in pixels */
export const FRAME_HEIGHT = 128;

/** Default sprite scale for display */
export const SPRITE_SCALE = 2;

// =============================================================================
// Simulation
// =============================================================================

/** Fixed simulation tick rate (ticks per second) */
export const TICK_RATE = 60;

/** Duration of a single tick in milliseconds */
export const TICK_DURATION_MS = 1000 / TICK_RATE;

// =============================================================================
// Animations
// =============================================================================

/** Default animation frame rate */
export const DEFAULT_FRAME_RATE = 10;

/** Frame rates for specific actions */
export const ACTION_FRAME_RATES: Partial<Record<ActionId, number>> = {
  idle: 8,
  idle2: 8,
  walk: 10,
  run: 12,
  jump: 12,
  hurt: 10,
  dead: 10,
  attack1: 15,
  attack2: 15,
  attack3: 15,
  special: 12,
  cast: 12,
  eating: 8,
  spine: 15,
  blade: 15,
  kunai: 15,
  dart: 15,
  shot: 15,
  disguise: 10,
};

/** Actions that loop continuously */
export const LOOPING_ACTIONS: readonly ActionId[] = [
  'idle',
  'idle2',
  'walk',
  'run',
] as const;

/** Fallback actions when idle is not available */
export const IDLE_FALLBACKS: readonly ActionId[] = ['idle', 'idle2'] as const;

// =============================================================================
// Players
// =============================================================================

/** Player identifiers */
export const enum PlayerId {
  // eslint-disable-next-line no-unused-vars
  P1 = 0,
  // eslint-disable-next-line no-unused-vars
  P2 = 1,
}

/** Number of players */
export const PLAYER_COUNT = 2;

/** Starting positions for players */
export const PLAYER_START_POSITIONS: Record<
  PlayerId,
  { x: number; y: number }
> = {
  [PlayerId.P1]: { x: GAME_WIDTH * 0.3, y: GROUND_Y },
  [PlayerId.P2]: { x: GAME_WIDTH * 0.7, y: GROUND_Y },
};

/** Facing directions */
export const enum FacingDirection {
  // eslint-disable-next-line no-unused-vars
  LEFT = -1,
  // eslint-disable-next-line no-unused-vars
  RIGHT = 1,
}

/** Starting facing directions for players */
export const PLAYER_START_FACING: Record<PlayerId, FacingDirection> = {
  [PlayerId.P1]: FacingDirection.RIGHT,
  [PlayerId.P2]: FacingDirection.LEFT,
};
