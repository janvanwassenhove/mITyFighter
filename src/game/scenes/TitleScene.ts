/**
 * @fileoverview Title/Splash screen scene
 * @description MK-style title screen with animated text
 */

import Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { logger } from '../utils/logger';

// =============================================================================
// TitleScene
// =============================================================================

export class TitleScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private pressStartText!: Phaser.GameObjects.Text;
  private blinkTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    logger.info('TitleScene started');

    // Initialize audio manager for this scene
    getAudioManager().init(this);

    // Dark background with gradient effect
    this.cameras.main.setBackgroundColor('#0a0a15');

    // Add animated background particles
    this.createBackgroundEffects();

    // Main title
    this.titleText = this.add.text(GAME_WIDTH / 2, 200, 'mITy FIGHTER', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '96px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true,
      },
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setScale(0);

    // Title entrance animation
    this.tweens.add({
      targets: this.titleText,
      scale: 1,
      duration: 800,
      ease: 'Back.easeOut',
      delay: 300,
    });

    // Subtitle
    this.subtitleText = this.add.text(
      GAME_WIDTH / 2,
      300,
      '⚔️ PIXEL KOMBAT ⚔️',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    this.subtitleText.setOrigin(0.5);
    this.subtitleText.setAlpha(0);

    this.tweens.add({
      targets: this.subtitleText,
      alpha: 1,
      y: 310,
      duration: 600,
      ease: 'Power2',
      delay: 900,
    });

    // Press Start text
    this.pressStartText = this.add.text(
      GAME_WIDTH / 2,
      500,
      'PRESS ENTER TO START',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }
    );
    this.pressStartText.setOrigin(0.5);
    this.pressStartText.setAlpha(0);

    // Show press start after delay
    this.time.delayedCall(1500, () => {
      this.pressStartText.setAlpha(1);
      this.startBlinking();
    });

    // Credits
    const creditsText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 60,
      'A 2D Pixel Fighting Game',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#666666',
      }
    );
    creditsText.setOrigin(0.5);

    const versionText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 35,
      'v1.0.0 | Built with Phaser 3',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#444444',
      }
    );
    versionText.setOrigin(0.5);

    // Input
    this.input.keyboard!.on('keydown-ENTER', this.startGame, this);
    this.input.keyboard!.on('keydown-SPACE', this.startGame, this);

    // Also allow clicking
    this.input.on('pointerdown', this.startGame, this);
  }

  /** Create background visual effects */
  private createBackgroundEffects(): void {
    // Create some floating particles
    const graphics = this.add.graphics();
    graphics.setDepth(-1);

    // Draw some decorative elements
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.3);

      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, size);
    }

    // Add subtle animated gradient bars
    for (let i = 0; i < 5; i++) {
      const bar = this.add.rectangle(
        0,
        150 + i * 100,
        GAME_WIDTH * 2,
        50,
        0xff4444,
        0.03
      );
      bar.setOrigin(0, 0.5);
      bar.setDepth(-1);

      this.tweens.add({
        targets: bar,
        x: -GAME_WIDTH,
        duration: 10000 + i * 2000,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }

  /** Start the press start blinking animation */
  private startBlinking(): void {
    this.blinkTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        this.pressStartText.setVisible(!this.pressStartText.visible);
      },
      loop: true,
    });
  }

  /** Transition to character select */
  private startGame(): void {
    if (this.blinkTimer) {
      this.blinkTimer.remove();
    }

    // Play "begin" audio
    getAudioManager().play('begin');

    // Flash effect
    this.cameras.main.flash(300, 255, 255, 255);

    // Quick fade and transition
    this.tweens.add({
      targets: [this.titleText, this.subtitleText, this.pressStartText],
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => {
        this.scene.start('ModeSelectScene');
      },
    });
  }
}
