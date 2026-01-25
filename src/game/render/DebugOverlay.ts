/**
 * @fileoverview Debug overlay for development
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ANIMATIONS.md - Debug display info
 */

import type Phaser from 'phaser';

import type { ActionId } from '../assets/AssetKeys';
import type { FighterId } from '../assets/fighterRegistry';
import { GAME_WIDTH, FacingDirection } from '../config/constants';

// =============================================================================
// Types
// =============================================================================

/**
 * Debug info for a single player.
 */
export interface PlayerDebugInfo {
  fighterId: FighterId;
  action: ActionId | null;
  frameIndex: number;
  totalFrames: number;
  facing: FacingDirection;
  x: number;
  y: number;
}

/**
 * Debug info for the game.
 */
export interface GameDebugInfo {
  tick: number;
  fps: number;
  players: [PlayerDebugInfo, PlayerDebugInfo];
}

// =============================================================================
// DebugOverlay
// =============================================================================

/**
 * Debug overlay that shows game state information.
 * Toggle with F1.
 *
 * @example
 * ```typescript
 * const debug = new DebugOverlay(scene);
 *
 * // In update:
 * debug.update({
 *   tick: 100,
 *   fps: 60,
 *   players: [p1Info, p2Info],
 * });
 *
 * // Toggle visibility:
 * debug.toggle();
 * ```
 */
export class DebugOverlay {
  /** Container for all debug elements */
  private container: Phaser.GameObjects.Container;

  /** Text elements for each player */
  private playerTexts: [Phaser.GameObjects.Text, Phaser.GameObjects.Text];

  /** General info text */
  private infoText: Phaser.GameObjects.Text;

  /** Controls help text */
  private controlsText: Phaser.GameObjects.Text;

  /** Background graphics */
  private background: Phaser.GameObjects.Graphics;

  /** Whether overlay is visible */
  private visible = false;

  /** Text style configuration */
  private readonly textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#00ff00',
  };

  /**
   * Create debug overlay.
   *
   * @param scene - Phaser scene
   */
  constructor(scene: Phaser.Scene) {
    // Create container
    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setVisible(false);

    // Create semi-transparent background
    this.background = scene.add.graphics();
    this.background.fillStyle(0x000000, 0.7);
    this.background.fillRect(0, 0, 300, 200);
    this.container.add(this.background);

    // Create info text
    this.infoText = scene.add.text(10, 10, '', this.textStyle);
    this.container.add(this.infoText);

    // Create player texts
    this.playerTexts = [
      scene.add.text(10, 50, '', this.textStyle),
      scene.add.text(10, 110, '', this.textStyle),
    ];
    this.container.add(this.playerTexts[0]);
    this.container.add(this.playerTexts[1]);

    // Create controls text (right side)
    const controlsBg = scene.add.graphics();
    controlsBg.fillStyle(0x000000, 0.7);
    controlsBg.fillRect(GAME_WIDTH - 250, 0, 250, 220);
    this.container.add(controlsBg);

    this.controlsText = scene.add.text(
      GAME_WIDTH - 240,
      10,
      this.getControlsHelp(),
      { ...this.textStyle, fontSize: '12px' }
    );
    this.container.add(this.controlsText);
  }

  /**
   * Get controls help text.
   */
  private getControlsHelp(): string {
    return [
      '=== CONTROLS ===',
      '',
      'P1 (Left):',
      '  Move: A/D | Jump: W',
      '  Attack: F/G | Special: H',
      '  Block: R | Char: Q/E',
      '',
      'P2 (Right):',
      '  Move: ←/→ | Jump: ↑',
      '  Attack: Num1/2 | Spec: Num3',
      '  Block: Num0 | Char: U/O',
      '',
      'Global:',
      '  Debug: F1 | BG: Z/C',
    ].join('\n');
  }

  /**
   * Update the overlay with new info.
   *
   * @param info - Debug information
   */
  public update(info: GameDebugInfo): void {
    if (!this.visible) return;

    // Update general info
    this.infoText.setText(
      `Tick: ${info.tick} | FPS: ${info.fps.toFixed(0)}`
    );

    // Update player info
    for (let i = 0; i < 2; i++) {
      const pInfo = info.players[i];
      if (!pInfo) continue;

      const playerLabel = i === 0 ? 'P1' : 'P2';
      const facingStr = pInfo.facing === FacingDirection.RIGHT ? '→' : '←';

      this.playerTexts[i]?.setText([
        `=== ${playerLabel} ===`,
        `Fighter: ${pInfo.fighterId}`,
        `Action: ${pInfo.action ?? 'none'}`,
        `Frame: ${pInfo.frameIndex}/${pInfo.totalFrames}`,
        `Pos: (${pInfo.x.toFixed(0)}, ${pInfo.y.toFixed(0)}) ${facingStr}`,
      ].join('\n'));
    }
  }

  /**
   * Toggle overlay visibility.
   */
  public toggle(): void {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
  }

  /**
   * Show the overlay.
   */
  public show(): void {
    this.visible = true;
    this.container.setVisible(true);
  }

  /**
   * Hide the overlay.
   */
  public hide(): void {
    this.visible = false;
    this.container.setVisible(false);
  }

  /**
   * Check if overlay is visible.
   */
  public isVisible(): boolean {
    return this.visible;
  }

  /**
   * Set overlay position.
   *
   * @param x - X position
   * @param y - Y position
   */
  public setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  /**
   * Destroy the overlay.
   */
  public destroy(): void {
    this.container.destroy();
  }
}
