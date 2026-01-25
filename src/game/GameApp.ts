/**
 * @fileoverview Game application orchestrator
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ARCHITECTURE.md - Main application entry point
 */

import Phaser from 'phaser';

import { createGameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { FightScene } from './scenes/FightScene';
import { StorySelectScene } from './scenes/StorySelectScene';
import { StoryModeScene } from './scenes/StoryModeScene';
import { logger } from './utils/logger';

/**
 * Main game application class.
 * Orchestrates Phaser initialization and scene management.
 */
export class GameApp {
  private game: Phaser.Game | null = null;

  /**
   * Start the game application.
   */
  public start(): void {
    logger.info('Starting mITyFighter...');

    const config = createGameConfig({
      scenes: [BootScene, PreloadScene, TitleScene, ModeSelectScene, CharacterSelectScene, StageSelectScene, FightScene, StorySelectScene, StoryModeScene],
    });

    this.game = new Phaser.Game(config);

    logger.info('Game instance created');
  }

  /**
   * Destroy the game application.
   */
  public destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
      logger.info('Game destroyed');
    }
  }

  /**
   * Get the Phaser game instance.
   */
  public getGame(): Phaser.Game | null {
    return this.game;
  }
}
