/**
 * @fileoverview Virtual touch controls for mobile devices
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/INPUT.md - Touch control layout and behavior
 */

/* eslint-disable no-undef */
/* global navigator */

import type Phaser from 'phaser';

import { PlayerId, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import type { InputAction } from '../sim/InputFrame';
import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

/**
 * Touch zone configuration
 */
interface TouchZone {
  x: number;
  y: number;
  radius: number;
}

/**
 * Virtual button configuration
 */
interface VirtualButton {
  action: InputAction;
  x: number;
  y: number;
  radius: number;
  color: number;
  label: string;
}

/**
 * Callback when touch input changes
 */
export type TouchInputCallback = (
  // eslint-disable-next-line no-unused-vars
  _player: PlayerId,
  // eslint-disable-next-line no-unused-vars
  _action: InputAction,
  // eslint-disable-next-line no-unused-vars
  _active: boolean
) => void;

// =============================================================================
// Constants
// =============================================================================

/** Base size for touch controls (scales with screen) */
const JOYSTICK_RADIUS = 60;
const JOYSTICK_KNOB_RADIUS = 30;
const BUTTON_RADIUS = 40;
const BUTTON_SPACING = 95;

/** Joystick deadzone (percentage of radius) */
const JOYSTICK_DEADZONE = 0.2;

/** Opacity for touch controls */
const CONTROL_ALPHA = 0.6;
const CONTROL_ALPHA_PRESSED = 0.9;

// =============================================================================
// TouchControls
// =============================================================================

/**
 * Virtual touch controls with joystick and action buttons.
 * 
 * Layout:
 * ```
 * ┌──────────────────────────────────────────────────────────────┐
 * │                        Game View                             │
 * │                                                              │
 * │                                                              │
 * │                                                              │
 * ├────────────────────────┬─────────────────────────────────────┤
 * │   Virtual Joystick     │              Action Buttons         │
 * │   ┌───┐                │                      ┌───┐ ┌───┐   │
 * │   │   │                │                      │ A │ │ B │   │
 * │   └───┘                │                      └───┘ └───┘   │
 * │                        │                      ┌───┐ ┌───┐   │
 * │                        │                      │ S │ │ K │   │
 * │                        │                      └───┘ └───┘   │
 * └────────────────────────┴─────────────────────────────────────┘
 * ```
 * 
 * - A = Attack 1 (punch)
 * - B = Attack 2 (kick)  
 * - S = Special
 * - K = Block
 */
export class TouchControls {
  /** Phaser scene reference */
  private scene: Phaser.Scene;

  /** Player this control set belongs to */
  private playerId: PlayerId;

  /** Callback for input changes */
  private inputCallback: TouchInputCallback | null = null;

  /** Graphics object for rendering */
  private graphics: Phaser.GameObjects.Graphics;

  /** Container for all touch control elements */
  private container: Phaser.GameObjects.Container;

  /** Joystick base position */
  private joystickBase: TouchZone;

  /** Joystick knob position (current) */
  private joystickKnob: { x: number; y: number };

  /** Joystick pointer ID (for multi-touch tracking) */
  private joystickPointerId: number | null = null;

  /** Action buttons */
  private buttons: VirtualButton[];

  /** Active button pointer IDs */
  private buttonPointerIds: Map<InputAction, number> = new Map();

  /** Currently active directional inputs */
  private activeDirections: Set<InputAction> = new Set();

  /** Whether controls are visible */
  private _visible = true;

  /** Scale factor based on screen size */
  private scaleFactor = 1;

  constructor(scene: Phaser.Scene, playerId: PlayerId) {
    this.scene = scene;
    this.playerId = playerId;

    // Calculate scale based on screen size
    this.calculateScale();

    // Create container for all elements
    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000); // Above everything

    // Create graphics for rendering
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // Initialize joystick
    this.joystickBase = this.createJoystickZone();
    this.joystickKnob = { x: this.joystickBase.x, y: this.joystickBase.y };

    // Initialize buttons
    this.buttons = this.createButtons();

    // Setup touch input handlers
    this.setupTouchHandlers();

    // Enable multi-touch for simultaneous joystick + buttons
    this.scene.input.addPointer(3); // Allow up to 4 simultaneous touches

    // Initial render
    this.render();

    logger.info(`TouchControls initialized for P${playerId + 1}`);
  }

  /**
   * Calculate scale factor based on screen dimensions
   */
  private calculateScale(): void {
    const minDimension = Math.min(
      this.scene.scale.width,
      this.scene.scale.height
    );
    // Scale controls for smaller screens
    this.scaleFactor = Math.max(0.6, Math.min(1.2, minDimension / 720));
  }

  /**
   * Create joystick zone configuration
   */
  private createJoystickZone(): TouchZone {
    const radius = JOYSTICK_RADIUS * this.scaleFactor;
    const padding = 40 * this.scaleFactor;

    // Position based on player (P1 = left, P2 = right)
    const x = this.playerId === PlayerId.P1
      ? padding + radius
      : GAME_WIDTH - padding - radius;

    const y = GAME_HEIGHT - padding - radius;

    return { x, y, radius };
  }

  /**
   * Create action button configurations
   */
  private createButtons(): VirtualButton[] {
    const radius = BUTTON_RADIUS * this.scaleFactor;
    const spacing = BUTTON_SPACING * this.scaleFactor;
    const padding = 40 * this.scaleFactor;

    // Position based on player (P1 = right side, P2 = left side)
    const baseX = this.playerId === PlayerId.P1
      ? GAME_WIDTH - padding - radius - spacing
      : padding + radius + spacing;

    const baseY = GAME_HEIGHT - padding - radius - spacing / 2;

    // Mirror button positions for P2
    const xMult = this.playerId === PlayerId.P1 ? 1 : -1;

    return [
      {
        action: 'attack1' as InputAction,
        x: baseX,
        y: baseY - spacing / 2,
        radius,
        color: 0xff6b6b, // Red
        label: 'A',
      },
      {
        action: 'attack2' as InputAction,
        x: baseX + spacing * xMult,
        y: baseY - spacing / 2,
        radius,
        color: 0x4ecdc4, // Cyan
        label: 'B',
      },
      {
        action: 'special' as InputAction,
        x: baseX,
        y: baseY + spacing / 2,
        radius,
        color: 0xffe66d, // Yellow
        label: 'S',
      },
      {
        action: 'block' as InputAction,
        x: baseX + spacing * xMult,
        y: baseY + spacing / 2,
        radius,
        color: 0x95e1d3, // Green
        label: 'K',
      },
    ];
  }

  /**
   * Setup touch event handlers
   */
  private setupTouchHandlers(): void {
    // Use Phaser's input system for touch events
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
    this.scene.input.on('pointerupoutside', this.onPointerUp, this);
  }

  /**
   * Handle pointer down event
   */
  private onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (!this._visible) return;

    // Use pointer position (already scaled to game coordinates by Phaser)
    const x = pointer.x;
    const y = pointer.y;

    // Debug logging
    // logger.info(`Touch down at (${x.toFixed(0)}, ${y.toFixed(0)})`);

    // Check joystick first
    if (this.isInJoystickZone(x, y) && this.joystickPointerId === null) {
      this.joystickPointerId = pointer.id;
      this.updateJoystick(x, y);
      return;
    }

    // Check buttons - don't return early, allow checking all buttons
    for (const button of this.buttons) {
      if (this.isInButton(x, y, button)) {
        if (!this.buttonPointerIds.has(button.action)) {
          this.buttonPointerIds.set(button.action, pointer.id);
          this.setActionActive(button.action, true);
          // logger.info(`Button ${button.label} pressed`);
        }
        this.render();
        return;
      }
    }
  };

  /**
   * Handle pointer move event
   */
  private onPointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this._visible) return;

    // Update joystick if this is the joystick pointer
    if (pointer.id === this.joystickPointerId) {
      this.updateJoystick(pointer.x, pointer.y);
    }
  };

  /**
   * Handle pointer up event
   */
  private onPointerUp = (pointer: Phaser.Input.Pointer): void => {
    // Release joystick
    if (pointer.id === this.joystickPointerId) {
      this.joystickPointerId = null;
      this.resetJoystick();
    }

    // Release buttons
    for (const [action, pointerId] of this.buttonPointerIds.entries()) {
      if (pointerId === pointer.id) {
        this.buttonPointerIds.delete(action);
        this.setActionActive(action, false);
        this.render();
      }
    }
  };

  /**
   * Check if point is in joystick zone
   */
  private isInJoystickZone(x: number, y: number): boolean {
    const dx = x - this.joystickBase.x;
    const dy = y - this.joystickBase.y;
    const extendedRadius = this.joystickBase.radius * 1.5; // Allow touches slightly outside
    return dx * dx + dy * dy <= extendedRadius * extendedRadius;
  }

  /**
   * Check if point is in a button
   */
  private isInButton(x: number, y: number, button: VirtualButton): boolean {
    const dx = x - button.x;
    const dy = y - button.y;
    const extendedRadius = button.radius * 1.3; // Slightly larger hit area
    return dx * dx + dy * dy <= extendedRadius * extendedRadius;
  }

  /**
   * Update joystick position and direction
   */
  private updateJoystick(x: number, y: number): void {
    const dx = x - this.joystickBase.x;
    const dy = y - this.joystickBase.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to radius
    const maxRadius = this.joystickBase.radius;
    if (distance > maxRadius) {
      const scale = maxRadius / distance;
      this.joystickKnob.x = this.joystickBase.x + dx * scale;
      this.joystickKnob.y = this.joystickBase.y + dy * scale;
    } else {
      this.joystickKnob.x = x;
      this.joystickKnob.y = y;
    }

    // Calculate normalized direction
    const normalizedDist = Math.min(distance / maxRadius, 1);
    const angle = Math.atan2(dy, dx);

    // Update directional inputs based on angle and distance
    this.updateDirectionalInputs(angle, normalizedDist);

    this.render();
  }

  /**
   * Update directional inputs based on joystick angle
   */
  private updateDirectionalInputs(angle: number, distance: number): void {
    const newDirections = new Set<InputAction>();

    // Check if outside deadzone
    if (distance > JOYSTICK_DEADZONE) {
      // Convert angle to 8-way direction
      // Angle: 0 = right, PI/2 = down, PI = left, -PI/2 = up
      const degrees = (angle * 180) / Math.PI;

      // Horizontal
      if (degrees > -67.5 && degrees < 67.5) {
        newDirections.add('right');
      } else if (degrees > 112.5 || degrees < -112.5) {
        newDirections.add('left');
      }

      // Vertical
      if (degrees > 22.5 && degrees < 157.5) {
        newDirections.add('down');
      } else if (degrees < -22.5 && degrees > -157.5) {
        newDirections.add('up');
      }
    }

    // Fire callbacks for changes
    for (const dir of ['left', 'right', 'up', 'down'] as InputAction[]) {
      const wasActive = this.activeDirections.has(dir);
      const isActive = newDirections.has(dir);

      if (wasActive !== isActive) {
        this.setActionActive(dir, isActive);
      }
    }

    this.activeDirections = newDirections;
  }

  /**
   * Reset joystick to center
   */
  private resetJoystick(): void {
    this.joystickKnob.x = this.joystickBase.x;
    this.joystickKnob.y = this.joystickBase.y;

    // Clear all directional inputs
    for (const dir of this.activeDirections) {
      this.setActionActive(dir, false);
    }
    this.activeDirections.clear();

    this.render();
  }

  /**
   * Set action active state and fire callback
   */
  private setActionActive(action: InputAction, active: boolean): void {
    this.inputCallback?.(this.playerId, action, active);
  }

  /**
   * Render the touch controls
   */
  private render(): void {
    this.graphics.clear();

    if (!this._visible) return;

    // Draw joystick base
    this.graphics.fillStyle(0x333333, CONTROL_ALPHA);
    this.graphics.fillCircle(
      this.joystickBase.x,
      this.joystickBase.y,
      this.joystickBase.radius
    );

    // Draw joystick base outline
    this.graphics.lineStyle(3, 0x666666, CONTROL_ALPHA);
    this.graphics.strokeCircle(
      this.joystickBase.x,
      this.joystickBase.y,
      this.joystickBase.radius
    );

    // Draw joystick knob
    const knobPressed = this.joystickPointerId !== null;
    this.graphics.fillStyle(0xffffff, knobPressed ? CONTROL_ALPHA_PRESSED : CONTROL_ALPHA);
    this.graphics.fillCircle(
      this.joystickKnob.x,
      this.joystickKnob.y,
      JOYSTICK_KNOB_RADIUS * this.scaleFactor
    );

    // Draw buttons
    for (const button of this.buttons) {
      const isPressed = this.buttonPointerIds.has(button.action);
      const alpha = isPressed ? CONTROL_ALPHA_PRESSED : CONTROL_ALPHA;

      // Button background
      this.graphics.fillStyle(button.color, alpha);
      this.graphics.fillCircle(button.x, button.y, button.radius);

      // Button outline
      this.graphics.lineStyle(3, 0xffffff, alpha);
      this.graphics.strokeCircle(button.x, button.y, button.radius);
    }

    // Draw button labels using text objects (created once)
    this.updateButtonLabels();
  }

  /** Text objects for button labels */
  private buttonLabels: Phaser.GameObjects.Text[] = [];

  /**
   * Update button label text objects
   */
  private updateButtonLabels(): void {
    // Create labels if needed
    if (this.buttonLabels.length === 0) {
      for (const button of this.buttons) {
        const label = this.scene.add.text(button.x, button.y, button.label, {
          fontFamily: 'monospace',
          fontSize: `${Math.floor(24 * this.scaleFactor)}px`,
          color: '#ffffff',
          fontStyle: 'bold',
        });
        label.setOrigin(0.5, 0.5);
        label.setDepth(1001);
        this.buttonLabels.push(label);
        this.container.add(label);
      }
    }

    // Update label visibility
    for (const label of this.buttonLabels) {
      label.setVisible(this._visible);
    }
  }

  /**
   * Set input callback
   */
  public setInputCallback(callback: TouchInputCallback): void {
    this.inputCallback = callback;
  }

  /**
   * Check if touch controls should be shown
   */
  public static shouldShowTouchControls(): boolean {
    // Check if running in browser environment
    if (typeof window === 'undefined') {
      return false;
    }

    // Allow forcing touch controls via URL parameter for testing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('touch') === '1' || urlParams.get('touch') === 'true') {
      return true;
    }

    // Check if device supports touch
    const hasTouch = 'ontouchstart' in window || 
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
    
    // Check if it's a mobile/tablet device
    const isMobileDevice = typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Also check screen size (tablets/phones typically < 1024px width in portrait)
    const isSmallScreen = window.innerWidth <= 1366;

    // Show touch controls if it's a touch device AND (mobile user agent OR small screen)
    return hasTouch && (isMobileDevice || isSmallScreen);
  }

  /**
   * Get visibility state
   */
  public get visible(): boolean {
    return this._visible;
  }

  /**
   * Set visibility
   */
  public set visible(value: boolean) {
    this._visible = value;
    this.container.setVisible(value);
    this.render();
  }

  /**
   * Toggle visibility
   */
  public toggle(): void {
    this.visible = !this._visible;
  }

  /**
   * Update layout (call on resize)
   */
  public updateLayout(): void {
    this.calculateScale();
    this.joystickBase = this.createJoystickZone();
    this.joystickKnob = { x: this.joystickBase.x, y: this.joystickBase.y };
    this.buttons = this.createButtons();

    // Update label positions
    for (let i = 0; i < this.buttonLabels.length; i++) {
      const button = this.buttons[i];
      const label = this.buttonLabels[i];
      if (button && label) {
        label.setPosition(button.x, button.y);
        label.setFontSize(`${Math.floor(24 * this.scaleFactor)}px`);
      }
    }

    this.render();
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Remove event listeners
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.scene.input.off('pointerupoutside', this.onPointerUp, this);

    // Destroy graphics and container
    this.graphics.destroy();
    this.container.destroy();

    this.inputCallback = null;
    logger.info(`TouchControls destroyed for P${this.playerId + 1}`);
  }
}

/**
 * Manager for touch controls across scenes
 */
export class TouchControlsManager {
  private controls: Map<PlayerId, TouchControls> = new Map();
  private enabled = false;

  /**
   * Initialize touch controls for a scene
   */
  public init(scene: Phaser.Scene, players: PlayerId[] = [PlayerId.P1]): void {
    // Clean up any existing controls
    this.destroy();

    // Only create if touch should be shown
    if (!TouchControls.shouldShowTouchControls()) {
      logger.info('Touch controls not needed for this device');
      return;
    }

    this.enabled = true;

    for (const playerId of players) {
      const controls = new TouchControls(scene, playerId);
      this.controls.set(playerId, controls);
    }

    logger.info(`TouchControlsManager initialized with ${players.length} player(s)`);
  }

  /**
   * Set input callback for a player
   */
  public setInputCallback(playerId: PlayerId, callback: TouchInputCallback): void {
    this.controls.get(playerId)?.setInputCallback(callback);
  }

  /**
   * Set input callback for all players
   */
  public setAllInputCallbacks(callback: TouchInputCallback): void {
    for (const controls of this.controls.values()) {
      controls.setInputCallback(callback);
    }
  }

  /**
   * Check if touch controls are enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get controls for a player
   */
  public getControls(playerId: PlayerId): TouchControls | undefined {
    return this.controls.get(playerId);
  }

  /**
   * Update layout for all controls
   */
  public updateLayout(): void {
    for (const controls of this.controls.values()) {
      controls.updateLayout();
    }
  }

  /**
   * Set visibility for all controls
   */
  public setVisible(visible: boolean): void {
    for (const controls of this.controls.values()) {
      controls.visible = visible;
    }
  }

  /**
   * Clean up all controls
   */
  public destroy(): void {
    for (const controls of this.controls.values()) {
      controls.destroy();
    }
    this.controls.clear();
    this.enabled = false;
  }
}
