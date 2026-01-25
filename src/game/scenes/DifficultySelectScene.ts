/**
 * @fileoverview Difficulty selection scene for story mode
 * @description Allows player to choose game difficulty before starting story
 */

import Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import type { AIDifficulty } from '../sim/FightingAI';
import { logger } from '../utils/logger';
import type { FighterId } from '../assets/fighterRegistry';

// =============================================================================
// Types
// =============================================================================

export interface DifficultySelectSceneData {
  /** Player's chosen fighter */
  playerFighterId: FighterId;
}

// =============================================================================
// DifficultySelectScene
// =============================================================================

export class DifficultySelectScene extends Phaser.Scene {
  private selectedDifficulty: AIDifficulty = 'medium';
  private difficulties: AIDifficulty[] = ['easy', 'medium', 'hard', 'nightmare'];
  private playerFighterId!: FighterId;
  private difficultyButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'DifficultySelectScene' });
  }

  init(data: DifficultySelectSceneData): void {
    this.playerFighterId = data.playerFighterId;
  }

  create(): void {
    // Initialize audio manager for this scene
    getAudioManager().init(this);

    // Background
    this.cameras.main.setBackgroundColor('#0a0a15');

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 60, '⚔️ SELECT DIFFICULTY ⚔️', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '40px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, 110, 'Choose how challenging your journey will be', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#aaaaaa',
    });
    subtitle.setOrigin(0.5);

    // Create difficulty buttons
    this.createDifficultyButtons();

    // Instructions
    const instructions = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'SELECT WITH ARROW KEYS • CONFIRM WITH ENTER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#666666',
    });
    instructions.setOrigin(0.5);

    // Create mobile back button
    this.createBackButton();

    // Input handling
    this.setupInput();
  }

  /** Create mobile back button */
  private createBackButton(): void {
    const backButton = this.add.container(50, 40);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x333344, 0.9);
    bg.fillRoundedRect(-35, -20, 70, 40, 8);
    bg.lineStyle(2, 0x666688);
    bg.strokeRoundedRect(-35, -20, 70, 40, 8);
    backButton.add(bg);

    // Back arrow and text
    const text = this.add.text(0, 0, '◀ BACK', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    backButton.add(text);

    // Make interactive
    backButton.setSize(70, 40);
    backButton.setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => this.scene.start('StorySelectScene'));
    backButton.setDepth(200);
  }

  /** Create difficulty selection buttons */
  private createDifficultyButtons(): void {
    const buttonWidth = 220;
    const buttonHeight = 100;
    const spacing = 250;
    const startY = GAME_HEIGHT / 2 - 50;
    const startX = GAME_WIDTH / 2 - (spacing * 1.5);

    const difficultyDescriptions: Record<AIDifficulty, { color: string; colorNum: number; description: string }> = {
      easy: {
        color: '#44ff44',
        colorNum: 0x44ff44,
        description: 'Slower reactions\nBasic patterns\nGood for learning',
      },
      medium: {
        color: '#ffcc00',
        colorNum: 0xffcc00,
        description: 'Balanced difficulty\nMixed strategies\nDefault experience',
      },
      hard: {
        color: '#ff6644',
        colorNum: 0xff6644,
        description: 'Fast reactions\nAggressive combat\nFor veterans',
      },
      nightmare: {
        color: '#ff0000',
        colorNum: 0xff0000,
        description: 'Extreme speed\nUnpredictable patterns\nUltimate challenge',
      },
    };

    this.difficulties.forEach((difficulty, index) => {
      const x = startX + index * spacing;
      const y = startY;
      const desc = difficultyDescriptions[difficulty];

      // Create container
      const container = this.add.container(x, y);
      this.difficultyButtons.push(container);

      // Background box
      const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x222233);
      bg.setStrokeStyle(2, desc.colorNum);
      container.add(bg);

      // Difficulty name
      const nameText = this.add.text(0, -30, difficulty.toUpperCase(), {
        fontFamily: 'Impact, sans-serif',
        fontSize: '22px',
        color: desc.color,
      });
      nameText.setOrigin(0.5);
      container.add(nameText);

      // Description
      const descText = this.add.text(0, 15, desc.description, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#aaaaaa',
        align: 'center',
        wordWrap: { width: buttonWidth - 20 },
      });
      descText.setOrigin(0.5);
      container.add(descText);

      // Store difficulty for reference
      (container as any).difficulty = difficulty;

      // Make interactive for touch/click
      container.setSize(buttonWidth, buttonHeight);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        this.selectedDifficulty = difficulty;
        this.updateSelection();
        // Confirm selection on tap
        this.confirmDifficulty();
      });
      container.on('pointerover', () => {
        this.selectedDifficulty = difficulty;
        this.updateSelection();
      });
    });

    // Initial selection
    this.updateSelection();
  }

  /** Setup input handling */
  private setupInput(): void {
    const keyboard = this.input.keyboard!;

    // Remove any existing listeners to prevent duplicates on scene restart
    keyboard.removeAllListeners();

    keyboard.on('keydown-LEFT', () => {
      const currentIndex = this.difficulties.indexOf(this.selectedDifficulty);
      if (currentIndex > 0) {
        this.selectedDifficulty = this.difficulties[currentIndex - 1]!;
        this.updateSelection();
        logger.info(`Difficulty: ${this.selectedDifficulty}`);
      }
    });

    keyboard.on('keydown-RIGHT', () => {
      const currentIndex = this.difficulties.indexOf(this.selectedDifficulty);
      if (currentIndex < this.difficulties.length - 1) {
        this.selectedDifficulty = this.difficulties[currentIndex + 1]!;
        this.updateSelection();
        logger.info(`Difficulty: ${this.selectedDifficulty}`);
      }
    });

    keyboard.on('keydown-ENTER', () => {
      this.confirmDifficulty();
    });

    keyboard.on('keydown-SPACE', () => {
      this.confirmDifficulty();
    });

    keyboard.on('keydown-ESC', () => {
      this.scene.start('StorySelectScene');
    });
  }

  /** Update selection visuals */
  private updateSelection(): void {
    this.difficultyButtons.forEach((button, index) => {
      const difficulty = this.difficulties[index];
      if (!difficulty) return;

      const bg = button.list[0] as Phaser.GameObjects.Rectangle;

      if (difficulty === this.selectedDifficulty) {
        // Selected state
        bg.setStrokeStyle(4, 0xffff00);
        bg.setFillStyle(0x444466);
        button.setScale(1.15);
        button.setDepth(10);
      } else {
        // Unselected state
        const colorNum = this.getDifficultyColorNum(difficulty);
        bg.setStrokeStyle(2, colorNum);
        bg.setFillStyle(0x222233);
        button.setScale(1);
        button.setDepth(1);
      }
    });
  }

  /** Get color number for difficulty */
  private getDifficultyColorNum(difficulty: AIDifficulty): number {
    const colors: Record<AIDifficulty, number> = {
      easy: 0x44ff44,
      medium: 0xffcc00,
      hard: 0xff6644,
      nightmare: 0xff0000,
    };
    return colors[difficulty];
  }

  /** Confirm difficulty selection and start story */
  private confirmDifficulty(): void {
    logger.info(`Story Mode: Selected difficulty: ${this.selectedDifficulty}`);

    this.cameras.main.fade(300, 0, 0, 0, false, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.start('StoryModeScene', {
          playerFighterId: this.playerFighterId,
          selectedDifficulty: this.selectedDifficulty,
        });
      }
    });
  }
}
