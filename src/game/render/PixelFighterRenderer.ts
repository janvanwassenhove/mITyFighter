/**
 * @fileoverview Fighter sprite rendering
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Sprite conventions
 * @see docs/ANIMATIONS.md - Animation handling
 */

import type Phaser from 'phaser';

import type { ActionId } from '../assets/AssetKeys';
import { getFighterAnimationKey, getFighterTextureKey } from '../assets/AssetKeys';
import { hasAnimation, getAvailableActions } from '../assets/FighterAssets';
import type { FighterId } from '../assets/fighterRegistry';
import {
  SPRITE_SCALE,
  IDLE_FALLBACKS,
  FacingDirection,
} from '../config/constants';
import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for creating a fighter renderer.
 */
export interface FighterRendererOptions {
  /** Fighter ID to render */
  fighterId: FighterId;
  /** Initial X position */
  x: number;
  /** Initial Y position */
  y: number;
  /** Initial facing direction */
  facing?: FacingDirection;
  /** Sprite scale */
  scale?: number;
}

// =============================================================================
// PixelFighterRenderer
// =============================================================================

/**
 * Renders a fighter sprite with animations.
 *
 * @example
 * ```typescript
 * const renderer = new PixelFighterRenderer(scene, {
 *   fighterId: 'kunoichi',
 *   x: 400,
 *   y: 500,
 * });
 *
 * renderer.playAction('attack1');
 * renderer.setFacing(FacingDirection.LEFT);
 * ```
 */
export class PixelFighterRenderer {
  /** Phaser scene */
  private scene: Phaser.Scene;

  /** Fighter sprite */
  private sprite: Phaser.GameObjects.Sprite;

  /** Current fighter ID */
  private fighterId: FighterId;

  /** Current action being played */
  private currentAction: ActionId | null = null;

  /** Current facing direction */
  private facing: FacingDirection;

  /** Available actions for current fighter */
  private availableActions: ActionId[];

  /** Callback when animation completes */
  private onAnimationComplete: ((action: ActionId) => void) | null = null;

  /**
   * Create a fighter renderer.
   *
   * @param scene - Phaser scene
   * @param options - Renderer options
   */
  constructor(scene: Phaser.Scene, options: FighterRendererOptions) {
    this.scene = scene;
    this.fighterId = options.fighterId;
    this.facing = options.facing ?? FacingDirection.RIGHT;
    this.availableActions = getAvailableActions(this.fighterId);

    // Get initial texture key
    const initialAction = this.getDefaultAction();
    const textureKey = getFighterTextureKey(this.fighterId, initialAction);

    // Create sprite
    this.sprite = scene.add.sprite(options.x, options.y, textureKey);
    this.sprite.setScale(options.scale ?? SPRITE_SCALE);
    this.sprite.setOrigin(0.5, 1); // Bottom-center for ground alignment

    // Apply facing
    this.applyFacing();

    // Set up animation complete listener
    this.sprite.on('animationcomplete', this.handleAnimationComplete, this);

    // Play initial idle
    this.playAction(initialAction);

    logger.debug(`Created fighter renderer: ${this.fighterId}`);
  }

  /**
   * Get the default action (idle fallback).
   */
  private getDefaultAction(): ActionId {
    for (const idle of IDLE_FALLBACKS) {
      if (this.availableActions.includes(idle)) {
        return idle;
      }
    }
    // Last resort: first available action
    return this.availableActions[0] ?? 'idle';
  }

  /**
   * Handle animation completion.
   */
  private handleAnimationComplete = (
    anim: Phaser.Animations.Animation
  ): void => {
    // Parse animation key to get action
    const parts = anim.key.split(':');
    const action = parts[2] as ActionId | undefined;

    if (action && this.currentAction === action) {
      this.onAnimationComplete?.(action);

      // Auto-return to idle for non-looping animations
      if (!this.isLoopingAction(action)) {
        this.returnToIdle();
      }
    }
  };

  /**
   * Check if an action loops.
   */
  private isLoopingAction(action: ActionId): boolean {
    const anim = this.scene.anims.get(
      getFighterAnimationKey(this.fighterId, action)
    );
    return anim?.repeat === -1;
  }

  /**
   * Return to idle animation.
   */
  private returnToIdle(): void {
    const idleAction = this.getDefaultAction();
    if (idleAction !== this.currentAction) {
      this.playAction(idleAction);
    }
  }

  /**
   * Apply facing direction to sprite.
   */
  private applyFacing(): void {
    this.sprite.setFlipX(this.facing === FacingDirection.LEFT);
  }

  /**
   * Play an action animation.
   *
   * @param action - Action to play
   * @returns True if animation started
   */
  public playAction(action: ActionId): boolean {
    // Check if we have this animation
    if (!hasAnimation(this.scene, this.fighterId, action)) {
      logger.warn(`Animation missing: ${this.fighterId}/${action}`);
      return false;
    }

    const animKey = getFighterAnimationKey(this.fighterId, action);

    // Don't restart same looping animation
    if (this.currentAction === action && this.isLoopingAction(action)) {
      return true;
    }

    this.sprite.play(animKey);
    this.currentAction = action;

    return true;
  }

  /**
   * Set the facing direction.
   *
   * @param direction - Direction to face
   */
  public setFacing(direction: FacingDirection): void {
    if (this.facing !== direction) {
      this.facing = direction;
      this.applyFacing();
    }
  }

  /**
   * Get current facing direction.
   */
  public getFacing(): FacingDirection {
    return this.facing;
  }

  /**
   * Set sprite position.
   *
   * @param x - X position
   * @param y - Y position
   */
  public setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }

  /**
   * Get sprite position.
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Change the fighter being rendered.
   *
   * @param fighterId - New fighter ID
   */
  public setFighter(fighterId: FighterId): void {
    if (this.fighterId === fighterId) return;

    this.fighterId = fighterId;
    this.availableActions = getAvailableActions(fighterId);
    this.currentAction = null;

    // Play new fighter's idle
    const idleAction = this.getDefaultAction();
    this.playAction(idleAction);

    logger.debug(`Changed fighter to: ${fighterId}`);
  }

  /**
   * Get current fighter ID.
   */
  public getFighterId(): FighterId {
    return this.fighterId;
  }

  /**
   * Get current action.
   */
  public getCurrentAction(): ActionId | null {
    return this.currentAction;
  }

  /**
   * Get current frame index.
   */
  public getCurrentFrame(): number {
    return this.sprite.anims.currentFrame?.index ?? 0;
  }

  /**
   * Get total frames in current animation.
   */
  public getTotalFrames(): number {
    return this.sprite.anims.currentAnim?.frames.length ?? 0;
  }

  /**
   * Check if an action is available.
   *
   * @param action - Action to check
   */
  public hasAction(action: ActionId): boolean {
    return hasAnimation(this.scene, this.fighterId, action);
  }

  /**
   * Get all available actions.
   */
  public getAvailableActions(): ActionId[] {
    return [...this.availableActions];
  }

  /**
   * Set animation complete callback.
   *
   * @param callback - Function to call when animation completes
   */
  public setOnAnimationComplete(
    callback: ((action: ActionId) => void) | null
  ): void {
    this.onAnimationComplete = callback;
  }

  /**
   * Get the underlying Phaser sprite.
   */
  public getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  /**
   * Set sprite depth (z-order).
   *
   * @param depth - Depth value
   */
  public setDepth(depth: number): void {
    this.sprite.setDepth(depth);
  }

  /**
   * Set sprite visibility.
   *
   * @param visible - Whether sprite is visible
   */
  public setVisible(visible: boolean): void {
    this.sprite.setVisible(visible);
  }

  /**
   * Destroy the renderer and sprite.
   */
  public destroy(): void {
    this.sprite.off('animationcomplete', this.handleAnimationComplete, this);
    this.sprite.destroy();
    this.onAnimationComplete = null;
  }
}
