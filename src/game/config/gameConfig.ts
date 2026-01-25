/**
 * @fileoverview Phaser game configuration
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Pixel-perfect rendering settings
 */

import Phaser from 'phaser';

import { GAME_WIDTH, GAME_HEIGHT } from './constants';

/**
 * Input configuration options.
 */
export const INPUT_CONFIG = {
  /** Use numpad for P2 controls (set false for laptops) */
  useNumpad: true,
} as const;

/**
 * Options for creating the game configuration.
 */
interface GameConfigOptions {
  scenes: Array<new () => Phaser.Scene>;
}

/**
 * Create Phaser game configuration with pixel-perfect settings.
 *
 * @param options - Configuration options
 * @returns Phaser game configuration
 */
export function createGameConfig(
  options: GameConfigOptions
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 'transparent', // Transparent to show DOM background behind canvas
    transparent: true, // Enable canvas transparency

    // Pixel-perfect rendering
    pixelArt: true,
    antialias: false,
    roundPixels: true,

    // Responsive scaling
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      min: {
        width: GAME_WIDTH / 2,
        height: GAME_HEIGHT / 2,
      },
      max: {
        width: GAME_WIDTH * 2,
        height: GAME_HEIGHT * 2,
      },
    },

    // Physics (for future use)
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },

    // Input
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
    },

    // Scenes
    scene: options.scenes,
  };
}
