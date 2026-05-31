/**
 * @fileoverview About screen with credits and links
 * @description Shows game information and creator credits
 */

import Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { logger } from '../utils/logger';

// =============================================================================
// AboutScene
// =============================================================================

export class AboutScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AboutScene' });
  }

  create(): void {
    logger.info('AboutScene started');

    // Initialize audio manager for this scene
    getAudioManager().init(this);

    // Dark background
    this.cameras.main.setBackgroundColor('#0a0a15');

    // Create background effects
    this.createBackgroundEffects();

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 80, 'ABOUT', {
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

    // Game title
    const gameTitle = this.add.text(GAME_WIDTH / 2, 180, 'DEVOXX FIGHTER', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '48px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
    });
    gameTitle.setOrigin(0.5);

    // Version
    const version = this.add.text(GAME_WIDTH / 2, 230, 'v1.0.0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#888888',
    });
    version.setOrigin(0.5);

    // Description box
    const descBg = this.add.rectangle(GAME_WIDTH / 2, 340, 700, 160, 0x222244, 0.8);
    descBg.setStrokeStyle(2, 0x444466);

    const description = this.add.text(
      GAME_WIDTH / 2,
      340,
      'A pixel-art 2D fighting game built with TypeScript and Phaser 3.\n\n' +
      'Features local multiplayer, story mode, and classic arcade combat.\n' +
      'Inspired by retro fighting games with modern web technologies.',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#cccccc',
        align: 'center',
        lineSpacing: 8,
      }
    );
    description.setOrigin(0.5);

    // Creator section
    const creatorLabel = this.add.text(GAME_WIDTH / 2, 460, 'Created by', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#888888',
    });
    creatorLabel.setOrigin(0.5);

    const creatorName = this.add.text(GAME_WIDTH / 2, 490, 'mITyJohn', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '32px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 3,
    });
    creatorName.setOrigin(0.5);

    // Website link (clickable)
    const websiteText = this.add.text(GAME_WIDTH / 2, 540, '🌐 mityjohn.com', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#66aaff',
    });
    websiteText.setOrigin(0.5);
    websiteText.setInteractive({ useHandCursor: true });

    // Hover effects for link
    websiteText.on('pointerover', () => {
      websiteText.setColor('#99ccff');
      websiteText.setScale(1.05);
    });

    websiteText.on('pointerout', () => {
      websiteText.setColor('#66aaff');
      websiteText.setScale(1);
    });

    websiteText.on('pointerdown', () => {
      window.open('https://mityjohn.com/', '_blank');
    });

    // Technologies used
    const techLabel = this.add.text(GAME_WIDTH / 2, 600, 'Built with', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#666666',
    });
    techLabel.setOrigin(0.5);

    const techStack = this.add.text(
      GAME_WIDTH / 2,
      625,
      'TypeScript • Phaser 3 • Vite',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#888888',
      }
    );
    techStack.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 40,
      'Press ESC or ENTER to go back',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    instructions.setOrigin(0.5);

    // Setup input
    this.setupInput();
  }

  /** Create animated background */
  private createBackgroundEffects(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(-1);

    // Floating particles
    for (let i = 0; i < 30; i++) {
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
        150 + i * 180,
        GAME_WIDTH * 2,
        50,
        0x4444ff,
        0.03
      );
      bar.setOrigin(0, 0.5);
      bar.setDepth(-1);

      this.tweens.add({
        targets: bar,
        x: -GAME_WIDTH,
        duration: 15000 + i * 2000,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }

  /** Setup keyboard input */
  private setupInput(): void {
    const keyboard = this.input.keyboard!;

    // Remove any existing listeners
    keyboard.removeAllListeners();

    // Go back
    keyboard.on('keydown-ESC', () => this.goBack());
    keyboard.on('keydown-ENTER', () => this.goBack());

    // Click anywhere to go back (except on link)
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => {
      if (gameObjects.length === 0) {
        this.goBack();
      }
    });
  }

  /** Return to title scene */
  private goBack(): void {
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('TitleScene', { showMenu: true });
    });
  }
}
