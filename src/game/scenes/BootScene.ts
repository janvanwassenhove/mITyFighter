/**
 * @fileoverview Boot scene - minimal setup before preloading
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ARCHITECTURE.md - Scene flow
 */

import Phaser from 'phaser';

import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { detectKeyboardLayout } from '../input/KeyboardLayout';
import { logger } from '../utils/logger';

/**
 * Boot scene - first scene to run.
 * Performs minimal setup and shows loading indicator.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Nothing to preload - keep this minimal
  }

  create(): void {
    logger.info('BootScene started');

    // Detect keyboard layout (QWERTY vs AZERTY)
    detectKeyboardLayout().then((layout) => {
      logger.info(`Keyboard layout detected: ${layout}`);
    });

    // Set up any global configurations
    this.setupInputDefaults();

    // Create a simple loading text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Proceed to preload scene
    this.scene.start('PreloadScene');
  }

  /**
   * Set up global input defaults.
   */
  private setupInputDefaults(): void {
    // Prevent context menu on right-click
    if (this.game.canvas) {
      this.game.canvas.oncontextmenu = (e) => e.preventDefault();
    }

    // Prevent default browser behavior for game keys
    // Include both QWERTY (WASD) and AZERTY (ZQSD) keys
    if (this.input.keyboard) {
      this.input.keyboard.addCapture([
        'W', 'A', 'S', 'D', 'Q', 'E', 'R', 'F', 'G', 'H',
        'Z', // AZERTY up key
        'U', 'I', 'O', 'P', 'J', 'K', 'L', 'Y',
        'C',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'F1',
      ]);
    }
  }
}
