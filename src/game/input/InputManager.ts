/**
 * @fileoverview Input manager for handling keyboard and touch input
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/INPUT.md - Input system architecture
 */

import type Phaser from 'phaser';

import { PlayerId } from '../config/constants';
import type { InputAction, InputFrame } from '../sim/InputFrame';
import { INPUT_FLAGS, ACTION_TO_FLAG } from '../sim/InputFrame';
import { logger } from '../utils/logger';

import type { KeyBinding, AnyAction, MetaAction } from './InputBindings';
import {
  getAllBindings,
  createBindingMap,
  isInputAction,
} from './InputBindings';
import {
  TouchControls,
  TouchControlsManager,
} from './TouchControls';

// =============================================================================
// Types
// =============================================================================

/**
 * Callback for meta actions (non-game inputs).
 */
export type MetaActionCallback = (
  // eslint-disable-next-line no-unused-vars
  _action: MetaAction,
  // eslint-disable-next-line no-unused-vars
  _player: PlayerId | null
) => void;

/**
 * Per-player input state.
 * Tracks which input actions are currently active.
 */
interface PlayerInputState {
  /** Set of currently active input actions */
  activeActions: Set<InputAction>;
}

// =============================================================================
// InputManager
// =============================================================================

/**
 * Manages keyboard and touch input for multiple players.
 *
 * - Maps keyboard events to player actions
 * - Provides virtual touch controls for mobile devices
 * - Tracks per-player input state
 * - Captures InputFrames for simulation
 * - Handles meta actions via callbacks
 *
 * @example
 * ```typescript
 * const inputManager = new InputManager(scene, true);
 * inputManager.setMetaActionCallback((action, player) => {
 *   if (action === 'toggleDebug') toggleDebug();
 * });
 *
 * // In fixed tick:
 * const p1Input = inputManager.captureFrame(PlayerId.P1);
 * const p2Input = inputManager.captureFrame(PlayerId.P2);
 * ```
 */
export class InputManager {
  /** Phaser scene reference */
  private scene: Phaser.Scene;

  /** Key code to binding lookup */
  private bindingMap: Map<string, KeyBinding>;

  /** Per-player input states */
  private playerStates: Map<PlayerId, PlayerInputState>;

  /** Callback for meta actions */
  private metaActionCallback: MetaActionCallback | null = null;

  /** Phaser keyboard plugin */
  private keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null = null;

  /** Touch controls manager */
  private touchControlsManager: TouchControlsManager;

  /** Whether touch controls are enabled */
  private touchEnabled = false;

  /**
   * Create a new input manager.
   *
   * @param scene - Phaser scene
   * @param useNumpad - Whether to use numpad bindings for P2
   * @param enableTouchForPlayers - Players to enable touch controls for (default: P1 only)
   */
  constructor(
    scene: Phaser.Scene,
    useNumpad: boolean,
    enableTouchForPlayers: PlayerId[] = [PlayerId.P1]
  ) {
    this.scene = scene;
    this.bindingMap = createBindingMap(getAllBindings(useNumpad));
    this.playerStates = new Map();

    // Initialize player states
    this.playerStates.set(PlayerId.P1, { activeActions: new Set() });
    this.playerStates.set(PlayerId.P2, { activeActions: new Set() });

    // Initialize touch controls manager
    this.touchControlsManager = new TouchControlsManager();

    this.setupKeyboardListeners();
    this.setupTouchControls(enableTouchForPlayers);

    logger.info(`InputManager initialized (numpad: ${useNumpad}, touch: ${this.touchEnabled})`);
  }

  /**
   * Set up keyboard event listeners.
   */
  private setupKeyboardListeners(): void {
    this.keyboard = this.scene.input.keyboard;

    if (!this.keyboard) {
      logger.warn('Keyboard input not available');
      return;
    }

    // Listen for key down
    this.keyboard.on('keydown', this.handleKeyDown, this);

    // Listen for key up
    this.keyboard.on('keyup', this.handleKeyUp, this);
  }

  /**
   * Set up touch controls for mobile devices.
   */
  private setupTouchControls(enableForPlayers: PlayerId[]): void {
    // Only initialize if device supports touch
    if (!TouchControls.shouldShowTouchControls()) {
      return;
    }

    this.touchControlsManager.init(this.scene, enableForPlayers);
    this.touchEnabled = this.touchControlsManager.isEnabled();

    if (this.touchEnabled) {
      // Connect touch input to action state
      this.touchControlsManager.setAllInputCallbacks(
        (player: PlayerId, action: InputAction, active: boolean) => {
          this.setActionActive(player, action, active);
        }
      );
    }
  }

  /**
   * Handle key down event.
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    const binding = this.bindingMap.get(event.code);

    if (!binding) {
      return; // Key not bound
    }

    // Prevent default for bound keys
    event.preventDefault();

    if (isInputAction(binding.action)) {
      // Game input action
      if (binding.player !== null) {
        this.setActionActive(binding.player, binding.action, true);
      }
    } else {
      // Meta action - fire callback on key down only
      this.metaActionCallback?.(binding.action, binding.player);
    }
  };

  /**
   * Handle key up event.
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    const binding = this.bindingMap.get(event.code);

    if (!binding) {
      return; // Key not bound
    }

    event.preventDefault();

    if (isInputAction(binding.action) && binding.player !== null) {
      this.setActionActive(binding.player, binding.action, false);
    }
  };

  /**
   * Set an action's active state for a player.
   */
  private setActionActive(
    playerId: PlayerId,
    action: InputAction,
    active: boolean
  ): void {
    const state = this.playerStates.get(playerId);
    if (!state) return;

    if (active) {
      state.activeActions.add(action);
    } else {
      state.activeActions.delete(action);
    }
  }

  /**
   * Set callback for meta actions.
   *
   * @param callback - Function to call when meta action triggered
   */
  public setMetaActionCallback(callback: MetaActionCallback): void {
    this.metaActionCallback = callback;
  }

  /**
   * Capture current input state as an InputFrame.
   *
   * @param playerId - Player to capture input for
   * @returns Packed InputFrame
   */
  public captureFrame(playerId: PlayerId): InputFrame {
    const state = this.playerStates.get(playerId);
    if (!state) {
      return INPUT_FLAGS.NONE;
    }

    let frame: InputFrame = INPUT_FLAGS.NONE;

    for (const action of state.activeActions) {
      frame |= ACTION_TO_FLAG[action];
    }

    return frame;
  }

  /**
   * Capture input frames for both players.
   *
   * @returns Tuple of [P1 InputFrame, P2 InputFrame]
   */
  public captureAllFrames(): [InputFrame, InputFrame] {
    return [this.captureFrame(PlayerId.P1), this.captureFrame(PlayerId.P2)];
  }

  /**
   * Check if an action is currently active for a player.
   *
   * @param playerId - Player to check
   * @param action - Action to check
   * @returns True if action is active
   */
  public isActionActive(playerId: PlayerId, action: InputAction): boolean {
    const state = this.playerStates.get(playerId);
    return state?.activeActions.has(action) ?? false;
  }

  /**
   * Get all active actions for a player.
   *
   * @param playerId - Player to get actions for
   * @returns Array of active actions
   */
  public getActiveActions(playerId: PlayerId): InputAction[] {
    const state = this.playerStates.get(playerId);
    return state ? Array.from(state.activeActions) : [];
  }

  /**
   * Clear all active inputs for a player.
   *
   * @param playerId - Player to clear
   */
  public clearInputs(playerId: PlayerId): void {
    const state = this.playerStates.get(playerId);
    state?.activeActions.clear();
  }

  /**
   * Clear all active inputs for all players.
   */
  public clearAllInputs(): void {
    this.clearInputs(PlayerId.P1);
    this.clearInputs(PlayerId.P2);
  }

  /**
   * Clean up event listeners.
   */
  public destroy(): void {
    if (this.keyboard) {
      this.keyboard.off('keydown', this.handleKeyDown, this);
      this.keyboard.off('keyup', this.handleKeyUp, this);
    }

    // Clean up touch controls
    this.touchControlsManager.destroy();

    this.playerStates.clear();
    this.metaActionCallback = null;
  }

  /**
   * Check if touch controls are active.
   */
  public isTouchEnabled(): boolean {
    return this.touchEnabled;
  }

  /**
   * Get touch controls manager.
   */
  public getTouchControlsManager(): TouchControlsManager {
    return this.touchControlsManager;
  }

  /**
   * Update touch controls layout (call on resize).
   */
  public updateTouchLayout(): void {
    this.touchControlsManager.updateLayout();
  }

  /**
   * Get the action bound to a key code.
   *
   * @param code - Key code to look up
   * @returns Bound action or null
   */
  public getActionForKey(code: string): AnyAction | null {
    return this.bindingMap.get(code)?.action ?? null;
  }

  /**
   * Get all bindings.
   */
  public getBindings(): KeyBinding[] {
    return Array.from(this.bindingMap.values());
  }
}
