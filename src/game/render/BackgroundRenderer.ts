/**
 * @fileoverview Background rendering
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Background conventions
 */

import type Phaser from 'phaser';

import { getBackgroundTextureKey } from '../assets/AssetKeys';
import { hasBackground } from '../assets/BackgroundAssets';
import type { BackgroundId } from '../assets/backgroundRegistry';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { logger } from '../utils/logger';

// =============================================================================
// BackgroundRenderer
// =============================================================================

/**
 * Renders background images.
 *
 * @example
 * ```typescript
 * const bgRenderer = new BackgroundRenderer(scene);
 * bgRenderer.setBackground('dojo');
 * ```
 */
export class BackgroundRenderer {
  /** Phaser scene */
  private scene: Phaser.Scene;

  /** Background image */
  private image: Phaser.GameObjects.Image | null = null;

  /** Current background ID */
  private currentBackground: BackgroundId | null = null;

  /**
   * Create a background renderer.
   *
   * @param scene - Phaser scene
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Set the current background.
   *
   * @param backgroundId - Background to display
   * @returns True if background was set
   */
  public setBackground(backgroundId: BackgroundId): boolean {
    // Check if texture exists
    if (!hasBackground(this.scene, backgroundId)) {
      logger.warn(`Background texture missing: ${backgroundId}`);
      return false;
    }

    // Destroy existing image
    if (this.image) {
      this.image.destroy();
      this.image = null;
    }

    const textureKey = getBackgroundTextureKey(backgroundId);

    // Create new background image
    this.image = this.scene.add.image(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      textureKey
    );

    // Scale to cover the game area
    this.scaleToFit();

    // Send to back
    this.image.setDepth(-100);

    this.currentBackground = backgroundId;

    logger.debug(`Set background: ${backgroundId}`);

    return true;
  }

  /**
   * Scale background to fit/cover game area.
   */
  private scaleToFit(): void {
    if (!this.image) return;

    const scaleX = GAME_WIDTH / this.image.width;
    const scaleY = GAME_HEIGHT / this.image.height;

    // Use max scale to cover entire area
    const scale = Math.max(scaleX, scaleY);

    this.image.setScale(scale);
  }

  /**
   * Get current background ID.
   */
  public getCurrentBackground(): BackgroundId | null {
    return this.currentBackground;
  }

  /**
   * Get the background image object.
   */
  public getImage(): Phaser.GameObjects.Image | null {
    return this.image;
  }

  /**
   * Set background tint.
   *
   * @param color - Tint color (e.g., 0xffffff)
   */
  public setTint(color: number): void {
    this.image?.setTint(color);
  }

  /**
   * Clear background tint.
   */
  public clearTint(): void {
    this.image?.clearTint();
  }

  /**
   * Set background alpha.
   *
   * @param alpha - Alpha value (0-1)
   */
  public setAlpha(alpha: number): void {
    this.image?.setAlpha(alpha);
  }

  /**
   * Create a solid color background as fallback.
   *
   * @param color - Color value
   */
  public createSolidColor(color: number): void {
    // Destroy existing image
    if (this.image) {
      this.image.destroy();
      this.image = null;
    }

    // Create a graphics object for solid color
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.setDepth(-100);

    this.currentBackground = null;
  }

  /**
   * Destroy the renderer.
   */
  public destroy(): void {
    if (this.image) {
      this.image.destroy();
      this.image = null;
    }
    this.currentBackground = null;
  }
}
