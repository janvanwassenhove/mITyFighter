/**
 * @fileoverview Game mode selection screen
 * @description Choose between Story Mode, 1-Player (vs AI), or 2-Player mode
 */

import Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type GameMode = '1P' | '2P' | 'STORY';

export interface ModeSelectData {
  gameMode: GameMode;
}

// =============================================================================
// ModeSelectScene
// =============================================================================

export class ModeSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private modes: GameMode[] = ['STORY', '1P', '2P'];
  private modeButtons: Phaser.GameObjects.Container[] = [];
  private selectorGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'ModeSelectScene' });
  }

  create(): void {
    logger.info('ModeSelectScene started');

    // Initialize audio manager for this scene
    getAudioManager().init(this);

    // Dark background
    this.cameras.main.setBackgroundColor('#0a0a15');

    // Create background effects (similar to title)
    this.createBackgroundEffects();

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 120, 'SELECT MODE', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '64px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 6,
        fill: true,
      },
    });
    title.setOrigin(0.5);
    title.setScale(0);

    // Animate title
    this.tweens.add({
      targets: title,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Create mode buttons
    this.createModeButtons();

    // Create selector
    this.createSelector();

    // Instructions
    const instructions = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 80,
      '← → to select • ENTER to confirm • ESC to go back',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    instructions.setOrigin(0.5);

    // Setup input
    this.setupInput();

    // Initial update
    this.updateSelection();
  }

  /** Create animated background */
  private createBackgroundEffects(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(-1);

    // Floating particles
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.3);

      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, size);
    }

    // Animated gradient bars
    for (let i = 0; i < 3; i++) {
      const bar = this.add.rectangle(
        0,
        200 + i * 150,
        GAME_WIDTH * 2,
        60,
        0xff4444,
        0.03
      );
      bar.setOrigin(0, 0.5);
      bar.setDepth(-1);

      this.tweens.add({
        targets: bar,
        x: -GAME_WIDTH,
        duration: 12000 + i * 3000,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }

  /** Create the three mode selection buttons */
  private createModeButtons(): void {
    const buttonY = GAME_HEIGHT / 2;
    const buttonSpacing = 220;
    const startX = GAME_WIDTH / 2 - buttonSpacing;

    // Story Mode button (featured prominently)
    const btnStory = this.createModeButton(
      startX,
      buttonY,
      'STORY MODE',
      'FIGHT THE BOSS',
      '⚔️',
      true // featured
    );
    this.modeButtons.push(btnStory);

    // 1 Player button
    const btn1P = this.createModeButton(
      startX + buttonSpacing,
      buttonY,
      'VS CPU',
      'ARCADE BATTLE',
      '🤖',
      false
    );
    this.modeButtons.push(btn1P);

    // 2 Player button
    const btn2P = this.createModeButton(
      startX + buttonSpacing * 2,
      buttonY,
      '2 PLAYERS',
      'LOCAL VS',
      '👥',
      false
    );
    this.modeButtons.push(btn2P);

    // Animate buttons entrance
    this.modeButtons.forEach((btn, index) => {
      btn.setAlpha(0);
      btn.setScale(0.5);

      this.tweens.add({
        targets: btn,
        alpha: 1,
        scale: 1,
        duration: 400,
        delay: 200 + index * 150,
        ease: 'Back.easeOut',
      });
    });
  }

  /** Create a single mode button */
  private createModeButton(
    x: number,
    y: number,
    title: string,
    subtitle: string,
    icon: string,
    featured: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const boxWidth = featured ? 190 : 170;
    const boxHeight = featured ? 230 : 210;

    // Background box
    const bg = this.add.rectangle(0, 0, boxWidth, boxHeight, featured ? 0x332255 : 0x222244, 0.8);
    bg.setStrokeStyle(3, featured ? 0x9944ff : 0x444466);
    container.add(bg);

    // Featured badge for story mode
    if (featured) {
      const badge = this.add.text(0, -boxHeight / 2 - 15, '★ NEW ★', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#ffcc00',
      });
      badge.setOrigin(0.5);
      container.add(badge);
    }

    // Icon
    const iconText = this.add.text(0, -50, icon, {
      fontSize: '48px',
    });
    iconText.setOrigin(0.5);
    container.add(iconText);

    // Title
    const titleText = this.add.text(0, 20, title, {
      fontFamily: 'Impact, sans-serif',
      fontSize: featured ? '24px' : '26px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    titleText.setOrigin(0.5);
    container.add(titleText);

    // Subtitle
    const subtitleText = this.add.text(0, 55, subtitle, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: featured ? '#bb88ff' : '#aaaaaa',
    });
    subtitleText.setOrigin(0.5);
    container.add(subtitleText);

    return container;
  }

  /** Create the selection indicator */
  private createSelector(): void {
    this.selectorGraphics = this.add.graphics();
    this.selectorGraphics.setDepth(10);
  }

  /** Setup keyboard input */
  private setupInput(): void {
    const keyboard = this.input.keyboard!;

    keyboard.on('keydown-LEFT', () => this.moveSelection(-1));
    keyboard.on('keydown-RIGHT', () => this.moveSelection(1));
    keyboard.on('keydown-A', () => this.moveSelection(-1));
    keyboard.on('keydown-D', () => this.moveSelection(1));

    keyboard.on('keydown-ENTER', () => this.confirmSelection());
    keyboard.on('keydown-SPACE', () => this.confirmSelection());

    // Back to title
    keyboard.on('keydown-ESC', () => {
      this.scene.start('TitleScene');
    });

    // Click support
    this.modeButtons.forEach((btn, index) => {
      const bg = btn.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });
      bg.on('pointerdown', () => {
        this.selectedIndex = index;
        this.updateSelection();
        this.confirmSelection();
      });
    });
  }

  /** Move selection left or right */
  private moveSelection(direction: number): void {
    const newIndex = this.selectedIndex + direction;
    if (newIndex >= 0 && newIndex < this.modes.length) {
      this.selectedIndex = newIndex;
      this.updateSelection();
    }
  }

  /** Update visual selection state */
  private updateSelection(): void {
    // Update button visuals
    this.modeButtons.forEach((btn, index) => {
      const bg = btn.getAt(0) as Phaser.GameObjects.Rectangle;
      const isSelected = index === this.selectedIndex;
      const isFeatured = index === 0; // Story mode is index 0

      if (isSelected) {
        bg.setFillStyle(0x334477, 1);
        bg.setStrokeStyle(4, 0xffcc00);
        
        // Pulse animation
        this.tweens.add({
          targets: btn,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100,
          yoyo: true,
        });
      } else {
        bg.setFillStyle(isFeatured ? 0x332255 : 0x222244, 0.8);
        bg.setStrokeStyle(3, isFeatured ? 0x9944ff : 0x444466);
        btn.setScale(1);
      }
    });

    // Update selector graphics
    this.selectorGraphics.clear();
    const selectedBtn = this.modeButtons[this.selectedIndex];
    if (!selectedBtn) return;
    
    const x = selectedBtn.x;
    const y = selectedBtn.y;

    // Draw animated corner brackets
    this.selectorGraphics.lineStyle(3, 0xffcc00, 1);
    const size = 105;
    const corner = 15;

    // Top-left
    this.selectorGraphics.beginPath();
    this.selectorGraphics.moveTo(x - size, y - size + corner);
    this.selectorGraphics.lineTo(x - size, y - size);
    this.selectorGraphics.lineTo(x - size + corner, y - size);
    this.selectorGraphics.strokePath();

    // Top-right
    this.selectorGraphics.beginPath();
    this.selectorGraphics.moveTo(x + size - corner, y - size);
    this.selectorGraphics.lineTo(x + size, y - size);
    this.selectorGraphics.lineTo(x + size, y - size + corner);
    this.selectorGraphics.strokePath();

    // Bottom-left
    this.selectorGraphics.beginPath();
    this.selectorGraphics.moveTo(x - size, y + size - corner);
    this.selectorGraphics.lineTo(x - size, y + size);
    this.selectorGraphics.lineTo(x - size + corner, y + size);
    this.selectorGraphics.strokePath();

    // Bottom-right
    this.selectorGraphics.beginPath();
    this.selectorGraphics.moveTo(x + size - corner, y + size);
    this.selectorGraphics.lineTo(x + size, y + size);
    this.selectorGraphics.lineTo(x + size, y + size - corner);
    this.selectorGraphics.strokePath();
  }

  /** Confirm selection and proceed */
  private confirmSelection(): void {
    const selectedMode = this.modes[this.selectedIndex];
    if (!selectedMode) return;

    // Play mode-specific audio
    if (selectedMode === 'STORY') {
      getAudioManager().play('story_mode');
    } else if (selectedMode === '1P') {
      getAudioManager().play('arcade_mode');
    } else {
      getAudioManager().play('battle_mode');
    }

    // Flash effect
    this.cameras.main.flash(200, 255, 255, 255);

    // Scale up selected button
    const selectedBtn = this.modeButtons[this.selectedIndex];

    this.tweens.add({
      targets: selectedBtn,
      scale: 1.2,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        if (selectedMode === 'STORY') {
          // Story mode goes to its own character select
          this.scene.start('StorySelectScene');
        } else {
          // 1P and 2P go to regular character select
          this.scene.start('CharacterSelectScene', {
            gameMode: selectedMode,
          } as ModeSelectData);
        }
      },
    });

    logger.info(`Selected game mode: ${selectedMode}`);
  }
}
