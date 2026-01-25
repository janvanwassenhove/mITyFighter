/**
 * @fileoverview Preload scene - loads all game assets
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ARCHITECTURE.md - Scene flow
 * @see docs/ASSETS.md - Asset loading conventions
 */

import Phaser from 'phaser';

import { loadAllBackgrounds } from '../assets/BackgroundAssets';
import {
  loadAllFighters,
  createAllFighterAnimations,
} from '../assets/FighterAssets';
import { BACKGROUND_IDS } from '../assets/backgroundRegistry';
import { FIGHTER_IDS } from '../assets/fighterRegistry';
import { AudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { logger } from '../utils/logger';

/**
 * Preload scene - loads all game assets.
 * Shows progress bar during loading.
 */
export class PreloadScene extends Phaser.Scene {
  /** Progress bar graphics */
  private progressBar: Phaser.GameObjects.Graphics | null = null;

  /** Progress bar background */
  private progressBox: Phaser.GameObjects.Graphics | null = null;

  /** Loading text */
  private loadingText: Phaser.GameObjects.Text | null = null;

  /** Asset text */
  private assetText: Phaser.GameObjects.Text | null = null;

  /** Percent text */
  private percentText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    logger.info('PreloadScene started');

    this.createLoadingUI();
    this.setupLoadEvents();
    this.loadAssets();
  }

  /**
   * Create loading UI elements.
   */
  private createLoadingUI(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Progress bar background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(centerX - 160, centerY - 25, 320, 50);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 50, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Percent text
    this.percentText = this.add.text(centerX, centerY, '0%', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Asset text
    this.assetText = this.add.text(centerX, centerY + 50, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5);
  }

  /**
   * Set up loading event handlers.
   */
  private setupLoadEvents(): void {
    // Progress event
    this.load.on('progress', (value: number) => {
      this.progressBar?.clear();
      this.progressBar?.fillStyle(0x00ff00, 1);
      this.progressBar?.fillRect(
        GAME_WIDTH / 2 - 150,
        GAME_HEIGHT / 2 - 15,
        300 * value,
        30
      );
      this.percentText?.setText(`${Math.round(value * 100)}%`);
    });

    // File load event
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.assetText?.setText(`Loading: ${file.key}`);
    });

    // Complete event
    this.load.on('complete', () => {
      this.progressBar?.destroy();
      this.progressBox?.destroy();
      this.loadingText?.destroy();
      this.percentText?.destroy();
      this.assetText?.destroy();
    });
  }

  /**
   * Load all game assets.
   */
  private loadAssets(): void {
    logger.info(`Loading ${FIGHTER_IDS.length} fighters...`);
    loadAllFighters(this);

    logger.info(`Loading ${BACKGROUND_IDS.length} backgrounds...`);
    loadAllBackgrounds(this);

    logger.info('Loading audio assets...');
    AudioManager.loadAudio(this);
  }

  create(): void {
    logger.info('Creating animations...');
    createAllFighterAnimations(this);

    logger.info('Asset loading complete, starting TitleScene');
    this.scene.start('TitleScene');
  }
}
