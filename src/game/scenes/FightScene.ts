/**
 * @fileoverview Main fighting scene - MK-style gameplay
 * @description Handles rounds, combat, health, and match flow
 */

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */

import Phaser from 'phaser';

import { getFighterTextureKey } from '../assets/AssetKeys';
import type { BackgroundId } from '../assets/backgroundRegistry';
import { BACKGROUND_REGISTRY } from '../assets/backgroundRegistry';
import type { FighterId } from '../assets/fighterRegistry';
import { FIGHTER_REGISTRY } from '../assets/fighterRegistry';
import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT, PlayerId } from '../config/constants';
import { getP1PhaserKeyCodes } from '../input/KeyboardLayout';
import {
  TouchControls,
  TouchControlsManager,
} from '../input/TouchControls';
import { updateFighter, resolveCombat } from '../sim/CombatSystem';
import {
  type FighterRuntimeState,
  FighterState,
  createFighterState,
  FIGHTER_PHYSICS,
} from '../sim/FighterState';
import { FightingAI, type AIDifficulty } from '../sim/FightingAI';
import type { InputAction } from '../sim/InputFrame';
import {
  type MatchConfig,
  DEFAULT_MATCH_CONFIG,
  GamePhase,
  FightState,
} from '../state/GameState';
import type { StoryProgress, StoryFight } from '../state/StoryModeState';
import { AnnouncerUI } from '../ui/AnnouncerUI';
import { HealthBarUI } from '../ui/HealthBarUI';
import { logger } from '../utils/logger';


import type { GameMode } from './ModeSelectScene';


// =============================================================================
// Types
// =============================================================================

interface FightSceneData {
  p1FighterId: FighterId;
  p2FighterId: FighterId;
  stageId: BackgroundId;
  gameMode?: GameMode;
  // Story mode data
  storyProgress?: StoryProgress;
  storyFights?: StoryFight[];
  aiDifficulty?: AIDifficulty;
}

interface PlayerState {
  roundsWon: number;
  health: number;
}

// =============================================================================
// FightScene
// =============================================================================

export class FightScene extends Phaser.Scene {
  // Match data
  private matchConfig: MatchConfig = DEFAULT_MATCH_CONFIG;
  private p1PlayerState!: PlayerState;
  private p2PlayerState!: PlayerState;
  private currentRound = 1;
  private roundTimer = 99;
  private roundTimerEvent?: Phaser.Time.TimerEvent;

  // Fighter data
  private p1FighterId!: FighterId;
  private p2FighterId!: FighterId;
  private stageId!: BackgroundId;
  private p1State!: FighterRuntimeState;
  private p2State!: FighterRuntimeState;

  // Game mode and AI
  private gameMode: GameMode = '2P';
  private p2AI: FightingAI | undefined;
  private aiDifficulty: AIDifficulty = 'medium';

  // Story mode data
  private storyProgress: StoryProgress | undefined;
  private storyFights: StoryFight[] | undefined;

  // Game objects
  private p1Sprite!: Phaser.GameObjects.Sprite;
  private p2Sprite!: Phaser.GameObjects.Sprite;
  private backgroundDomElement?: HTMLVideoElement | HTMLImageElement;
  private backgroundContainer?: HTMLDivElement;
  private backgroundWidth = 0;

  // Character scale - MK style (characters fill ~40% of screen height)
  private readonly FIGHTER_SCALE = 4;

  // UI
  private healthBarUI!: HealthBarUI;
  private announcerUI!: AnnouncerUI;

  // State
  private gamePhase: GamePhase = GamePhase.ROUND_START;
  private fightState: FightState = FightState.COUNTDOWN;

  // Input
  private keys!: {
    p1Left: Phaser.Input.Keyboard.Key;
    p1Right: Phaser.Input.Keyboard.Key;
    p1Up: Phaser.Input.Keyboard.Key;
    p1Down: Phaser.Input.Keyboard.Key;
    p1Attack1: Phaser.Input.Keyboard.Key;
    p1Attack2: Phaser.Input.Keyboard.Key;
    p1Block: Phaser.Input.Keyboard.Key;
    p2Left: Phaser.Input.Keyboard.Key;
    p2Right: Phaser.Input.Keyboard.Key;
    p2Up: Phaser.Input.Keyboard.Key;
    p2Down: Phaser.Input.Keyboard.Key;
    p2Attack1: Phaser.Input.Keyboard.Key;
    p2Attack2: Phaser.Input.Keyboard.Key;
    p2Block: Phaser.Input.Keyboard.Key;
    escape: Phaser.Input.Keyboard.Key;
  };

  // Pause menu
  private isPaused = false;
  private pauseMenu?: Phaser.GameObjects.Container;
  private pauseButton?: Phaser.GameObjects.Container;
  private pauseMenuButtons: Phaser.GameObjects.Container[] = [];
  private pauseMenuSelectedIndex = 0;
  private pauseMenuCallbacks: (() => void)[] = [];

  // Touch controls
  private touchControlsManager: TouchControlsManager | null = null;
  private p1TouchInputs: Set<InputAction> = new Set();
  private p2TouchInputs: Set<InputAction> = new Set();
  private p1TouchJustPressed: Set<InputAction> = new Set();
  private p2TouchJustPressed: Set<InputAction> = new Set();

  constructor() {
    super({ key: 'FightScene' });
  }

  init(data: FightSceneData): void {
    this.p1FighterId = data.p1FighterId;
    this.p2FighterId = data.p2FighterId;
    this.stageId = data.stageId;
    this.gameMode = data.gameMode ?? '2P';
    this.aiDifficulty = data.aiDifficulty ?? 'medium';

    // Store story mode data
    this.storyProgress = data.storyProgress;
    this.storyFights = data.storyFights;

    // Setup AI for 1P mode or Story mode
    if (this.gameMode === '1P' || this.gameMode === 'STORY') {
      this.p2AI = new FightingAI(this.aiDifficulty);
      logger.info(`AI opponent initialized with difficulty: ${this.aiDifficulty}`);
    } else {
      this.p2AI = undefined;
    }

    // Reset match state
    this.currentRound = 1;
    this.roundTimer = this.matchConfig.roundTimeSeconds;
    this.p1PlayerState = { roundsWon: 0, health: 100 };
    this.p2PlayerState = { roundsWon: 0, health: 100 };
    this.isPaused = false;
  }

  create(): void {
    logger.info(
      `FightScene started: ${this.p1FighterId} vs ${this.p2FighterId} on ${this.stageId}`
    );

    // Initialize audio manager for this scene
    getAudioManager().init(this);

    // Start background music
    getAudioManager().playMusic();

    this.createBackground();
    this.createFighters();
    this.createUI();
    this.setupInput();
    this.startRound();
  }

  /** Create stage background using DOM elements for native animation support */
  private createBackground(): void {
    const bg = BACKGROUND_REGISTRY[this.stageId];
    if (!bg) {
      this.cameras.main.setBackgroundColor('#2d2d44');
      return;
    }

    // Parallax factor - background is wider than screen for scrolling effect
    const PARALLAX_EXTRA = 1.4;
    const path = `backgrounds/${bg.file}`;

    // Get the Phaser canvas and its parent wrapper (created by Phaser's scale manager)
    const canvas = this.game.canvas;
    const phaserWrapper = canvas.parentElement;
    
    if (!phaserWrapper) {
      logger.error('Cannot find Phaser wrapper element');
      return;
    }

    // Ensure Phaser wrapper has relative positioning for absolute children
    phaserWrapper.style.position = 'relative';

    // Create container div that matches the canvas size
    this.backgroundContainer = document.createElement('div');
    this.backgroundContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    `;

    // Insert as first child of wrapper (behind canvas)
    phaserWrapper.insertBefore(this.backgroundContainer, canvas);

    // Make canvas transparent and ensure it's above the background
    canvas.style.background = 'transparent';
    canvas.style.position = 'relative';
    canvas.style.zIndex = '1';

    if (bg.type === 'video') {
      // Create video element for MP4
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
        min-width: ${100 * PARALLAX_EXTRA}%;
        min-height: 100%;
        object-fit: cover;
        object-position: center bottom;
      `;

      video.onloadedmetadata = (): void => {
        this.backgroundWidth = video.videoWidth * PARALLAX_EXTRA;
        // Force play (some browsers block autoplay)
        video.play().catch((e): void => {
          logger.warn('Video autoplay blocked:', e);
        });
      };

      this.backgroundDomElement = video;
      this.backgroundContainer.appendChild(video);
    } else {
      // Create img element for animated GIF
      const img = document.createElement('img');
      img.src = path;
      img.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        min-width: ${100 * PARALLAX_EXTRA}%;
        min-height: 100%;
        object-fit: cover;
        object-position: center bottom;
      `;

      img.onload = (): void => {
        this.backgroundWidth = img.naturalWidth * PARALLAX_EXTRA;
      };

      this.backgroundDomElement = img;
      this.backgroundContainer.appendChild(img);
    }
  }

  /** Create fighter sprites */
  private createFighters(): void {
    const p1Fighter = FIGHTER_REGISTRY[this.p1FighterId];
    const p2Fighter = FIGHTER_REGISTRY[this.p2FighterId];

    if (!p1Fighter || !p2Fighter) {
      throw new Error('Fighter not found in registry');
    }

    // Initialize runtime states
    this.p1State = createFighterState(200, 1);
    this.p2State = createFighterState(GAME_WIDTH - 200, -1);

    // Create sprites
    const p1TextureKey = getFighterTextureKey(this.p1FighterId, 'idle');
    const p2TextureKey = getFighterTextureKey(this.p2FighterId, 'idle');

    this.p1Sprite = this.add.sprite(
      this.p1State.x,
      this.p1State.y,
      p1TextureKey
    );
    this.p1Sprite.setScale(this.FIGHTER_SCALE);
    this.p1Sprite.setOrigin(0.5, 1);

    this.p2Sprite = this.add.sprite(
      this.p2State.x,
      this.p2State.y,
      p2TextureKey
    );
    this.p2Sprite.setScale(this.FIGHTER_SCALE);
    this.p2Sprite.setOrigin(0.5, 1);
    // P2 starts facing left (toward P1)
    this.p2Sprite.setFlipX(true);

    // Create animations for both fighters
    this.createFighterAnimations(this.p1FighterId, p1Fighter.frameWidth);
    this.createFighterAnimations(this.p2FighterId, p2Fighter.frameWidth);
  }

  /** Create animations for a fighter */
  private createFighterAnimations(fighterId: FighterId, _frameWidth: number): void {
    const animations = ['idle', 'walk', 'attack1', 'attack2', 'hurt', 'dead'] as const;

    for (const anim of animations) {
      const key = getFighterTextureKey(fighterId, anim);
      const animKey = `${fighterId}_${anim}`;

      if (this.anims.exists(animKey)) continue;
      if (!this.textures.exists(key)) continue;

      const frameCount = this.textures.get(key).frameTotal - 1;
      const frameRate = anim === 'idle' ? 8 : anim === 'walk' ? 10 : 12;

      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(key, {
          start: 0,
          end: Math.max(0, frameCount - 1),
        }),
        frameRate,
        repeat: anim === 'idle' || anim === 'walk' ? -1 : 0,
      });
    }
  }

  /** Create UI elements */
  private createUI(): void {
    const p1Fighter = FIGHTER_REGISTRY[this.p1FighterId];
    const p2Fighter = FIGHTER_REGISTRY[this.p2FighterId];
    const p1Name = p1Fighter?.displayName ?? 'Player 1';
    const p2Name = p2Fighter?.displayName ?? 'Player 2';

    this.healthBarUI = new HealthBarUI(this);
    this.healthBarUI.setNames(p1Name, p2Name);
    this.healthBarUI.setHealth(100, 100);
    this.healthBarUI.setRoundWins(0, 0);
    this.healthBarUI.setTimer(this.roundTimer);

    this.announcerUI = new AnnouncerUI(this);
  }

  /** Setup input keys */
  private setupInput(): void {
    const keyboard = this.input.keyboard!;
    const p1Keys = getP1PhaserKeyCodes();

    this.keys = {
      // P1: WASD/ZQSD + FGH
      p1Left: keyboard.addKey(p1Keys.left),
      p1Right: keyboard.addKey(p1Keys.right),
      p1Up: keyboard.addKey(p1Keys.up),
      p1Down: keyboard.addKey(p1Keys.down),
      p1Attack1: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      p1Attack2: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G),
      p1Block: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),

      // P2: Arrows + Numpad 123
      p2Left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      p2Right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      p2Up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      p2Down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      p2Attack1: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),
      p2Attack2: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO),
      p2Block: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE),

      // Pause/Menu
      escape: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };

    // Create mobile pause button
    this.createPauseButton();

    // Setup touch controls for mobile devices
    this.setupTouchControls();
  }

  /** Setup touch controls for mobile devices */
  private setupTouchControls(): void {
    if (!TouchControls.shouldShowTouchControls()) {
      return;
    }

    // Determine which players need touch controls
    // In 1P/Story mode, only P1 needs controls (P2 is AI)
    // In 2P mode, both players need controls
    const players = this.gameMode === '2P'
      ? [PlayerId.P1, PlayerId.P2]
      : [PlayerId.P1];

    this.touchControlsManager = new TouchControlsManager();
    this.touchControlsManager.init(this, players);

    // Set up input callbacks for touch
    this.touchControlsManager.setAllInputCallbacks(
      (player: PlayerId, action: InputAction, active: boolean) => {
        const inputs = player === PlayerId.P1 ? this.p1TouchInputs : this.p2TouchInputs;
        const justPressed = player === PlayerId.P1 ? this.p1TouchJustPressed : this.p2TouchJustPressed;

        if (active) {
          // Track if this is a new press for "just pressed" detection
          if (!inputs.has(action)) {
            justPressed.add(action);
          }
          inputs.add(action);
        } else {
          inputs.delete(action);
        }
      }
    );

    logger.info(`Touch controls enabled for ${players.length} player(s)`);
  }

  /** Start a new round */
  private startRound(): void {
    this.gamePhase = GamePhase.ROUND_START;
    this.fightState = FightState.COUNTDOWN;

    // Reset positions and health
    this.p1State = createFighterState(200, 1);
    this.p2State = createFighterState(GAME_WIDTH - 200, -1);
    this.p1PlayerState.health = this.matchConfig.startingHealth;
    this.p2PlayerState.health = this.matchConfig.startingHealth;
    this.roundTimer = this.matchConfig.roundTimeSeconds;

    // Reset AI for new round
    if (this.p2AI) {
      this.p2AI.reset();
    }

    // Update UI
    this.healthBarUI.setHealth(100, 100);
    this.healthBarUI.setTimer(this.roundTimer);

    // Check if this is the final round (one player needs 1 more win)
    const p1NeedsOne = this.p1PlayerState.roundsWon === this.matchConfig.roundsToWin - 1;
    const p2NeedsOne = this.p2PlayerState.roundsWon === this.matchConfig.roundsToWin - 1;
    const isFinalRound = p1NeedsOne && p2NeedsOne;

    // Show round announcement
    if (isFinalRound) {
      // Final round special announcement
      this.announcerUI.showFinalRound(() => {
        this.time.delayedCall(800, () => {
          this.announcerUI.showFight(() => {
            this.startFighting();
          });
        });
      });
    } else {
      this.announcerUI.showRound(this.currentRound, () => {
        this.time.delayedCall(800, () => {
          this.announcerUI.showFight(() => {
            this.startFighting();
          });
        });
      });
    }
  }

  /** Begin active fighting */
  private startFighting(): void {
    this.gamePhase = GamePhase.FIGHTING;
    this.fightState = FightState.ACTIVE;

    // Start round timer
    this.roundTimerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      repeat: this.matchConfig.roundTimeSeconds - 1,
    });
  }

  /** Timer tick callback */
  private onTimerTick(): void {
    this.roundTimer--;
    this.healthBarUI.setTimer(this.roundTimer);

    if (this.roundTimer <= 0) {
      this.onTimeUp();
    }
  }

  /** Handle time running out */
  private onTimeUp(): void {
    this.fightState = FightState.TIME_UP;
    this.roundTimerEvent?.remove();

    this.announcerUI.showTimeUp();

    // Determine winner by health
    this.time.delayedCall(1500, () => {
      this.endRound();
    });
  }

  /** End the current round */
  private endRound(): void {
    this.gamePhase = GamePhase.ROUND_END;
    this.roundTimerEvent?.remove();

    // Determine round winner
    let p1Won = false;
    let p2Won = false;

    if (this.p1PlayerState.health <= 0) {
      p2Won = true;
    } else if (this.p2PlayerState.health <= 0) {
      p1Won = true;
    } else if (this.roundTimer <= 0) {
      // Time up - winner has more health
      if (this.p1PlayerState.health > this.p2PlayerState.health) {
        p1Won = true;
      } else if (this.p2PlayerState.health > this.p1PlayerState.health) {
        p2Won = true;
      }
      // Draw if equal health
    }

    if (p1Won) {
      this.p1PlayerState.roundsWon++;
      const p1Fighter = FIGHTER_REGISTRY[this.p1FighterId];
      const p1Name = p1Fighter?.displayName ?? 'Player 1';
      this.announcerUI.showWins(p1Name);
    } else if (p2Won) {
      this.p2PlayerState.roundsWon++;
      const p2Fighter = FIGHTER_REGISTRY[this.p2FighterId];
      const p2Name = p2Fighter?.displayName ?? 'Player 2';
      this.announcerUI.showWins(p2Name);
    } else {
      this.announcerUI.showDraw();
    }

    // Update round indicators
    this.healthBarUI.setRoundWins(
      this.p1PlayerState.roundsWon,
      this.p2PlayerState.roundsWon
    );

    // Check for match end
    this.time.delayedCall(2500, () => {
      if (
        this.p1PlayerState.roundsWon >= this.matchConfig.roundsToWin ||
        this.p2PlayerState.roundsWon >= this.matchConfig.roundsToWin
      ) {
        this.endMatch();
      } else {
        this.currentRound++;
        this.startRound();
      }
    });
  }

  /** End the match */
  private endMatch(): void {
    this.gamePhase = GamePhase.MATCH_END;

    const p1Won = this.p1PlayerState.roundsWon >= this.matchConfig.roundsToWin;
    const p1Fighter = FIGHTER_REGISTRY[this.p1FighterId];
    const p2Fighter = FIGHTER_REGISTRY[this.p2FighterId];
    const winner = p1Won
      ? (p1Fighter?.displayName ?? 'Player 1')
      : (p2Fighter?.displayName ?? 'Player 2');

    // Check for flawless victory (winner has full health)
    const winnerHealth = p1Won ? this.p1PlayerState.health : this.p2PlayerState.health;
    const isFlawless = winnerHealth >= this.matchConfig.startingHealth;

    if (isFlawless) {
      this.announcerUI.showFlawlessVictory(winner);
    } else {
      this.announcerUI.showVictory(winner);
    }

    // Return to appropriate scene after delay
    this.time.delayedCall(4000, () => {
      if (this.gameMode === 'STORY' && this.storyProgress && this.storyFights) {
        // Return to story mode with fight result
        this.scene.start('StoryModeScene', {
          progress: this.storyProgress,
          fights: this.storyFights,
          fightResult: p1Won ? 'win' : 'lose',
        });
      } else {
        // Regular 1P/2P mode - return to character select
        this.scene.start('CharacterSelectScene', {
          gameMode: this.gameMode,
        });
      }
    });
  }

  update(_time: number, _delta: number): void {
    // Check for pause/escape
    if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
      this.togglePause();
      return;
    }

    // Handle pause menu keyboard navigation when paused
    if (this.isPaused) {
      this.handlePauseMenuInput();
      return;
    }

    if (this.gamePhase !== GamePhase.FIGHTING) return;
    if (this.fightState !== FightState.ACTIVE) return;

    // Process input
    const p1InputMask = this.getP1InputMask();
    const p2InputMask = this.getP2InputMask();

    // Update fighters with input bitmasks (pass player index for combo detection)
    updateFighter(this.p1State, p1InputMask, this.p2State, 0);
    updateFighter(this.p2State, p2InputMask, this.p1State, 1);

    // Resolve combat
    const result = resolveCombat(this.p1State, this.p2State);

    // Apply damage and play impact sounds
    if (result.damageToP1 > 0 && !result.p1Blocked) {
      this.p1PlayerState.health -= result.damageToP1;
      this.p1State.state = FighterState.HURT;
      this.p1State.stunFrames = 20;
      // Play impact sound when P1 is hit
      getAudioManager().playImpact();
    }
    if (result.damageToP2 > 0 && !result.p2Blocked) {
      this.p2PlayerState.health -= result.damageToP2;
      this.p2State.state = FighterState.HURT;
      this.p2State.stunFrames = 20;
      // Play impact sound when P2 is hit
      getAudioManager().playImpact();
    }

    // Clamp health
    this.p1PlayerState.health = Math.max(0, this.p1PlayerState.health);
    this.p2PlayerState.health = Math.max(0, this.p2PlayerState.health);

    // Update health UI
    this.healthBarUI.setHealth(
      this.p1PlayerState.health,
      this.p2PlayerState.health
    );

    // Update sprites
    this.updateSprites();

    // Update health bar animation
    this.healthBarUI.update();

    // Check for KO
    if (this.p1PlayerState.health <= 0 || this.p2PlayerState.health <= 0) {
      this.onKO();
    }
  }

  /** Get P1 input as bitmask */
  private getP1InputMask(): number {
    let mask = 0;

    // Keyboard input
    if (this.keys.p1Left.isDown) mask |= 0x01;
    if (this.keys.p1Right.isDown) mask |= 0x02;
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1Up)) mask |= 0x04;
    if (this.keys.p1Down.isDown) mask |= 0x08;
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1Attack1)) mask |= 0x10;
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1Attack2)) mask |= 0x20;
    if (this.keys.p1Block.isDown) mask |= 0x40;

    // Touch input (OR with keyboard)
    if (this.p1TouchInputs.has('left')) mask |= 0x01;
    if (this.p1TouchInputs.has('right')) mask |= 0x02;
    if (this.p1TouchJustPressed.has('up')) mask |= 0x04;
    if (this.p1TouchInputs.has('down')) mask |= 0x08;
    if (this.p1TouchJustPressed.has('attack1')) mask |= 0x10;
    if (this.p1TouchJustPressed.has('attack2')) mask |= 0x20;
    if (this.p1TouchInputs.has('block')) mask |= 0x40;

    // Clear just-pressed flags after reading
    this.p1TouchJustPressed.clear();

    return mask;
  }

  /** Get P2 input as bitmask (or AI input in 1P/Story mode) */
  private getP2InputMask(): number {
    // Use AI input in 1P and STORY modes
    if ((this.gameMode === '1P' || this.gameMode === 'STORY') && this.p2AI) {
      return this.p2AI.getInput(
        this.p2State,
        this.p1State,
        this.p2PlayerState.health,
        this.p1PlayerState.health
      );
    }

    // Human P2 input (keyboard)
    let mask = 0;
    if (this.keys.p2Left.isDown) mask |= 0x01;
    if (this.keys.p2Right.isDown) mask |= 0x02;
    if (Phaser.Input.Keyboard.JustDown(this.keys.p2Up)) mask |= 0x04;
    if (this.keys.p2Down.isDown) mask |= 0x08;
    if (Phaser.Input.Keyboard.JustDown(this.keys.p2Attack1)) mask |= 0x10;
    if (Phaser.Input.Keyboard.JustDown(this.keys.p2Attack2)) mask |= 0x20;
    if (this.keys.p2Block.isDown) mask |= 0x40;

    // Touch input for P2 (OR with keyboard) - only in 2P mode
    if (this.gameMode === '2P') {
      if (this.p2TouchInputs.has('left')) mask |= 0x01;
      if (this.p2TouchInputs.has('right')) mask |= 0x02;
      if (this.p2TouchJustPressed.has('up')) mask |= 0x04;
      if (this.p2TouchInputs.has('down')) mask |= 0x08;
      if (this.p2TouchJustPressed.has('attack1')) mask |= 0x10;
      if (this.p2TouchJustPressed.has('attack2')) mask |= 0x20;
      if (this.p2TouchInputs.has('block')) mask |= 0x40;

      // Clear just-pressed flags after reading
      this.p2TouchJustPressed.clear();
    }

    return mask;
  }

  /** Update fighter sprites based on state */
  private updateSprites(): void {
    // Update positions
    this.p1Sprite.setPosition(this.p1State.x, this.p1State.y);
    this.p2Sprite.setPosition(this.p2State.x, this.p2State.y);

    // Update facing - fighters face each other based on relative position
    // facing = 1 means facing right, facing = -1 means facing left
    // Sprite default faces right, so flip when facing left
    this.p1Sprite.setFlipX(this.p1State.facing === -1);
    this.p2Sprite.setFlipX(this.p2State.facing === -1);

    // Update animations
    this.updateSpriteAnimation(this.p1Sprite, this.p1FighterId, this.p1State);
    this.updateSpriteAnimation(this.p2Sprite, this.p2FighterId, this.p2State);

    // Update parallax background based on fighters' center position
    this.updateParallax();
  }

  /** Update sprite animation based on fighter state */
  private updateSpriteAnimation(
    sprite: Phaser.GameObjects.Sprite,
    fighterId: FighterId,
    state: FighterRuntimeState
  ): void {
    let animKey: string;

    switch (state.state) {
      case FighterState.WALK:
      case FighterState.RUN:
        animKey = `${fighterId}_walk`;
        break;
      case FighterState.ATTACK1:
        animKey = `${fighterId}_attack1`;
        break;
      case FighterState.ATTACK2:
        animKey = `${fighterId}_attack2`;
        break;
      case FighterState.HURT:
        animKey = `${fighterId}_hurt`;
        break;
      case FighterState.DEAD:
        animKey = `${fighterId}_dead`;
        break;
      default:
        animKey = `${fighterId}_idle`;
    }

    if (
      this.anims.exists(animKey) &&
      sprite.anims.currentAnim?.key !== animKey
    ) {
      sprite.play(animKey);
    }
  }

  /** Handle KO */
  private onKO(): void {
    this.fightState = FightState.KO;
    this.roundTimerEvent?.remove();

    // Set loser to dead state
    if (this.p1PlayerState.health <= 0) {
      this.p1State.state = FighterState.DEAD;
    }
    if (this.p2PlayerState.health <= 0) {
      this.p2State.state = FighterState.DEAD;
    }

    this.updateSprites();

    this.announcerUI.showKO(() => {
      this.time.delayedCall(1500, () => {
        this.endRound();
      });
    });
  }

  /** Update parallax scrolling based on fighters' positions */
  private updateParallax(): void {
    if (!this.backgroundDomElement || this.backgroundWidth <= GAME_WIDTH) return;

    // Calculate center point between fighters
    const centerX = (this.p1State.x + this.p2State.x) / 2;

    // Map fighter center to background offset
    // When fighters are at stage center, background is centered
    // When fighters move left/right, background shifts opposite direction (parallax)
    const stageCenter = (FIGHTER_PHYSICS.STAGE_LEFT + FIGHTER_PHYSICS.STAGE_RIGHT) / 2;
    const maxOffset = (this.backgroundWidth - GAME_WIDTH) / 2;

    // Normalize position (-1 to 1 range)
    const normalizedPos = (centerX - stageCenter) / (FIGHTER_PHYSICS.STAGE_RIGHT - stageCenter);

    // Apply parallax (0.3 factor for subtle effect)
    const parallaxOffset = normalizedPos * maxOffset * 0.3;

    // Update DOM element position via CSS transform (horizontal only, bottom-anchored)
    this.backgroundDomElement.style.transform = `translateX(calc(-50% - ${parallaxOffset}px))`;
  }

  /** Create mobile pause button */
  private createPauseButton(): void {
    this.pauseButton = this.add.container(50, 40);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x333344, 0.8);
    bg.fillRoundedRect(-30, -18, 60, 36, 8);
    bg.lineStyle(2, 0x666688);
    bg.strokeRoundedRect(-30, -18, 60, 36, 8);
    this.pauseButton.add(bg);

    // Pause icon (two vertical bars)
    const pauseIcon = this.add.text(0, 0, '⏸', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    });
    pauseIcon.setOrigin(0.5);
    this.pauseButton.add(pauseIcon);

    // Make interactive
    this.pauseButton.setSize(60, 36);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on('pointerdown', () => this.togglePause());
    this.pauseButton.setDepth(200);
  }

  /** Toggle pause state */
  private togglePause(): void {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  /** Pause the game and show pause menu */
  private pauseGame(): void {
    this.isPaused = true;

    // Pause timers
    if (this.roundTimerEvent) {
      this.roundTimerEvent.paused = true;
    }

    // Reset pause menu state
    this.pauseMenuButtons = [];
    this.pauseMenuCallbacks = [];
    this.pauseMenuSelectedIndex = 0;

    // Create pause menu
    this.pauseMenu = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.pauseMenu.setDepth(300);

    // Darken background
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    this.pauseMenu.add(overlay);

    // Menu box
    const menuBg = this.add.rectangle(0, 0, 300, 250, 0x222233, 0.95);
    menuBg.setStrokeStyle(3, 0xffcc00);
    this.pauseMenu.add(menuBg);

    // Title
    const title = this.add.text(0, -90, 'PAUSED', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '36px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    this.pauseMenu.add(title);

    // Resume button
    const resumeBtn = this.createMenuButton(0, -20, 'RESUME', () => this.resumeGame());
    this.pauseMenu.add(resumeBtn);
    this.pauseMenuButtons.push(resumeBtn);
    this.pauseMenuCallbacks.push(() => this.resumeGame());

    // Quit to Menu button
    const quitBtn = this.createMenuButton(0, 50, 'QUIT TO MENU', () => this.quitToMenu());
    this.pauseMenu.add(quitBtn);
    this.pauseMenuButtons.push(quitBtn);
    this.pauseMenuCallbacks.push(() => this.quitToMenu());

    // Highlight first button by default
    this.updatePauseMenuSelection();
  }

  /** Create a pause menu button */
  private createMenuButton(x: number, y: number, label: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 200, 50, 0x334477);
    bg.setStrokeStyle(2, 0x5566aa);
    container.add(bg);
    container.setData('bg', bg); // Store reference for selection highlighting

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Impact, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    container.add(text);

    // Make the container itself interactive (not just the bg)
    container.setSize(200, 50);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      // Update selection to this button on hover
      const index = this.pauseMenuButtons.indexOf(container);
      if (index >= 0) {
        this.pauseMenuSelectedIndex = index;
        this.updatePauseMenuSelection();
      }
    });
    container.on('pointerdown', callback);

    return container;
  }

  /** Update visual selection state of pause menu buttons */
  private updatePauseMenuSelection(): void {
    this.pauseMenuButtons.forEach((btn, index) => {
      const bg = btn.getData('bg') as Phaser.GameObjects.Rectangle | undefined;
      if (!bg) return;

      if (index === this.pauseMenuSelectedIndex) {
        bg.setFillStyle(0x446699);
        btn.setScale(1.05);
      } else {
        bg.setFillStyle(0x334477);
        btn.setScale(1);
      }
    });
  }

  /** Handle pause menu keyboard navigation */
  private handlePauseMenuInput(): void {
    if (!this.isPaused || this.pauseMenuButtons.length === 0) return;

    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    // Navigate up (W or Up Arrow)
    if (Phaser.Input.Keyboard.JustDown(keyboard.addKey('W')) ||
        Phaser.Input.Keyboard.JustDown(keyboard.addKey('UP'))) {
      this.pauseMenuSelectedIndex--;
      if (this.pauseMenuSelectedIndex < 0) {
        this.pauseMenuSelectedIndex = this.pauseMenuButtons.length - 1;
      }
      this.updatePauseMenuSelection();
    }

    // Navigate down (S or Down Arrow)
    if (Phaser.Input.Keyboard.JustDown(keyboard.addKey('S')) ||
        Phaser.Input.Keyboard.JustDown(keyboard.addKey('DOWN'))) {
      this.pauseMenuSelectedIndex++;
      if (this.pauseMenuSelectedIndex >= this.pauseMenuButtons.length) {
        this.pauseMenuSelectedIndex = 0;
      }
      this.updatePauseMenuSelection();
    }

    // Select (Enter or Space)
    if (Phaser.Input.Keyboard.JustDown(keyboard.addKey('ENTER')) ||
        Phaser.Input.Keyboard.JustDown(keyboard.addKey('SPACE'))) {
      const callback = this.pauseMenuCallbacks[this.pauseMenuSelectedIndex];
      if (callback) {
        callback();
      }
    }
  }

  /** Resume the game */
  private resumeGame(): void {
    this.isPaused = false;

    // Resume timers
    if (this.roundTimerEvent) {
      this.roundTimerEvent.paused = false;
    }

    // Destroy pause menu
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
    }
    this.pauseMenu = undefined!;
    this.pauseMenuButtons = [];
    this.pauseMenuCallbacks = [];
  }

  /** Quit to mode select menu */
  private quitToMenu(): void {
    // Clean up
    this.resumeGame();
    this.shutdown();
    this.scene.start('ModeSelectScene');
  }

  /** Clean up DOM elements when scene shuts down */
  shutdown(): void {
    // Stop background music
    getAudioManager().stopMusic();

    if (this.backgroundContainer) {
      this.backgroundContainer.remove();
    }
    this.backgroundContainer = undefined!;
    this.backgroundDomElement = undefined!;

    // Clean up touch controls
    if (this.touchControlsManager) {
      this.touchControlsManager.destroy();
      this.touchControlsManager = null;
    }
    this.p1TouchInputs.clear();
    this.p2TouchInputs.clear();
    this.p1TouchJustPressed.clear();
    this.p2TouchJustPressed.clear();

    // Clean up pause menu
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
    }
    this.pauseMenu = undefined!;
  }
}
