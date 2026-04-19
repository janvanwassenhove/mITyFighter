/**
 * @fileoverview Title/Splash screen scene
 * @description MK-style title screen with animated text and menu options
 */

import Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { getActiveTheme } from '../config/themes';
import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

interface MenuItem {
  text: Phaser.GameObjects.Text;
  action: () => void;
}

// =============================================================================
// TitleScene
// =============================================================================

export class TitleScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private pressStartText!: Phaser.GameObjects.Text;
  private blinkTimer?: Phaser.Time.TimerEvent;
  
  // Menu state
  private menuItems: MenuItem[] = [];
  private selectedMenuIndex = 0;
  private menuVisible = false;

  /** Whether to show menu immediately (when returning from Settings/About) */
  private showMenuOnStart = false;

  constructor() {
    super({ key: 'TitleScene' });
  }

  init(data?: { showMenu?: boolean }): void {
    this.showMenuOnStart = data?.showMenu ?? false;
    // Reset menu state
    this.menuItems = [];
    this.selectedMenuIndex = 0;
    this.menuVisible = false;
  }

  create(): void {
    logger.info('TitleScene started');

    // Initialize audio manager for this scene
    getAudioManager().init(this);

    const theme = getActiveTheme();

    // Dark background with gradient effect
    this.cameras.main.setBackgroundColor(theme.colors.background);

    // Add animated background particles
    this.createBackgroundEffects();

    // Main title
    this.titleText = this.add.text(GAME_WIDTH / 2, 200, 'DEVOXX FIGHTER', {
      fontFamily: theme.fonts.title,
      fontSize: '96px',
      color: theme.colors.highlight,
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
        fontFamily: theme.fonts.body,
        fontSize: '32px',
        color: theme.colors.primary,
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
        fontFamily: theme.fonts.body,
        fontSize: '28px',
        color: theme.colors.text,
        stroke: '#000000',
        strokeThickness: 3,
      }
    );
    this.pressStartText.setOrigin(0.5);
    this.pressStartText.setAlpha(0);

    // Create menu items (hidden initially)
    this.createMenu();

    // Show press start after delay, or show menu immediately if returning from Settings/About
    if (this.showMenuOnStart) {
      // Skip intro animations, show menu directly
      this.titleText.setScale(1);
      this.subtitleText.setAlpha(1);
      this.showMenu();
    } else {
      this.time.delayedCall(1500, () => {
        this.pressStartText.setAlpha(1);
        this.startBlinking();
      });
    }

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

    // Input - remove any existing listeners first to prevent duplicates on scene restart
    this.input.keyboard!.removeAllListeners();
    this.input.keyboard!.on('keydown-ENTER', this.handleEnter, this);
    this.input.keyboard!.on('keydown-SPACE', this.handleEnter, this);
    this.input.keyboard!.on('keydown-UP', this.handleUp, this);
    this.input.keyboard!.on('keydown-DOWN', this.handleDown, this);
    this.input.keyboard!.on('keydown-W', this.handleUp, this);
    this.input.keyboard!.on('keydown-S', this.handleDown, this);

    // Also allow clicking
    this.input.on('pointerdown', this.handleEnter, this);
  }

  /** Create the main menu options */
  private createMenu(): void {
    const menuStartY = 480;
    const menuSpacing = 50;

    const menuOptions = [
      { label: '▶ START GAME', action: () => this.startGame() },
      { label: '⚙ SETTINGS', action: () => this.goToSettings() },
      { label: 'ℹ ABOUT', action: () => this.goToAbout() },
    ];

    const theme = getActiveTheme();

    menuOptions.forEach((option, index) => {
      const text = this.add.text(GAME_WIDTH / 2, menuStartY + index * menuSpacing, option.label, {
        fontFamily: theme.fonts.body,
        fontSize: '26px',
        color: theme.colors.text,
        stroke: '#000000',
        strokeThickness: 3,
      });
      text.setOrigin(0.5);
      text.setAlpha(0);
      text.setInteractive({ useHandCursor: true });

      // Hover effects
      text.on('pointerover', () => {
        if (this.menuVisible) {
          this.selectedMenuIndex = index;
          this.updateMenuSelection();
        }
      });

      text.on('pointerdown', () => {
        if (this.menuVisible) {
          this.selectedMenuIndex = index;
          this.updateMenuSelection();
          this.confirmMenuSelection();
        }
      });

      this.menuItems.push({ text, action: option.action });
    });
  }

  /** Handle enter/space key */
  private handleEnter(): void {
    if (!this.menuVisible) {
      this.showMenu();
    } else {
      this.confirmMenuSelection();
    }
  }

  /** Handle up key */
  private handleUp(): void {
    if (!this.menuVisible) return;
    this.selectedMenuIndex = (this.selectedMenuIndex - 1 + this.menuItems.length) % this.menuItems.length;
    this.updateMenuSelection();
  }

  /** Handle down key */
  private handleDown(): void {
    if (!this.menuVisible) return;
    this.selectedMenuIndex = (this.selectedMenuIndex + 1) % this.menuItems.length;
    this.updateMenuSelection();
  }

  /** Show the menu and hide press start */
  private showMenu(): void {
    if (this.menuVisible) return;
    this.menuVisible = true;

    // Stop blinking and hide press start
    if (this.blinkTimer) {
      this.blinkTimer.remove();
    }
    
    this.tweens.add({
      targets: this.pressStartText,
      alpha: 0,
      duration: 200,
    });

    // Show menu items
    this.menuItems.forEach((item, index) => {
      this.tweens.add({
        targets: item.text,
        alpha: 1,
        y: item.text.y - 10,
        duration: 300,
        delay: index * 100,
        ease: 'Back.easeOut',
      });
    });

    // Initial selection
    this.updateMenuSelection();
  }

  /** Update menu selection visual */
  private updateMenuSelection(): void {
    const theme = getActiveTheme();
    this.menuItems.forEach((item, index) => {
      const isSelected = index === this.selectedMenuIndex;
      item.text.setColor(isSelected ? theme.colors.primary : theme.colors.text);
      item.text.setScale(isSelected ? 1.1 : 1);
    });
  }

  /** Confirm the current menu selection */
  private confirmMenuSelection(): void {
    const selected = this.menuItems[this.selectedMenuIndex];
    if (selected) {
      selected.action();
    }
  }

  /** Go to settings scene */
  private goToSettings(): void {
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('SettingsScene');
    });
  }

  /** Go to about scene */
  private goToAbout(): void {
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('AboutScene');
    });
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
    const theme = getActiveTheme();
    for (let i = 0; i < 5; i++) {
      const bar = this.add.rectangle(
        0,
        150 + i * 100,
        GAME_WIDTH * 2,
        50,
        theme.colors.highlightHex,
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
