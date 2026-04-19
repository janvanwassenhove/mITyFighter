/**
 * @fileoverview Playground scene for 2-player testing
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/INPUT.md - Control scheme
 * @see docs/ARCHITECTURE.md - Scene responsibilities
 */

import Phaser from 'phaser';

import type { ActionId } from '../assets/AssetKeys';
import {
  BACKGROUND_IDS,
  getNextBackgroundId,
  type BackgroundId,
} from '../assets/backgroundRegistry';
import {
  getNextFighterId,
  type FighterId,
} from '../assets/fighterRegistry';
import { getAudioManager } from '../audio/AudioManager';
import {
  PlayerId,
  PLAYER_START_POSITIONS,
  PLAYER_START_FACING,
  FacingDirection,
} from '../config/constants';
import { INPUT_CONFIG } from '../config/gameConfig';
import type { MetaAction } from '../input/InputBindings';
import { InputManager } from '../input/InputManager';
import { getP1MovementKeysDisplay } from '../input/KeyboardLayout';
import { BackgroundRenderer } from '../render/BackgroundRenderer';
import { DebugOverlay, type PlayerDebugInfo } from '../render/DebugOverlay';
import { PixelFighterRenderer } from '../render/PixelFighterRenderer';
import { FixedTimestepLoop } from '../sim/FixedTimestepLoop';
import { INPUT_FLAGS, hasFlag } from '../sim/InputFrame';
import type { InputFrame } from '../sim/InputFrame';
import { logger } from '../utils/logger';

/**
 * Playground scene for testing fighters and controls.
 */
export class PlaygroundScene extends Phaser.Scene {
  /** Fixed timestep simulation loop */
  private simLoop!: FixedTimestepLoop;

  /** Input manager */
  private inputManager!: InputManager;

  /** Fighter renderers for each player */
  private fighters!: [PixelFighterRenderer, PixelFighterRenderer];

  /** Background renderer */
  private backgroundRenderer!: BackgroundRenderer;

  /** Debug overlay */
  private debugOverlay!: DebugOverlay;

  /** Current fighter IDs */
  private fighterIds: [FighterId, FighterId] = ['ninja_jan', 'ninja_jan'];

  /** Current background ID (null if no backgrounds registered) */
  private currentBackground: BackgroundId | null = BACKGROUND_IDS[0] ?? null;

  constructor() {
    super({ key: 'PlaygroundScene' });
  }

  create(): void {
    logger.info('PlaygroundScene started');

    // Initialize audio manager for this scene
    getAudioManager().init(this);

    // Start background music
    getAudioManager().playMusic();

    // Initialize background
    this.initBackground();

    // Initialize fighters
    this.initFighters();

    // Initialize input
    this.initInput();

    // Initialize simulation loop
    this.initSimulation();

    // Initialize debug overlay
    this.initDebugOverlay();

    // Add instructions text
    this.addInstructions();

    logger.info('PlaygroundScene ready');
  }

  /**
   * Initialize background renderer.
   */
  private initBackground(): void {
    this.backgroundRenderer = new BackgroundRenderer(this);

    // Try to set background if one is registered, use solid color as fallback
    if (
      !this.currentBackground ||
      !this.backgroundRenderer.setBackground(this.currentBackground)
    ) {
      logger.info('No backgrounds registered, using solid color');
      this.backgroundRenderer.createSolidColor(0x2d3436);
    }
  }

  /**
   * Initialize fighter renderers.
   */
  private initFighters(): void {
    const p1Start = PLAYER_START_POSITIONS[PlayerId.P1];
    const p2Start = PLAYER_START_POSITIONS[PlayerId.P2];

    this.fighters = [
      new PixelFighterRenderer(this, {
        fighterId: this.fighterIds[0],
        x: p1Start.x,
        y: p1Start.y,
        facing: PLAYER_START_FACING[PlayerId.P1],
      }),
      new PixelFighterRenderer(this, {
        fighterId: this.fighterIds[1],
        x: p2Start.x,
        y: p2Start.y,
        facing: PLAYER_START_FACING[PlayerId.P2],
      }),
    ];

    // Set depth order
    this.fighters[0].setDepth(10);
    this.fighters[1].setDepth(10);
  }

  /**
   * Initialize input manager.
   */
  private initInput(): void {
    this.inputManager = new InputManager(this, INPUT_CONFIG.useNumpad);

    // Handle meta actions
    this.inputManager.setMetaActionCallback((action, player) => {
      this.handleMetaAction(action, player);
    });
  }

  /**
   * Initialize fixed timestep simulation loop.
   */
  private initSimulation(): void {
    this.simLoop = new FixedTimestepLoop();

    // Set input provider
    this.simLoop.setInputProvider(() => this.inputManager.captureAllFrames());

    // Set tick callback
    this.simLoop.setTickCallback((tick, inputs) => {
      this.simulationTick(tick, inputs);
    });
  }

  /**
   * Initialize debug overlay.
   */
  private initDebugOverlay(): void {
    this.debugOverlay = new DebugOverlay(this);
  }

  /**
   * Add instructions text to the scene.
   */
  private addInstructions(): void {
    const p1Keys = getP1MovementKeysDisplay();
    const text = [
      'DevoxxFighter - Playground',
      '',
      `P1: ${p1Keys} + F/G/H (attacks) + Q/E (cycle char)`,
      'P2: Arrows + Numpad 1/2/3 (attacks) + U/O (cycle char)',
      '',
      'F1: Toggle Debug | Z/C: Cycle Background',
    ].join('\n');

    this.add.text(10, 10, text, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 },
    }).setAlpha(0.8);
  }

  /**
   * Handle meta action (non-game input).
   */
  private handleMetaAction(action: MetaAction, player: PlayerId | null): void {
    switch (action) {
      case 'toggleDebug':
        this.debugOverlay.toggle();
        break;

      case 'cycleCharacterPrev':
        if (player !== null) {
          this.cycleFighter(player, -1);
        }
        break;

      case 'cycleCharacterNext':
        if (player !== null) {
          this.cycleFighter(player, 1);
        }
        break;

      case 'cycleBackgroundPrev':
        this.cycleBackground(-1);
        break;

      case 'cycleBackgroundNext':
        this.cycleBackground(1);
        break;
    }
  }

  /**
   * Cycle fighter for a player.
   */
  private cycleFighter(player: PlayerId, direction: 1 | -1): void {
    const currentId = this.fighterIds[player];
    const nextId = getNextFighterId(currentId, direction);

    this.fighterIds[player] = nextId;
    this.fighters[player].setFighter(nextId);

    logger.info(`Player ${player + 1} changed to: ${nextId}`);
  }

  /**
   * Cycle background.
   */
  private cycleBackground(direction: 1 | -1): void {
    // No backgrounds registered
    if (!this.currentBackground || BACKGROUND_IDS.length === 0) {
      logger.debug('No backgrounds available to cycle');
      return;
    }

    const nextId = getNextBackgroundId(this.currentBackground, direction);
    this.currentBackground = nextId;

    if (!this.backgroundRenderer.setBackground(nextId)) {
      this.backgroundRenderer.createSolidColor(0x2d3436);
    }

    logger.info(`Background changed to: ${nextId}`);
  }

  /**
   * Process a simulation tick.
   */
  private simulationTick(
    _tick: number,
    inputs: [InputFrame, InputFrame]
  ): void {
    // Process inputs for each player
    this.processPlayerInput(PlayerId.P1, inputs[0]);
    this.processPlayerInput(PlayerId.P2, inputs[1]);
  }

  /**
   * Process input for a single player.
   */
  private processPlayerInput(player: PlayerId, input: InputFrame): void {
    const fighter = this.fighters[player];

    // Handle movement direction (update facing)
    if (hasFlag(input, INPUT_FLAGS.LEFT)) {
      fighter.setFacing(FacingDirection.LEFT);
    } else if (hasFlag(input, INPUT_FLAGS.RIGHT)) {
      fighter.setFacing(FacingDirection.RIGHT);
    }

    // Handle action inputs (only if not already in non-idle action)
    const currentAction = fighter.getCurrentAction();
    const isIdle = currentAction === 'idle';

    if (isIdle || this.isLoopingAction(currentAction)) {
      // Priority: attacks > special > movement
      if (hasFlag(input, INPUT_FLAGS.ATTACK1)) {
        this.tryPlayAction(fighter, 'attack1');
      } else if (hasFlag(input, INPUT_FLAGS.ATTACK2)) {
        this.tryPlayAction(fighter, 'attack2');
      } else if (hasFlag(input, INPUT_FLAGS.SPECIAL)) {
        this.tryPlayAction(fighter, 'special');
      } else if (hasFlag(input, INPUT_FLAGS.UP)) {
        this.tryPlayAction(fighter, 'jump');
      } else if (hasFlag(input, INPUT_FLAGS.LEFT) || hasFlag(input, INPUT_FLAGS.RIGHT)) {
        this.tryPlayAction(fighter, 'walk');
      } else if (hasFlag(input, INPUT_FLAGS.BLOCK)) {
        // Block - just face direction for now
      } else {
        // No input - return to idle
        this.tryPlayAction(fighter, 'idle');
      }
    }
  }

  /**
   * Check if an action loops.
   */
  private isLoopingAction(action: ActionId | null): boolean {
    return action === 'idle' || action === 'walk' || action === 'run';
  }

  /**
   * Try to play an action, with fallbacks.
   */
  private tryPlayAction(fighter: PixelFighterRenderer, action: ActionId): void {
    if (fighter.hasAction(action)) {
      fighter.playAction(action);
    }
  }

  /**
   * Get debug info for a player.
   */
  private getPlayerDebugInfo(player: PlayerId): PlayerDebugInfo {
    const fighter = this.fighters[player];
    const pos = fighter.getPosition();

    return {
      fighterId: fighter.getFighterId(),
      action: fighter.getCurrentAction(),
      frameIndex: fighter.getCurrentFrame(),
      totalFrames: fighter.getTotalFrames(),
      facing: fighter.getFacing(),
      x: pos.x,
      y: pos.y,
    };
  }

  update(_time: number, delta: number): void {
    // Run fixed timestep simulation
    this.simLoop.update(delta);

    // Update debug overlay
    if (this.debugOverlay.isVisible()) {
      this.debugOverlay.update({
        tick: this.simLoop.getCurrentTick(),
        fps: this.game.loop.actualFps,
        players: [
          this.getPlayerDebugInfo(PlayerId.P1),
          this.getPlayerDebugInfo(PlayerId.P2),
        ],
      });
    }
  }

  shutdown(): void {
    // Clean up
    this.inputManager.destroy();
    this.fighters[0].destroy();
    this.fighters[1].destroy();
    this.backgroundRenderer.destroy();
    this.debugOverlay.destroy();
  }
}
