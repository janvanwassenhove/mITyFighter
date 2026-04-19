/**
 * @fileoverview MK-style character selection screen
 * @description Grid-based fighter selection for 2 players
 */

import Phaser from 'phaser';

import { getFighterTextureKey, getProfilePicKey } from '../assets/AssetKeys';
import {
  FIGHTER_IDS,
  FIGHTER_REGISTRY,
} from '../assets/fighterRegistry';
import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import {
  getP1MovementKeysDisplay,
  getP1PhaserKeyCodes,
} from '../input/KeyboardLayout';
import { TouchControls } from '../input/TouchControls';
import { logger } from '../utils/logger';

import type { GameMode, ModeSelectData } from './ModeSelectScene';


// =============================================================================
// Constants
// =============================================================================

const GRID_COLS = 6;
const PORTRAIT_SIZE = 100;
const PORTRAIT_GAP = 12;
const GRID_Y = 200;

// =============================================================================
// CharacterSelectScene
// =============================================================================

export class CharacterSelectScene extends Phaser.Scene {
  /** Game mode (1P vs AI or 2P) */
  private gameMode: GameMode = '2P';

  /** Player 1's current selection index */
  private p1Index = 0;
  /** Player 2's current selection index */
  private p2Index = 1;

  /** Player 1 confirmed selection */
  private p1Confirmed = false;
  /** Player 2 confirmed selection */
  private p2Confirmed = false;

  /** UI elements */
  private portraits: Phaser.GameObjects.Container[] = [];
  private p1Cursor!: Phaser.GameObjects.Graphics;
  private p2Cursor!: Phaser.GameObjects.Graphics;
  private p1NameText!: Phaser.GameObjects.Text;
  private p2NameText!: Phaser.GameObjects.Text;
  private p1Preview!: Phaser.GameObjects.Sprite;
  private p2Preview!: Phaser.GameObjects.Sprite;
  private p1TaglineText!: Phaser.GameObjects.Text;
  private p2TaglineText!: Phaser.GameObjects.Text;
  private p1BioText!: Phaser.GameObjects.Text;
  private p2BioText!: Phaser.GameObjects.Text;
  private p1MotivationText!: Phaser.GameObjects.Text;
  private p2MotivationText!: Phaser.GameObjects.Text;
  private instructionsText!: Phaser.GameObjects.Text;

  /** Input keys */
  private keys!: {
    p1Left: Phaser.Input.Keyboard.Key;
    p1Right: Phaser.Input.Keyboard.Key;
    p1Up: Phaser.Input.Keyboard.Key;
    p1Down: Phaser.Input.Keyboard.Key;
    p1Confirm: Phaser.Input.Keyboard.Key;
    p2Left: Phaser.Input.Keyboard.Key;
    p2Right: Phaser.Input.Keyboard.Key;
    p2Up: Phaser.Input.Keyboard.Key;
    p2Down: Phaser.Input.Keyboard.Key;
    p2Confirm: Phaser.Input.Keyboard.Key;
    start: Phaser.Input.Keyboard.Key;
    escape: Phaser.Input.Keyboard.Key;
  };

  /** Mobile back button */
  private backButton?: Phaser.GameObjects.Container;

  /** Touch mode state */
  private isTouchMode = false;
  /** Touch UI buttons */
  private startButton?: Phaser.GameObjects.Container;
  private p1ChangeButton?: Phaser.GameObjects.Container;
  private p2ChangeButton?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data?: ModeSelectData): void {
    // Get game mode from scene data, default to 2P
    this.gameMode = data?.gameMode ?? '2P';
    
    // Reset selection state
    this.p1Index = 0;
    this.p1Confirmed = false;
    
    if (this.gameMode === '1P') {
      // In 1P mode, auto-confirm P2 with random fighter
      this.p2Index = Phaser.Math.Between(0, FIGHTER_IDS.length - 1);
      // Make sure P2 is different from P1's initial selection
      if (this.p2Index === this.p1Index) {
        this.p2Index = (this.p2Index + 1) % FIGHTER_IDS.length;
      }
      this.p2Confirmed = true;
    } else {
      this.p2Index = Math.min(1, FIGHTER_IDS.length - 1);
      this.p2Confirmed = false;
    }
    
    logger.info(`CharacterSelectScene init: mode=${this.gameMode}`);
  }

  create(): void {
    logger.info('CharacterSelectScene started');

    // Initialize audio manager for this scene
    getAudioManager().init(this);
    
    // Play "Choose your character" voice clip
    getAudioManager().play('choose_your_character');

    // Check if touch mode
    this.isTouchMode = TouchControls.shouldShowTouchControls();

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add
      .text(GAME_WIDTH / 2, 50, 'SELECT YOUR FIGHTER', {
        fontFamily: 'Impact, sans-serif',
        fontSize: '48px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.createPortraitGrid();
    this.createCursors();
    this.createPreviews();
    this.createInstructions();
    this.setupInput();

    // Add touch-specific UI
    if (this.isTouchMode) {
      this.setupTouchUI();
      this.createBackButton();
    }

    this.updateCursors();
    this.updatePreviews();
  }

  /** Create the fighter portrait grid */
  private createPortraitGrid(): void {
    const totalWidth =
      GRID_COLS * PORTRAIT_SIZE + (GRID_COLS - 1) * PORTRAIT_GAP;
    const startX = (GAME_WIDTH - totalWidth) / 2 + PORTRAIT_SIZE / 2;

    FIGHTER_IDS.forEach((fighterId, index) => {
      const col = index % GRID_COLS;
      const row = Math.floor(index / GRID_COLS);
      const x = startX + col * (PORTRAIT_SIZE + PORTRAIT_GAP);
      const y = GRID_Y + row * (PORTRAIT_SIZE + PORTRAIT_GAP);

      const container = this.add.container(x, y);

      // Background box
      const bg = this.add.graphics();
      bg.fillStyle(0x333333, 1);
      bg.fillRect(
        -PORTRAIT_SIZE / 2,
        -PORTRAIT_SIZE / 2,
        PORTRAIT_SIZE,
        PORTRAIT_SIZE
      );
      bg.lineStyle(3, 0x666666, 1);
      bg.strokeRect(
        -PORTRAIT_SIZE / 2,
        -PORTRAIT_SIZE / 2,
        PORTRAIT_SIZE,
        PORTRAIT_SIZE
      );
      container.add(bg);

      // Fighter portrait - use profile pic (head-closeup) if available, else idle frame 0
      const fighter = FIGHTER_REGISTRY[fighterId];
      const profileKey = getProfilePicKey(fighterId, 'head-closeup');
      const textureKey = getFighterTextureKey(fighterId, 'idle');

      if (fighter && this.textures.exists(profileKey)) {
        // Use profile pic — scale to fill portrait box exactly
        const img = this.add.image(0, 0, profileKey);
        img.setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE);
        img.setOrigin(0.5, 0.5);
        container.add(img);
      } else if (fighter && this.textures.exists(textureKey)) {
        // Fallback: idle sprite frame 0, zoomed to fill the box
        const scale = (PORTRAIT_SIZE / fighter.frameHeight) * 2.5;
        const sprite = this.add.sprite(0, 0, textureKey, 0);
        sprite.setScale(scale);
        sprite.setOrigin(0.5, 1);
        sprite.setY(PORTRAIT_SIZE / 2);

        // Mask to clip sprite to portrait box
        const maskShape = this.make.graphics({ x: 0, y: 0 });
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(
          x - PORTRAIT_SIZE / 2,
          y - PORTRAIT_SIZE / 2,
          PORTRAIT_SIZE,
          PORTRAIT_SIZE
        );
        const mask = maskShape.createGeometryMask();
        sprite.setMask(mask);

        container.add(sprite);
      }

      // Make container interactive for touch/click selection
      container.setSize(PORTRAIT_SIZE, PORTRAIT_SIZE);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.onPortraitTapped(index));

      this.portraits.push(container);
    });
  }

  /** Create selection cursors */
  private createCursors(): void {
    // P1 cursor (blue)
    this.p1Cursor = this.add.graphics();
    this.p1Cursor.lineStyle(4, 0x00aaff, 1);
    this.p1Cursor.strokeRect(
      -PORTRAIT_SIZE / 2 - 5,
      -PORTRAIT_SIZE / 2 - 5,
      PORTRAIT_SIZE + 10,
      PORTRAIT_SIZE + 10
    );
    this.p1Cursor.setDepth(10);

    // P2 cursor (red)
    this.p2Cursor = this.add.graphics();
    this.p2Cursor.lineStyle(4, 0xff4444, 1);
    this.p2Cursor.strokeRect(
      -PORTRAIT_SIZE / 2 - 8,
      -PORTRAIT_SIZE / 2 - 8,
      PORTRAIT_SIZE + 16,
      PORTRAIT_SIZE + 16
    );
    this.p2Cursor.setDepth(10);
  }

  /** Create large preview sprites */
  private createPreviews(): void {
    // Panel layout - full height side panels
    const PANEL_WIDTH = 240;
    const PREVIEW_X_P1 = 130;
    const PREVIEW_X_P2 = GAME_WIDTH - 130;
    
    // Vertical layout (using full height from title to instructions)
    const PREVIEW_Y = 180;
    const NAME_Y = 310;
    const TAGLINE_Y = 345;
    const BIO_LABEL_Y = 380;
    const BIO_Y = 400;
    const MOTIVATION_LABEL_Y = 530;
    const MOTIVATION_Y = 550;

    // Draw panel backgrounds
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.4);
    panelBg.fillRoundedRect(10, 100, PANEL_WIDTH + 10, GAME_HEIGHT - 160, 8);
    panelBg.fillRoundedRect(GAME_WIDTH - PANEL_WIDTH - 20, 100, PANEL_WIDTH + 10, GAME_HEIGHT - 160, 8);

    // P1 preview (left side) — use fighting-pose profile pic if available
    const p1FighterId = FIGHTER_IDS[0] ?? 'ninja_jan';
    const p1ProfileKey = getProfilePicKey(p1FighterId, 'fighting-pose');
    const p1TextureKey = getFighterTextureKey(p1FighterId, 'idle');
    const p1PreviewKey = this.textures.exists(p1ProfileKey) ? p1ProfileKey : p1TextureKey;
    this.p1Preview = this.add.sprite(PREVIEW_X_P1, PREVIEW_Y, p1PreviewKey, 0);
    if (this.textures.exists(p1ProfileKey)) {
      this.p1Preview.setDisplaySize(PANEL_WIDTH - 20, PANEL_WIDTH - 20);
    } else {
      this.p1Preview.setScale(2.5);
    }
    this.p1Preview.setFlipX(false);

    this.p1NameText = this.add.text(PREVIEW_X_P1, NAME_Y, '', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '22px',
      color: '#00aaff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.p1NameText.setOrigin(0.5);

    this.p1TaglineText = this.add.text(PREVIEW_X_P1, TAGLINE_Y, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#ffcc00',
      fontStyle: 'italic',
      wordWrap: { width: PANEL_WIDTH - 20 },
      align: 'center',
    });
    this.p1TaglineText.setOrigin(0.5);

    // Bio section
    this.add.text(PREVIEW_X_P1, BIO_LABEL_Y, 'STORY', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);

    this.p1BioText = this.add.text(PREVIEW_X_P1, BIO_Y, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#cccccc',
      wordWrap: { width: PANEL_WIDTH - 20 },
      align: 'center',
      lineSpacing: 2,
    });
    this.p1BioText.setOrigin(0.5, 0);

    // Motivation section
    this.add.text(PREVIEW_X_P1, MOTIVATION_LABEL_Y, 'MOTIVATION', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);

    this.p1MotivationText = this.add.text(PREVIEW_X_P1, MOTIVATION_Y, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#aaffaa',
      wordWrap: { width: PANEL_WIDTH - 20 },
      align: 'center',
      lineSpacing: 2,
    });
    this.p1MotivationText.setOrigin(0.5, 0);

    // VS text in center (positioned below the character selection grid)
    this.add
      .text(GAME_WIDTH / 2, 580, 'VS', {
        fontFamily: 'Impact, sans-serif',
        fontSize: '64px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // P2 preview (right side) — use fighting-pose-alt if available
    const p2FighterId = FIGHTER_IDS[1] ?? FIGHTER_IDS[0] ?? 'ninja_jan';
    const p2ProfileKey = getProfilePicKey(p2FighterId, 'fighting-pose-alt');
    const p2TextureKey = getFighterTextureKey(p2FighterId, 'idle');
    const p2PreviewKey = this.textures.exists(p2ProfileKey) ? p2ProfileKey : p2TextureKey;
    this.p2Preview = this.add.sprite(PREVIEW_X_P2, PREVIEW_Y, p2PreviewKey, 0);
    if (this.textures.exists(p2ProfileKey)) {
      this.p2Preview.setDisplaySize(PANEL_WIDTH - 20, PANEL_WIDTH - 20);
    } else {
      this.p2Preview.setScale(2.5);
    }
    this.p2Preview.setFlipX(true);

    this.p2NameText = this.add.text(PREVIEW_X_P2, NAME_Y, '', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '22px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.p2NameText.setOrigin(0.5);

    this.p2TaglineText = this.add.text(PREVIEW_X_P2, TAGLINE_Y, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#ffcc00',
      fontStyle: 'italic',
      wordWrap: { width: PANEL_WIDTH - 20 },
      align: 'center',
    });
    this.p2TaglineText.setOrigin(0.5);

    // Bio section
    this.add.text(PREVIEW_X_P2, BIO_LABEL_Y, 'STORY', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);

    this.p2BioText = this.add.text(PREVIEW_X_P2, BIO_Y, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#cccccc',
      wordWrap: { width: PANEL_WIDTH - 20 },
      align: 'center',
      lineSpacing: 2,
    });
    this.p2BioText.setOrigin(0.5, 0);

    // Motivation section
    this.add.text(PREVIEW_X_P2, MOTIVATION_LABEL_Y, 'MOTIVATION', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);

    this.p2MotivationText = this.add.text(PREVIEW_X_P2, MOTIVATION_Y, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#aaffaa',
      wordWrap: { width: PANEL_WIDTH - 20 },
      align: 'center',
      lineSpacing: 2,
    });
    this.p2MotivationText.setOrigin(0.5, 0);
  }

  /** Create instructions text */
  private createInstructions(): void {
    const p1Keys = getP1MovementKeysDisplay();
    
    // Different instructions based on mode and touch
    let instructionText: string;
    if (this.isTouchMode) {
      instructionText = this.gameMode === '1P'
        ? 'Tap a fighter to select • Tap FIGHT to start'
        : 'Tap P1 fighter • Tap P2 fighter • Tap FIGHT';
    } else {
      instructionText = this.gameMode === '1P'
        ? `${p1Keys} to move • F to confirm • ENTER: Start vs CPU`
        : `P1: ${p1Keys} + F to confirm | P2: Arrows + Numpad1 to confirm | ENTER: Continue`;
    }
    
    this.instructionsText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 30,
      instructionText,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#888888',
      }
    );
    this.instructionsText.setOrigin(0.5);
  }

  /** Setup touch-specific UI elements */
  private setupTouchUI(): void {
    // Create confirm/fight button at bottom center
    this.startButton = this.createTouchButton(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 80,
      'FIGHT!',
      0x00aa00,
      () => this.onFightButtonTapped()
    );
    this.startButton.setVisible(false); // Hidden until both confirmed

    // Create change buttons for each player (smaller buttons below preview area)
    this.p1ChangeButton = this.createSmallTouchButton(
      130,
      GAME_HEIGHT - 80,
      '↻ CHANGE P1',
      0x0066aa,
      () => this.onChangeP1Tapped()
    );
    this.p1ChangeButton.setVisible(false);

    this.p2ChangeButton = this.createSmallTouchButton(
      GAME_WIDTH - 130,
      GAME_HEIGHT - 80,
      '↻ CHANGE P2',
      0xaa3333,
      () => this.onChangeP2Tapped()
    );
    this.p2ChangeButton.setVisible(false);

    // Update button visibility based on state
    this.updateTouchUI();
  }

  /** Create a touch-friendly button */
  private createTouchButton(
    x: number,
    y: number,
    label: string,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 180;
    const height = 60;

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.lineStyle(3, 0xffffff, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    container.add(bg);

    // Button text
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Impact, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    container.add(text);

    // Make interactive
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', callback);

    // Add press effect
    container.on('pointerover', () => container.setScale(1.05));
    container.on('pointerout', () => container.setScale(1));

    container.setDepth(100);
    return container;
  }

  /** Create a smaller touch-friendly button */
  private createSmallTouchButton(
    x: number,
    y: number,
    label: string,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 120;
    const height = 40;

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    container.add(bg);

    // Button text
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    container.add(text);

    // Make interactive
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', callback);

    // Add press effect
    container.on('pointerover', () => container.setScale(1.05));
    container.on('pointerout', () => container.setScale(1));

    container.setDepth(100);
    return container;
  }

  /** Handle portrait tap in touch mode */
  private onPortraitTapped(index: number): void {
    if (this.isTouchMode) {
      // In 1P mode, only select P1
      if (this.gameMode === '1P') {
        if (!this.p1Confirmed) {
          this.p1Index = index;
          this.confirmP1Selection();
        } else {
          // P1 already confirmed - tapping changes selection
          this.p1Confirmed = false;
          this.resetP1Cursor();
          this.p1Index = index;
          this.confirmP1Selection();
        }
      } else {
        // In 2P mode, handle based on current state
        if (!this.p1Confirmed) {
          // P1 not confirmed - select for P1
          this.p1Index = index;
          this.confirmP1Selection();
        } else if (!this.p2Confirmed) {
          // P1 confirmed, P2 not - select for P2
          this.p2Index = index;
          this.confirmP2Selection();
        }
        // If both are confirmed, don't do anything on portrait tap
        // Use the change buttons instead
      }
      this.updateCursors();
      this.updatePreviews();
      this.updateTouchUI();
    } else {
      // Keyboard mode - just move cursor to tapped character
      if (!this.p1Confirmed) {
        this.p1Index = index;
        this.updateCursors();
        this.updatePreviews();
      } else if (!this.p2Confirmed && this.gameMode === '2P') {
        this.p2Index = index;
        this.updateCursors();
        this.updatePreviews();
      }
    }
  }

  /** Handle change P1 button tap */
  private onChangeP1Tapped(): void {
    this.p1Confirmed = false;
    this.resetP1Cursor();
    this.updateCursors();
    this.updateTouchUI();
  }

  /** Handle change P2 button tap */
  private onChangeP2Tapped(): void {
    this.p2Confirmed = false;
    this.resetP2Cursor();
    this.updateCursors();
    this.updateTouchUI();
  }

  /** Reset P1 cursor to unconfirmed state */
  private resetP1Cursor(): void {
    this.p1Cursor.clear();
    this.p1Cursor.lineStyle(4, 0x00aaff, 1);
    this.p1Cursor.strokeRect(
      -PORTRAIT_SIZE / 2 - 5,
      -PORTRAIT_SIZE / 2 - 5,
      PORTRAIT_SIZE + 10,
      PORTRAIT_SIZE + 10
    );
  }

  /** Reset P2 cursor to unconfirmed state */
  private resetP2Cursor(): void {
    this.p2Cursor.clear();
    this.p2Cursor.lineStyle(4, 0xff4444, 1);
    this.p2Cursor.strokeRect(
      -PORTRAIT_SIZE / 2 - 8,
      -PORTRAIT_SIZE / 2 - 8,
      PORTRAIT_SIZE + 16,
      PORTRAIT_SIZE + 16
    );
  }

  /** Confirm P1 selection (shared logic) */
  private confirmP1Selection(): void {
    this.p1Confirmed = true;
    this.p1Cursor.clear();
    this.p1Cursor.fillStyle(0x00aaff, 0.3);
    this.p1Cursor.fillRect(
      -PORTRAIT_SIZE / 2 - 5,
      -PORTRAIT_SIZE / 2 - 5,
      PORTRAIT_SIZE + 10,
      PORTRAIT_SIZE + 10
    );
    this.p1Cursor.lineStyle(4, 0x00ff00, 1);
    this.p1Cursor.strokeRect(
      -PORTRAIT_SIZE / 2 - 5,
      -PORTRAIT_SIZE / 2 - 5,
      PORTRAIT_SIZE + 10,
      PORTRAIT_SIZE + 10
    );
    logger.info(`P1 selected: ${FIGHTER_IDS[this.p1Index]}`);
  }

  /** Confirm P2 selection (shared logic) */
  private confirmP2Selection(): void {
    this.p2Confirmed = true;
    this.p2Cursor.clear();
    this.p2Cursor.fillStyle(0xff4444, 0.3);
    this.p2Cursor.fillRect(
      -PORTRAIT_SIZE / 2 - 8,
      -PORTRAIT_SIZE / 2 - 8,
      PORTRAIT_SIZE + 16,
      PORTRAIT_SIZE + 16
    );
    this.p2Cursor.lineStyle(4, 0x00ff00, 1);
    this.p2Cursor.strokeRect(
      -PORTRAIT_SIZE / 2 - 8,
      -PORTRAIT_SIZE / 2 - 8,
      PORTRAIT_SIZE + 16,
      PORTRAIT_SIZE + 16
    );
    logger.info(`P2 selected: ${FIGHTER_IDS[this.p2Index]}`);
  }

  /** Handle fight button tap */
  private onFightButtonTapped(): void {
    if (this.p1Confirmed && this.p2Confirmed) {
      this.goToStageSelect();
    }
  }

  /** Update touch UI visibility */
  private updateTouchUI(): void {
    if (!this.isTouchMode) return;

    // Show fight button when both players confirmed
    if (this.startButton) {
      this.startButton.setVisible(this.p1Confirmed && this.p2Confirmed);
    }

    // Show change buttons when respective player is confirmed
    if (this.p1ChangeButton) {
      this.p1ChangeButton.setVisible(this.p1Confirmed);
    }
    if (this.p2ChangeButton && this.gameMode === '2P') {
      this.p2ChangeButton.setVisible(this.p2Confirmed);
    }

    // Update instructions to show current step
    if (this.gameMode === '2P') {
      if (!this.p1Confirmed) {
        this.instructionsText.setText('Tap to select P1 fighter (BLUE)');
      } else if (!this.p2Confirmed) {
        this.instructionsText.setText('Tap to select P2 fighter (RED)');
      } else {
        this.instructionsText.setText('Tap FIGHT! to begin');
      }
    } else {
      if (!this.p1Confirmed) {
        this.instructionsText.setText('Tap to select your fighter');
      } else {
        this.instructionsText.setText('Tap FIGHT! to battle the CPU');
      }
    }
  }

  /** Setup input */
  private setupInput(): void {
    const keyboard = this.input.keyboard!;
    const p1Keys = getP1PhaserKeyCodes();

    this.keys = {
      // P1 controls (WASD/ZQSD + F)
      p1Left: keyboard.addKey(p1Keys.left),
      p1Right: keyboard.addKey(p1Keys.right),
      p1Up: keyboard.addKey(p1Keys.up),
      p1Down: keyboard.addKey(p1Keys.down),
      p1Confirm: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),

      // P2 controls (Arrows + Numpad1)
      p2Left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      p2Right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      p2Up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      p2Down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      p2Confirm: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),

      // Continue to stage select
      start: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),

      // Back to mode select
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

  /** Go back to mode select */
  private goBack(): void {
    this.scene.start('ModeSelectScene');
  }

  update(): void {
    this.handleP1Input();
    this.handleP2Input();
    this.handleStart();
    this.handleEscape();
  }

  /** Handle escape key to go back */
  private handleEscape(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
      this.goBack();
    }
  }

  /** Handle P1 selection input */
  private handleP1Input(): void {
    if (this.p1Confirmed) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.p1Left)) {
      this.p1Index =
        (this.p1Index - 1 + FIGHTER_IDS.length) % FIGHTER_IDS.length;
      this.updateCursors();
      this.updatePreviews();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1Right)) {
      this.p1Index = (this.p1Index + 1) % FIGHTER_IDS.length;
      this.updateCursors();
      this.updatePreviews();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1Up)) {
      this.p1Index =
        (this.p1Index - GRID_COLS + FIGHTER_IDS.length) % FIGHTER_IDS.length;
      this.updateCursors();
      this.updatePreviews();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1Down)) {
      this.p1Index = (this.p1Index + GRID_COLS) % FIGHTER_IDS.length;
      this.updateCursors();
      this.updatePreviews();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1Confirm)) {
      this.confirmP1Selection();
    }
  }

  /** Handle P2 selection input */
  private handleP2Input(): void {
    if (this.p2Confirmed) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.p2Left)) {
      this.p2Index =
        (this.p2Index - 1 + FIGHTER_IDS.length) % FIGHTER_IDS.length;
      this.updateCursors();
      this.updatePreviews();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p2Right)) {
      this.p2Index = (this.p2Index + 1) % FIGHTER_IDS.length;
      this.updateCursors();
      this.updatePreviews();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p2Up)) {
      this.p2Index =
        (this.p2Index - GRID_COLS + FIGHTER_IDS.length) % FIGHTER_IDS.length;
      this.updateCursors();
      this.updatePreviews();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p2Down)) {
      this.p2Index = (this.p2Index + GRID_COLS) % FIGHTER_IDS.length;
      this.updateCursors();
      this.updatePreviews();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p2Confirm)) {
      this.confirmP2Selection();
    }
  }

  /** Handle continue to stage select */
  private handleStart(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.start)) {
      if (this.p1Confirmed && this.p2Confirmed) {
        this.goToStageSelect();
      } else {
        // Auto-confirm both and continue
        this.p1Confirmed = true;
        this.p2Confirmed = true;
        this.goToStageSelect();
      }
    }
  }

  /** Update cursor positions */
  private updateCursors(): void {
    const p1Portrait = this.portraits[this.p1Index];
    if (p1Portrait) {
      this.p1Cursor.setPosition(p1Portrait.x, p1Portrait.y);
    }
    const p2Portrait = this.portraits[this.p2Index];
    if (p2Portrait) {
      this.p2Cursor.setPosition(p2Portrait.x, p2Portrait.y);
    }
  }

  /** Update preview sprites */
  private updatePreviews(): void {
    const PREVIEW_SIZE = 220;
    const p1FighterId = FIGHTER_IDS[this.p1Index] ?? 'ninja_jan';
    const p2FighterId = FIGHTER_IDS[this.p2Index] ?? 'ninja_jan';

    // P1 preview — prefer fighting-pose profile pic
    const p1ProfileKey = getProfilePicKey(p1FighterId, 'fighting-pose');
    const p1TextureKey = getFighterTextureKey(p1FighterId, 'idle');
    if (this.textures.exists(p1ProfileKey)) {
      this.p1Preview.setTexture(p1ProfileKey);
      this.p1Preview.setDisplaySize(PREVIEW_SIZE, PREVIEW_SIZE);
    } else if (this.textures.exists(p1TextureKey)) {
      this.p1Preview.setTexture(p1TextureKey, 0);
      this.p1Preview.setScale(2.5);
    }

    // P2 preview — prefer fighting-pose-alt profile pic
    const p2ProfileKey = getProfilePicKey(p2FighterId, 'fighting-pose-alt');
    const p2TextureKey = getFighterTextureKey(p2FighterId, 'idle');
    if (this.textures.exists(p2ProfileKey)) {
      this.p2Preview.setTexture(p2ProfileKey);
      this.p2Preview.setDisplaySize(PREVIEW_SIZE, PREVIEW_SIZE);
    } else if (this.textures.exists(p2TextureKey)) {
      this.p2Preview.setTexture(p2TextureKey, 0);
      this.p2Preview.setScale(2.5);
    }

    const p1Fighter = FIGHTER_REGISTRY[p1FighterId];
    const p2Fighter = FIGHTER_REGISTRY[p2FighterId];
    
    // Update P1 info
    this.p1NameText.setText(p1Fighter?.displayName ?? 'Unknown');
    this.p1TaglineText.setText(`"${p1Fighter?.tagline ?? ''}"`);
    this.p1BioText.setText(p1Fighter?.bio ?? '');
    const p1Special = p1Fighter?.specialCombo ? `SPECIAL: ${p1Fighter.specialCombo}` : '';
    this.p1MotivationText.setText(`${p1Fighter?.motivation ?? ''}\n\n${p1Special}`);
    
    // Update P2 info (show CPU label in 1P mode)
    const p2Label = this.gameMode === '1P' ? '🤖 CPU' : '';
    const p2Name = p2Fighter?.displayName ?? 'Unknown';
    this.p2NameText.setText(p2Label ? `${p2Name}\n${p2Label}` : p2Name);
    this.p2TaglineText.setText(`"${p2Fighter?.tagline ?? ''}"`);
    this.p2BioText.setText(p2Fighter?.bio ?? '');
    const p2Special = p2Fighter?.specialCombo ? `SPECIAL: ${p2Fighter.specialCombo}` : '';
    this.p2MotivationText.setText(`${p2Fighter?.motivation ?? ''}\n\n${p2Special}`);
  }

  /** Go to stage selection screen */
  private goToStageSelect(): void {
    const p1FighterId = FIGHTER_IDS[this.p1Index] ?? 'ninja_jan';
    const p2FighterId = FIGHTER_IDS[this.p2Index] ?? 'ninja_jan';

    logger.info(`Fighters selected: ${p1FighterId} vs ${p2FighterId} (mode: ${this.gameMode})`);

    this.scene.start('StageSelectScene', {
      p1FighterId,
      p2FighterId,
      gameMode: this.gameMode,
    });
  }
}
