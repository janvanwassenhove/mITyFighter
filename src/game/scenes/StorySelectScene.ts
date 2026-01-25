/**
 * @fileoverview Story Mode fighter selection scene
 * @description Choose your fighter before starting story mode
 */

import Phaser from 'phaser';

import { getFighterTextureKey } from '../assets/AssetKeys';
import { FIGHTER_REGISTRY, FIGHTER_IDS, type FighterId } from '../assets/fighterRegistry';
import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { FINAL_BOSS_ID } from '../state/StoryModeState';
import { logger } from '../utils/logger';

// =============================================================================
// StorySelectScene
// =============================================================================

export class StorySelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private fighters: FighterId[] = [];
  private previewSprite!: Phaser.GameObjects.Sprite;
  private nameText!: Phaser.GameObjects.Text;
  private taglineText!: Phaser.GameObjects.Text;
  private bioText!: Phaser.GameObjects.Text;
  private motivationText!: Phaser.GameObjects.Text;
  private portraitContainers: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'StorySelectScene' });
  }

  create(): void {
    // Initialize audio manager for this scene
    getAudioManager().init(this);
    
    // Play "Choose your character" voice clip
    getAudioManager().play('choose_your_character');

    // Filter out the boss from selectable fighters
    this.fighters = FIGHTER_IDS.filter((id) => id !== FINAL_BOSS_ID);
    
    // Background
    this.cameras.main.setBackgroundColor('#0a0a15');

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 40, '⚔️ STORY MODE ⚔️', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '42px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, 80, 'Choose Your Fighter', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#888888',
    });
    subtitle.setOrigin(0.5);

    // Create fighter grid
    this.createFighterGrid();

    // Preview area
    this.createPreviewArea();

    // Instructions
    this.createInstructions();

    // Start button
    this.createStartButton();

    // Create mobile back button
    this.createBackButton();

    // Input handling
    this.setupInput();

    // Initial selection
    this.updateSelection();
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
    backButton.on('pointerdown', () => this.scene.start('ModeSelectScene'));
    backButton.setDepth(200);
  }

  /** Create the fighter selection grid */
  private createFighterGrid(): void {
    // Grid fills the left side, next to the preview panel (which is ~360px from right edge)
    const gridStartX = 80;
    const gridStartY = 130;
    const cellSize = 100; // Larger cells
    const cols = 5; // 5 columns to fill ~500px width

    this.fighters.forEach((fighterId, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = gridStartX + col * cellSize;
      const y = gridStartY + row * cellSize;

      const container = this.add.container(x, y);

      // Background - larger cells
      const bg = this.add.rectangle(0, 0, cellSize - 8, cellSize - 8, 0x222233);
      bg.setStrokeStyle(2, 0x444466);
      container.add(bg);

      // Fighter portrait (using idle frame) - larger scale
      const textureKey = getFighterTextureKey(fighterId, 'idle');
      if (this.textures.exists(textureKey)) {
        const portrait = this.add.sprite(0, 0, textureKey, 0);
        portrait.setScale(0.6);
        container.add(portrait);
      }

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });
      bg.on('pointerover', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      this.portraitContainers.push(container);
    });
  }

  /** Create the fighter preview area */
  private createPreviewArea(): void {
    const previewX = GAME_WIDTH - 280;
    const previewY = 320; // Centered vertically

    // Preview background - taller to fit all content
    const previewBg = this.add.rectangle(previewX, previewY, 340, 480, 0x111122, 0.8);
    previewBg.setStrokeStyle(2, 0x444466);

    // Fighter sprite preview - at top of box
    this.previewSprite = this.add.sprite(previewX, previewY - 140, '', 0);
    this.previewSprite.setScale(2.5);

    // Name - below sprite
    this.nameText = this.add.text(previewX, previewY + 10, '', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '24px',
      color: '#00aaff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.nameText.setOrigin(0.5);

    // Tagline - below name
    this.taglineText = this.add.text(previewX, previewY + 45, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffcc00',
      fontStyle: 'italic',
      wordWrap: { width: 300 },
      align: 'center',
    });
    this.taglineText.setOrigin(0.5);

    // Bio - below tagline
    this.bioText = this.add.text(previewX, previewY + 80, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#aaaaaa',
      wordWrap: { width: 300 },
      align: 'center',
      lineSpacing: 2,
    });
    this.bioText.setOrigin(0.5, 0);

    // Motivation label
    this.add.text(previewX, previewY + 165, 'Motivation:', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#666666',
    }).setOrigin(0.5);

    // Motivation text
    this.motivationText = this.add.text(previewX, previewY + 182, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#888888',
      fontStyle: 'italic',
      wordWrap: { width: 300 },
      align: 'center',
      lineSpacing: 2,
    });
    this.motivationText.setOrigin(0.5, 0);
  }

  /** Create instructions text */
  private createInstructions(): void {
    const instructY = GAME_HEIGHT - 30;
    
    this.add.text(50, instructY, '← → to select  |  ENTER to start  |  ESC to go back', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#666666',
    });
  }

  /** Create start button */
  private createStartButton(): void {
    const startBtn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 80);

    const bg = this.add.rectangle(0, 0, 200, 50, 0x334477);
    bg.setStrokeStyle(3, 0xffcc00);
    bg.setInteractive({ useHandCursor: true });
    startBtn.add(bg);

    const text = this.add.text(0, 0, 'START STORY', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    startBtn.add(text);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x446699);
      startBtn.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x334477);
      startBtn.setScale(1);
    });

    bg.on('pointerdown', () => {
      this.startStoryMode();
    });
  }

  /** Setup keyboard input */
  private setupInput(): void {
    const keyboard = this.input.keyboard!;

    // Remove any existing listeners to prevent duplicates on scene restart
    keyboard.removeAllListeners();

    keyboard.on('keydown-LEFT', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });

    keyboard.on('keydown-RIGHT', () => {
      this.selectedIndex = Math.min(this.fighters.length - 1, this.selectedIndex + 1);
      this.updateSelection();
    });

    keyboard.on('keydown-UP', () => {
      const cols = 5;
      if (this.selectedIndex >= cols) {
        this.selectedIndex -= cols;
        this.updateSelection();
      }
    });

    keyboard.on('keydown-DOWN', () => {
      const cols = 5;
      if (this.selectedIndex + cols < this.fighters.length) {
        this.selectedIndex += cols;
        this.updateSelection();
      }
    });

    keyboard.on('keydown-ENTER', () => {
      this.startStoryMode();
    });

    keyboard.on('keydown-SPACE', () => {
      this.startStoryMode();
    });

    keyboard.on('keydown-ESC', () => {
      this.scene.start('ModeSelectScene');
    });
  }

  /** Update selection visuals */
  private updateSelection(): void {
    // Update portrait highlights
    this.portraitContainers.forEach((container, index) => {
      const bg = container.list[0] as Phaser.GameObjects.Rectangle;
      if (index === this.selectedIndex) {
        bg.setStrokeStyle(3, 0xffcc00);
        bg.setFillStyle(0x334477);
        container.setScale(1.1);
        container.setDepth(10);
      } else {
        bg.setStrokeStyle(2, 0x444466);
        bg.setFillStyle(0x222233);
        container.setScale(1);
        container.setDepth(1);
      }
    });

    // Update preview
    const fighterId = this.fighters[this.selectedIndex];
    if (!fighterId) return;

    const fighter = FIGHTER_REGISTRY[fighterId];
    const textureKey = getFighterTextureKey(fighterId, 'idle');

    if (this.textures.exists(textureKey)) {
      this.previewSprite.setTexture(textureKey, 0);
      this.previewSprite.setVisible(true);
    } else {
      this.previewSprite.setVisible(false);
    }

    this.nameText.setText(fighter?.displayName ?? fighterId);
    this.taglineText.setText(fighter?.tagline ?? '');
    this.bioText.setText(fighter?.bio ?? '');
    this.motivationText.setText(fighter?.motivation ?? '');
  }

  /** Start story mode with selected fighter */
  private startStoryMode(): void {
    const selectedFighter = this.fighters[this.selectedIndex];
    if (!selectedFighter) return;

    logger.info(`Starting Story Mode with ${selectedFighter}`);

    this.cameras.main.fade(300, 0, 0, 0, false, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.start('DifficultySelectScene', {
          playerFighterId: selectedFighter,
        });
      }
    });
  }
}
