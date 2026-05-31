/**
 * @fileoverview Story Mode scene - narrative screens between fights
 * @description Displays story text, opponent preview, and fight progression
 */

import Phaser from 'phaser';

import { getFighterTextureKey } from '../assets/AssetKeys';
import { FIGHTER_REGISTRY, FIGHTER_IDS, type FighterId } from '../assets/fighterRegistry';
import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import type { AIDifficulty } from '../sim/FightingAI';
import {
  type StoryFight,
  type StoryProgress,
  generateStoryFights,
  createStoryProgress,
  advanceStory,
  handleDefeat,
  getCurrentFight,
  getTotalFights,
} from '../state/StoryModeState';
import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export interface StorySceneData {
  /** Player's chosen fighter (only for initial start) */
  playerFighterId?: FighterId;
  /** Selected difficulty level (only for initial start) */
  selectedDifficulty?: AIDifficulty;
  /** Existing story progress (for continuing story) */
  progress?: StoryProgress;
  /** Existing story fights */
  fights?: StoryFight[];
  /** Result of previous fight */
  fightResult?: 'win' | 'lose' | null;
}

// =============================================================================
// StoryModeScene
// =============================================================================

export class StoryModeScene extends Phaser.Scene {
  // Story state
  private progress!: StoryProgress;
  private fights!: StoryFight[];
  private currentFight!: StoryFight | null;
  private fightResult: 'win' | 'lose' | null = null;

  // UI elements
  private playerPreview!: Phaser.GameObjects.Sprite;
  private opponentPreview!: Phaser.GameObjects.Sprite;

  constructor() {
    super({ key: 'StoryModeScene' });
  }

  init(data: StorySceneData): void {
    this.fightResult = data.fightResult ?? null;

    if (data.progress && data.fights) {
      // Continuing story
      this.progress = data.progress;
      this.fights = data.fights;
      
      // Handle fight result
      if (this.fightResult === 'win') {
        this.progress = advanceStory(this.progress, this.fights.length);
      } else if (this.fightResult === 'lose') {
        const result = handleDefeat(this.progress);
        this.progress = result.progress;
        if (result.gameOver) {
          // Will show game over
        }
      }
    } else if (data.playerFighterId) {
      // Starting new story with difficulty selection
      const difficulty = data.selectedDifficulty ?? 'medium';
      this.progress = createStoryProgress(data.playerFighterId, difficulty);
      this.fights = generateStoryFights(data.playerFighterId, difficulty);
    } else {
      // Fallback - shouldn't happen
      const defaultFighter = FIGHTER_IDS[0] ?? 'ninja_jan';
      this.progress = createStoryProgress(defaultFighter as FighterId, 'medium');
      this.fights = generateStoryFights(defaultFighter as FighterId, 'medium');
    }

    this.currentFight = getCurrentFight(this.fights, this.progress);
    
    logger.info(`StoryModeScene: Fight ${this.progress.currentFightIndex + 1}/${this.fights.length} (Difficulty: ${this.progress.difficulty})`);
  }

  create(): void {
    // Initialize audio manager for this scene
    getAudioManager().init(this);

    // Background
    this.cameras.main.setBackgroundColor('#0a0a15');
    this.createBackgroundEffects();

    // Setup ESC key to go back to mode select
    this.setupEscapeKey();

    // Create mobile back button
    this.createBackButton();

    // Check game state
    if (this.progress.isComplete) {
      this.showVictoryScreen();
    } else if (this.progress.continuesRemaining < 0) {
      this.showGameOverScreen();
    } else if (this.fightResult === 'lose' && this.progress.continuesRemaining >= 0) {
      this.showContinueScreen();
    } else {
      this.showPreFightScreen();
    }
  }

  /** Setup ESC key to return to mode select */
  private setupEscapeKey(): void {
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('ModeSelectScene');
    });
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

  /** Create background visual effects */
  private createBackgroundEffects(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(-1);

    // Floating particles
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 2);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.2);

      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, size);
    }
  }

  /** Show the pre-fight story screen */
  private showPreFightScreen(): void {
    if (!this.currentFight) return;

    const player = FIGHTER_REGISTRY[this.progress.playerFighterId];
    const opponent = FIGHTER_REGISTRY[this.currentFight.opponentId];

    // Progress header
    this.createProgressHeader();

    // Fight title
    const fightNum = this.progress.currentFightIndex + 1;
    const totalFights = getTotalFights();
    const titleText = this.currentFight.isBoss 
      ? '⚔️ FINAL BOSS ⚔️' 
      : `FIGHT ${fightNum} OF ${totalFights}`;
    
    const title = this.add.text(GAME_WIDTH / 2, 60, titleText, {
      fontFamily: 'Impact, sans-serif',
      fontSize: this.currentFight.isBoss ? '48px' : '36px',
      color: this.currentFight.isBoss ? '#ff4444' : '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // VS display
    const vsY = 220;
    
    // Player side
    const playerTextureKey = getFighterTextureKey(this.progress.playerFighterId, 'idle');
    this.playerPreview = this.add.sprite(250, vsY, playerTextureKey, 0);
    this.playerPreview.setScale(3);
    this.playerPreview.setFlipX(false);

    const playerName = this.add.text(250, vsY + 100, player?.displayName ?? 'Player', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '24px',
      color: '#00aaff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    playerName.setOrigin(0.5);

    this.add.text(250, vsY + 130, '(YOU)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    // VS text
    const vs = this.add.text(GAME_WIDTH / 2, vsY, 'VS', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '64px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
    });
    vs.setOrigin(0.5);

    // Opponent side
    const opponentTextureKey = getFighterTextureKey(this.currentFight.opponentId, 'idle');
    this.opponentPreview = this.add.sprite(GAME_WIDTH - 250, vsY, opponentTextureKey, 0);
    this.opponentPreview.setScale(3);
    this.opponentPreview.setFlipX(true);

    const opponentName = this.add.text(GAME_WIDTH - 250, vsY + 100, opponent?.displayName ?? 'Opponent', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '24px',
      color: this.currentFight.isBoss ? '#ff4444' : '#ff8844',
      stroke: '#000000',
      strokeThickness: 3,
    });
    opponentName.setOrigin(0.5);

    if (this.currentFight.isBoss) {
      this.add.text(GAME_WIDTH - 250, vsY + 130, '👑 CHAMPION 👑', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#ffcc00',
      }).setOrigin(0.5);
    }

    // Difficulty indicator
    const diffColor = {
      easy: '#44ff44',
      medium: '#ffff44',
      hard: '#ff8844',
      nightmare: '#ff4444',
    }[this.currentFight.difficulty];

    this.add.text(GAME_WIDTH - 250, vsY + 155, `Difficulty: ${this.currentFight.difficulty.toUpperCase()}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: diffColor,
    }).setOrigin(0.5);

    // Story text box (positioned below characters)
    this.createStoryTextBox(this.currentFight.preFightText, 480);

    // Fight button
    this.createActionButton(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'FIGHT!', () => {
      this.startFight();
    });

    // Animate entrance
    this.tweens.add({
      targets: [this.playerPreview],
      x: { from: -100, to: 250 },
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: [this.opponentPreview],
      x: { from: GAME_WIDTH + 100, to: GAME_WIDTH - 250 },
      duration: 500,
      ease: 'Back.easeOut',
    });
  }

  /** Show continue screen after losing */
  private showContinueScreen(): void {
    const title = this.add.text(GAME_WIDTH / 2, 150, 'DEFEATED!', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '64px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    const continueText = this.add.text(
      GAME_WIDTH / 2, 
      280, 
      `Continues Remaining: ${this.progress.continuesRemaining}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#ffcc00',
      }
    );
    continueText.setOrigin(0.5);

    const prompt = this.add.text(GAME_WIDTH / 2, 350, 'Will you continue the fight?', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#cccccc',
    });
    prompt.setOrigin(0.5);

    // Continue button
    this.createActionButton(GAME_WIDTH / 2 - 120, 450, 'CONTINUE', () => {
      this.fightResult = null;
      this.showPreFightScreen();
    });

    // Give up button
    this.createActionButton(GAME_WIDTH / 2 + 120, 450, 'GIVE UP', () => {
      this.scene.start('ModeSelectScene');
    }, 0x882222);

    // Countdown timer
    let countdown = 10;
    const countdownText = this.add.text(GAME_WIDTH / 2, 520, `Auto-continue in ${countdown}...`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#666666',
    });
    countdownText.setOrigin(0.5);

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--;
        if (countdown <= 0) {
          this.fightResult = null;
          this.scene.restart({ 
            progress: this.progress, 
            fights: this.fights,
            fightResult: null 
          });
        } else {
          countdownText.setText(`Auto-continue in ${countdown}...`);
        }
      },
      repeat: 9,
    });
  }

  /** Show game over screen */
  private showGameOverScreen(): void {
    // Play game over audio
    getAudioManager().play('game_over');

    const title = this.add.text(GAME_WIDTH / 2, 200, 'GAME OVER', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '72px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 8,
    });
    title.setOrigin(0.5);

    const stats = this.add.text(
      GAME_WIDTH / 2,
      320,
      `Fights Won: ${this.progress.wins}\nFights Lost: ${this.progress.losses}\nReached: Fight ${this.progress.currentFightIndex + 1}/${getTotalFights()}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#cccccc',
        align: 'center',
      }
    );
    stats.setOrigin(0.5);

    // Try again button
    this.createActionButton(GAME_WIDTH / 2 - 120, 450, 'TRY AGAIN', () => {
      this.scene.start('StorySelectScene');
    });

    // Main menu button
    this.createActionButton(GAME_WIDTH / 2 + 120, 450, 'MAIN MENU', () => {
      this.scene.start('ModeSelectScene');
    }, 0x444466);
  }

  /** Show victory screen after completing story */
  private showVictoryScreen(): void {
    // Play flawless victory audio (champion!)
    getAudioManager().play('flawless_victory');

    // Celebration effects
    this.createVictoryEffects();

    const title = this.add.text(GAME_WIDTH / 2, 120, '🏆 CHAMPION! 🏆', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '64px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 8,
    });
    title.setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const player = FIGHTER_REGISTRY[this.progress.playerFighterId];
    
    // Player victory pose
    const playerTextureKey = getFighterTextureKey(this.progress.playerFighterId, 'idle');
    const playerSprite = this.add.sprite(GAME_WIDTH / 2, 280, playerTextureKey, 0);
    playerSprite.setScale(4);

    const playerName = this.add.text(GAME_WIDTH / 2, 400, player?.displayName ?? 'Champion', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '36px',
      color: '#00aaff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    playerName.setOrigin(0.5);

    // Victory text
    const lastFight = this.fights[this.fights.length - 1];
    const victoryText = lastFight?.victoryText ?? 'You are the champion!';
    
    this.createStoryTextBox(victoryText, 450, 0xffcc00);

    // Stats
    const stats = this.add.text(
      GAME_WIDTH / 2,
      580,
      `Total Victories: ${this.progress.wins} | Continues Used: ${this.progress.losses}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#888888',
      }
    );
    stats.setOrigin(0.5);

    // Main menu button
    this.createActionButton(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'MAIN MENU', () => {
      this.scene.start('ModeSelectScene');
    });
  }

  /** Create victory celebration effects */
  private createVictoryEffects(): void {
    // Confetti particles
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const colors = [0xffcc00, 0xff4444, 0x44ff44, 0x4444ff, 0xff44ff];
      const color = colors[Phaser.Math.Between(0, colors.length - 1)] ?? 0xffcc00;
      
      const particle = this.add.rectangle(x, -20, 8, 8, color);
      
      this.tweens.add({
        targets: particle,
        y: GAME_HEIGHT + 20,
        x: x + Phaser.Math.Between(-100, 100),
        rotation: Phaser.Math.Between(0, 10),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1000),
        repeat: -1,
        onRepeat: () => {
          particle.y = -20;
          particle.x = Phaser.Math.Between(0, GAME_WIDTH);
        },
      });
    }
  }

  /** Create progress header showing wins/losses */
  private createProgressHeader(): void {
    const headerY = 15;
    
    // Wins
    this.add.text(20, headerY, `Wins: ${this.progress.wins}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#44ff44',
    });

    // Continues
    this.add.text(GAME_WIDTH - 20, headerY, `Continues: ${this.progress.continuesRemaining}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffcc00',
    }).setOrigin(1, 0);
  }

  /** Create a story text box */
  private createStoryTextBox(text: string, y: number, borderColor = 0x444466): void {
    const boxWidth = GAME_WIDTH - 100;
    const boxHeight = 120;
    const boxX = GAME_WIDTH / 2;

    const bg = this.add.rectangle(boxX, y, boxWidth, boxHeight, 0x111122, 0.9);
    bg.setStrokeStyle(2, borderColor);

    const storyText = this.add.text(boxX, y, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: boxWidth - 40 },
      lineSpacing: 4,
    });
    storyText.setOrigin(0.5);
  }

  /** Create an action button */
  private createActionButton(
    x: number, 
    y: number, 
    label: string, 
    callback: () => void,
    bgColor = 0x334477
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 160, 50, bgColor);
    bg.setStrokeStyle(3, 0xffcc00);
    bg.setInteractive({ useHandCursor: true });
    container.add(bg);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Impact, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    container.add(text);

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0x446699);
      container.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(bgColor);
      container.setScale(1);
    });

    bg.on('pointerdown', callback);

    // Also handle Enter key
    this.input.keyboard!.on('keydown-ENTER', callback);
    this.input.keyboard!.on('keydown-SPACE', callback);

    return container;
  }

  /** Start the current fight */
  private startFight(): void {
    if (!this.currentFight) return;

    // Determine random stage or use fight-specific stage
    const stageId = this.currentFight.stageId;

    this.cameras.main.fade(300, 0, 0, 0, false, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.start('FightScene', {
          p1FighterId: this.progress.playerFighterId,
          p2FighterId: this.currentFight!.opponentId,
          stageId: stageId,
          gameMode: 'STORY',
          storyProgress: this.progress,
          storyFights: this.fights,
          aiDifficulty: this.currentFight!.difficulty,
        });
      }
    });
  }
}
