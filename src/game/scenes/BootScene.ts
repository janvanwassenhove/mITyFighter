/**
 * @fileoverview Boot scene - minimal setup before preloading
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ARCHITECTURE.md - Scene flow
 */

import Phaser from 'phaser';

import { loadBackgroundsFromJson } from '../assets/backgroundRegistry';
import { loadFightersFromPacks } from '../assets/fighterRegistry';
import { loadAudioFromJson } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { detectKeyboardLayout } from '../input/KeyboardLayout';
import { logger } from '../utils/logger';

/**
 * Boot scene - first scene to run.
 * Performs minimal setup, loads JSON registries, and shows loading indicator.
 */
export class BootScene extends Phaser.Scene {
  private loadingText: Phaser.GameObjects.Text | null = null;

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
    this.loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading registries...', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Load JSON registries before proceeding to PreloadScene
    this.loadJsonRegistries();
  }

  /**
   * Load all JSON registries (fighters, backgrounds, audio).
   */
  private async loadJsonRegistries(): Promise<void> {
    try {
      logger.info('Loading JSON registries...');
      
      // Load all registries in parallel
      await Promise.all([
        loadFightersFromPacks(),
        loadBackgroundsFromJson(),
        loadAudioFromJson(),
      ]);
      
      logger.info('JSON registries loaded successfully');
      
      // Proceed to preload scene
      this.scene.start('PreloadScene');
    } catch (error) {
      logger.error('Failed to load JSON registries:', error);
      
      // Show error message
      if (this.loadingText) {
        this.loadingText.setText('Failed to load game data.\nPlease refresh the page.');
        this.loadingText.setColor('#ff4444');
      }
    }
  }

  /**
   * Set up global input defaults.
   */
  private setupInputDefaults(): void {
    // Prevent context menu on right-click
    if (this.game.canvas) {
      this.game.canvas.oncontextmenu = (e): boolean => {
        e.preventDefault();
        return false;
      };
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
