/**
 * @fileoverview MK-style stage selection screen
 * @description Full-screen stage preview with selection controls
 */

import Phaser from 'phaser';

import {
  BACKGROUND_IDS,
  BACKGROUND_REGISTRY,
  type BackgroundId,
} from '../assets/backgroundRegistry';
import type { FighterId } from '../assets/fighterRegistry';
import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { TouchControls } from '../input/TouchControls';
import { logger } from '../utils/logger';

import type { GameMode } from './ModeSelectScene';

// =============================================================================
// Types
// =============================================================================

interface StageSelectData {
  p1FighterId: FighterId;
  p2FighterId: FighterId;
  gameMode?: GameMode;
}

// =============================================================================
// StageSelectScene
// =============================================================================

export class StageSelectScene extends Phaser.Scene {
  /** Selected fighters from character select */
  private p1FighterId!: FighterId;
  private p2FighterId!: FighterId;
  
  /** Game mode */
  private gameMode: GameMode = '2P';

  /** Current stage index */
  private stageIndex = 0;

  /** DOM elements for animated background preview */
  private previewContainer?: HTMLDivElement;
  private previewElement?: HTMLVideoElement | HTMLImageElement;

  /** UI elements */
  private stageNameText!: Phaser.GameObjects.Text;
  private stageDescriptionText!: Phaser.GameObjects.Text;
  private counterText!: Phaser.GameObjects.Text;

  /** Touch mode */
  private isTouchMode = false;
  private leftArrow!: Phaser.GameObjects.Text;
  private rightArrow!: Phaser.GameObjects.Text;

  /** Input keys */
  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    confirm: Phaser.Input.Keyboard.Key;
    altLeft: Phaser.Input.Keyboard.Key;
    altRight: Phaser.Input.Keyboard.Key;
    escape: Phaser.Input.Keyboard.Key;
  };

  /** Mobile back button */
  private backButton?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'StageSelectScene' });
  }

  init(data: StageSelectData): void {
    this.p1FighterId = data.p1FighterId;
    this.p2FighterId = data.p2FighterId;
    this.gameMode = data.gameMode ?? '2P';
    this.stageIndex = 0;
  }

  create(): void {
    logger.info('StageSelectScene started');

    // Initialize audio manager for this scene
    getAudioManager().init(this);

    // Check for touch mode
    this.isTouchMode = TouchControls.shouldShowTouchControls();

    // Transparent background (we use DOM for stage preview)
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    this.createDOMPreview();
    this.createUI();
    this.setupInput();
    this.updateStagePreview();

    // Add mobile back button
    if (this.isTouchMode) {
      this.createBackButton();
    }
  }

  /** Create DOM-based preview container for animated backgrounds */
  private createDOMPreview(): void {
    const canvas = this.game.canvas;
    const phaserWrapper = canvas.parentElement;

    if (!phaserWrapper) {
      logger.error('Cannot find Phaser wrapper element');
      return;
    }

    phaserWrapper.style.position = 'relative';

    // Create full-screen preview container
    this.previewContainer = document.createElement('div');
    this.previewContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    `;

    phaserWrapper.insertBefore(this.previewContainer, canvas);

    // Ensure canvas is above preview
    canvas.style.background = 'transparent';
    canvas.style.position = 'relative';
    canvas.style.zIndex = '1';
  }

  /** Create UI overlay */
  private createUI(): void {
    // Dark overlay at top for title
    const topOverlay = this.add.graphics();
    topOverlay.fillStyle(0x000000, 0.7);
    topOverlay.fillRect(0, 0, GAME_WIDTH, 100);

    // Title
    this.add
      .text(GAME_WIDTH / 2, 50, 'SELECT STAGE', {
        fontFamily: 'Impact, sans-serif',
        fontSize: '48px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Dark overlay at bottom for stage name and controls
    const bottomOverlay = this.add.graphics();
    bottomOverlay.fillStyle(0x000000, 0.7);
    bottomOverlay.fillRect(0, GAME_HEIGHT - 200, GAME_WIDTH, 200);

    // Left arrow
    this.leftArrow = this.add
      .text(100, GAME_HEIGHT - 100, '◀', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '64px',
        color: '#ffcc00',
      })
      .setOrigin(0.5);

    // Right arrow
    this.rightArrow = this.add
      .text(GAME_WIDTH - 100, GAME_HEIGHT - 100, '▶', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '64px',
        color: '#ffcc00',
      })
      .setOrigin(0.5);

    // Make arrows interactive for touch
    if (this.isTouchMode) {
      this.leftArrow.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.navigateLeft());
      this.rightArrow.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.navigateRight());
    }

    // Stage name
    this.stageNameText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 170, '', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '42px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.stageNameText.setOrigin(0.5);

    // Stage description
    this.stageDescriptionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 115, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 250 },
    });
    this.stageDescriptionText.setOrigin(0.5);

    // Stage counter (e.g., "3 / 19")
    this.counterText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#aaaaaa',
    });
    this.counterText.setOrigin(0.5);

    // Instructions
    const instructions = this.isTouchMode
      ? 'Tap Arrows to Browse | Tap Stage to Select'
      : 'A/D or ←/→: Browse | ENTER: Select';
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 25,
        instructions,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          color: '#888888',
        }
      )
      .setOrigin(0.5);

    // Make stage name tappable to confirm selection on touch
    if (this.isTouchMode) {
      // Create a confirm button
      const confirmButton = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'TAP TO SELECT', {
          fontFamily: 'Impact, sans-serif',
          fontSize: '36px',
          color: '#00ff00',
          stroke: '#000000',
          strokeThickness: 4,
          backgroundColor: '#000000aa',
          padding: { x: 30, y: 15 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectStage());
      
      // Pulse animation
      this.tweens.add({
        targets: confirmButton,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  /** Setup input */
  private setupInput(): void {
    const keyboard = this.input.keyboard!;

    this.keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      altLeft: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      altRight: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      confirm: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      escape: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };
  }

  /** Create mobile back button */
  private createBackButton(): void {
    this.backButton = this.add.container(50, 40);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x333344, 0.9);
    bg.fillRoundedRect(-35, -20, 70, 40, 8);
    bg.lineStyle(2, 0x666688);
    bg.strokeRoundedRect(-35, -20, 70, 40, 8);
    this.backButton.add(bg);

    // Back arrow and text
    const text = this.add.text(0, 0, '◀ BACK', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    this.backButton.add(text);

    // Make interactive
    this.backButton.setSize(70, 40);
    this.backButton.setInteractive({ useHandCursor: true });
    this.backButton.on('pointerdown', () => this.goBack());
    this.backButton.setDepth(200);
  }

  /** Go back to character select */
  private goBack(): void {
    this.cleanupDOM();
    this.scene.start('CharacterSelectScene', {
      gameMode: this.gameMode,
    });
  }

  update(): void {
    // Left navigation
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.left) ||
      Phaser.Input.Keyboard.JustDown(this.keys.altLeft)
    ) {
      this.navigateLeft();
    }

    // Right navigation
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.right) ||
      Phaser.Input.Keyboard.JustDown(this.keys.altRight)
    ) {
      this.navigateRight();
    }

    // Confirm selection
    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm)) {
      this.selectStage();
    }

    // Go back
    if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
      this.goBack();
    }
  }

  /** Navigate to previous stage */
  private navigateLeft(): void {
    this.stageIndex =
      (this.stageIndex - 1 + BACKGROUND_IDS.length) % BACKGROUND_IDS.length;
    this.updateStagePreview();
  }

  /** Navigate to next stage */
  private navigateRight(): void {
    this.stageIndex = (this.stageIndex + 1) % BACKGROUND_IDS.length;
    this.updateStagePreview();
  }

  /** Update the stage preview */
  private updateStagePreview(): void {
    if (!this.previewContainer || BACKGROUND_IDS.length === 0) return;

    // Remove existing preview
    if (this.previewElement) {
      this.previewElement.remove();
      this.previewElement = undefined!;
    }

    const stageId = BACKGROUND_IDS[this.stageIndex];
    if (!stageId) return;

    const bg = BACKGROUND_REGISTRY[stageId];
    if (!bg) return;

    const path = `backgrounds/${bg.file}`;

    // Update text
    this.stageNameText.setText(bg.displayName);
    this.stageDescriptionText.setText(bg.description ?? '');
    this.counterText.setText(`${this.stageIndex + 1} / ${BACKGROUND_IDS.length}`);

    // Create preview element
    if (bg.type === 'video') {
      const video = document.createElement('video');
      video.src = path;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        min-width: 100%;
        min-height: 100%;
        object-fit: cover;
        object-position: center bottom;
      `;

      video.onloadedmetadata = (): void => {
        video.play().catch((e): void => {
          logger.warn('Video autoplay blocked:', e);
        });
      };

      this.previewElement = video;
      this.previewContainer.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = path;
      img.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        min-width: 100%;
        min-height: 100%;
        object-fit: cover;
        object-position: center bottom;
      `;

      this.previewElement = img;
      this.previewContainer.appendChild(img);
    }
  }

  /** Select stage and start match */
  private selectStage(): void {
    const stageId: BackgroundId = BACKGROUND_IDS[this.stageIndex] ?? 'pit';

    logger.info(
      `Starting match: ${this.p1FighterId} vs ${this.p2FighterId} on ${stageId} (mode: ${this.gameMode})`
    );

    // Play "prepare yourself" audio
    getAudioManager().play('prepare_yourself');

    // Clean up DOM before transitioning
    this.cleanupDOM();

    this.scene.start('FightScene', {
      p1FighterId: this.p1FighterId,
      p2FighterId: this.p2FighterId,
      stageId,
      gameMode: this.gameMode,
    });
  }

  /** Clean up DOM elements */
  private cleanupDOM(): void {
    if (this.previewContainer) {
      this.previewContainer.remove();
    }
    this.previewContainer = undefined!;
    this.previewElement = undefined!;
  }

  /** Called when scene shuts down */
  shutdown(): void {
    this.cleanupDOM();
  }
}
