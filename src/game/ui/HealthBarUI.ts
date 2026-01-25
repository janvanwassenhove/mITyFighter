/**
 * @fileoverview MK-style health bars UI
 * @description Dual health bars at top of screen with round indicators
 */

import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';

// =============================================================================
// Constants
// =============================================================================

const BAR_WIDTH = 450;
const BAR_HEIGHT = 30;
const BAR_Y = 40;
const BAR_PADDING = 4;
const ROUND_INDICATOR_SIZE = 20;
const ROUND_INDICATOR_GAP = 8;

// =============================================================================
// HealthBarUI
// =============================================================================

/**
 * MK-style dual health bars with round indicators.
 */
export class HealthBarUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  // Health bar backgrounds
  private p1BarBg!: Phaser.GameObjects.Graphics;
  private p2BarBg!: Phaser.GameObjects.Graphics;

  // Health bar fills
  private p1BarFill!: Phaser.GameObjects.Graphics;
  private p2BarFill!: Phaser.GameObjects.Graphics;

  // Health values (for animation)
  private p1Health = 100;
  private p2Health = 100;
  private p1TargetHealth = 100;
  private p2TargetHealth = 100;

  // Player names
  private p1Name!: Phaser.GameObjects.Text;
  private p2Name!: Phaser.GameObjects.Text;

  // Round indicators
  private p1RoundIndicators: Phaser.GameObjects.Arc[] = [];
  private p2RoundIndicators: Phaser.GameObjects.Arc[] = [];

  // Timer
  private timerText!: Phaser.GameObjects.Text;
  private timerBg!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    this.createBars();
    this.createNames();
    this.createRoundIndicators(2); // Best of 3 = need 2 to win
    this.createTimer();
  }

  /** Create the health bar graphics */
  private createBars(): void {
    const centerX = GAME_WIDTH / 2;
    const p1X = centerX - 60 - BAR_WIDTH;
    const p2X = centerX + 60;

    // Backgrounds (dark)
    this.p1BarBg = this.scene.add.graphics();
    this.p1BarBg.fillStyle(0x333333, 1);
    this.p1BarBg.fillRect(p1X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);
    this.p1BarBg.lineStyle(2, 0xffffff, 1);
    this.p1BarBg.strokeRect(p1X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);
    this.container.add(this.p1BarBg);

    this.p2BarBg = this.scene.add.graphics();
    this.p2BarBg.fillStyle(0x333333, 1);
    this.p2BarBg.fillRect(p2X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);
    this.p2BarBg.lineStyle(2, 0xffffff, 1);
    this.p2BarBg.strokeRect(p2X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);
    this.container.add(this.p2BarBg);

    // Fills (colored)
    this.p1BarFill = this.scene.add.graphics();
    this.container.add(this.p1BarFill);

    this.p2BarFill = this.scene.add.graphics();
    this.container.add(this.p2BarFill);

    this.drawHealthBars();
  }

  /** Create player name labels */
  private createNames(): void {
    const centerX = GAME_WIDTH / 2;

    this.p1Name = this.scene.add.text(
      centerX - 60 - BAR_WIDTH,
      BAR_Y - 25,
      'PLAYER 1',
      {
        fontFamily: 'Impact, sans-serif',
        fontSize: '20px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3,
      }
    );
    this.container.add(this.p1Name);

    this.p2Name = this.scene.add.text(centerX + 60, BAR_Y - 25, 'PLAYER 2', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.container.add(this.p2Name);
  }

  /** Create round win indicators */
  private createRoundIndicators(roundsToWin: number): void {
    const centerX = GAME_WIDTH / 2;
    const y = BAR_Y + BAR_HEIGHT + 10;

    // Clear existing
    this.p1RoundIndicators.forEach((i) => i.destroy());
    this.p2RoundIndicators.forEach((i) => i.destroy());
    this.p1RoundIndicators = [];
    this.p2RoundIndicators = [];

    // P1 indicators (right side of P1 bar)
    for (let i = 0; i < roundsToWin; i++) {
      const x =
        centerX -
        60 -
        (roundsToWin - i) * (ROUND_INDICATOR_SIZE + ROUND_INDICATOR_GAP);
      const indicator = this.scene.add.circle(
        x,
        y,
        ROUND_INDICATOR_SIZE / 2,
        0x333333
      );
      indicator.setStrokeStyle(2, 0xffffff);
      this.container.add(indicator);
      this.p1RoundIndicators.push(indicator);
    }

    // P2 indicators (left side of P2 bar)
    for (let i = 0; i < roundsToWin; i++) {
      const x =
        centerX + 60 + (i + 1) * (ROUND_INDICATOR_SIZE + ROUND_INDICATOR_GAP);
      const indicator = this.scene.add.circle(
        x,
        y,
        ROUND_INDICATOR_SIZE / 2,
        0x333333
      );
      indicator.setStrokeStyle(2, 0xffffff);
      this.container.add(indicator);
      this.p2RoundIndicators.push(indicator);
    }
  }

  /** Create timer display */
  private createTimer(): void {
    const centerX = GAME_WIDTH / 2;

    // Timer background
    this.timerBg = this.scene.add.graphics();
    this.timerBg.fillStyle(0x000000, 0.8);
    this.timerBg.fillRoundedRect(centerX - 40, BAR_Y - 10, 80, 60, 8);
    this.timerBg.lineStyle(3, 0xffcc00, 1);
    this.timerBg.strokeRoundedRect(centerX - 40, BAR_Y - 10, 80, 60, 8);
    this.container.add(this.timerBg);

    // Timer text
    this.timerText = this.scene.add.text(centerX, BAR_Y + 20, '99', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '42px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.timerText.setOrigin(0.5);
    this.container.add(this.timerText);
  }

  /** Draw health bars based on current values */
  private drawHealthBars(): void {
    const centerX = GAME_WIDTH / 2;
    const p1X = centerX - 60 - BAR_WIDTH;
    const p2X = centerX + 60;
    const innerPadding = BAR_PADDING;
    const innerWidth = BAR_WIDTH - innerPadding * 2;
    const innerHeight = BAR_HEIGHT - innerPadding * 2;

    // P1 bar (fills from right to left)
    this.p1BarFill.clear();
    const p1Width = (this.p1Health / 100) * innerWidth;
    const p1Color = this.getHealthColor(this.p1Health);
    this.p1BarFill.fillStyle(p1Color, 1);
    // Fill from right side
    this.p1BarFill.fillRect(
      p1X + innerPadding + (innerWidth - p1Width),
      BAR_Y + innerPadding,
      p1Width,
      innerHeight
    );

    // P2 bar (fills from left to right)
    this.p2BarFill.clear();
    const p2Width = (this.p2Health / 100) * innerWidth;
    const p2Color = this.getHealthColor(this.p2Health);
    this.p2BarFill.fillStyle(p2Color, 1);
    this.p2BarFill.fillRect(
      p2X + innerPadding,
      BAR_Y + innerPadding,
      p2Width,
      innerHeight
    );
  }

  /** Get health bar color based on health percentage */
  private getHealthColor(health: number): number {
    if (health > 50) return 0x00ff00; // Green
    if (health > 25) return 0xffff00; // Yellow
    return 0xff0000; // Red
  }

  /** Update health display */
  public setHealth(p1: number, p2: number): void {
    this.p1TargetHealth = Math.max(0, Math.min(100, p1));
    this.p2TargetHealth = Math.max(0, Math.min(100, p2));
  }

  /** Animate health bars (call in update) */
  public update(): void {
    // Smoothly animate health bars
    const speed = 2;
    if (this.p1Health !== this.p1TargetHealth) {
      if (this.p1Health > this.p1TargetHealth) {
        this.p1Health = Math.max(this.p1TargetHealth, this.p1Health - speed);
      } else {
        this.p1Health = Math.min(this.p1TargetHealth, this.p1Health + speed);
      }
      this.drawHealthBars();
    }
    if (this.p2Health !== this.p2TargetHealth) {
      if (this.p2Health > this.p2TargetHealth) {
        this.p2Health = Math.max(this.p2TargetHealth, this.p2Health - speed);
      } else {
        this.p2Health = Math.min(this.p2TargetHealth, this.p2Health + speed);
      }
      this.drawHealthBars();
    }
  }

  /** Set player names */
  public setNames(p1Name: string, p2Name: string): void {
    this.p1Name.setText(p1Name.toUpperCase());
    this.p2Name.setText(p2Name.toUpperCase());
  }

  /** Set timer value */
  public setTimer(seconds: number): void {
    this.timerText.setText(Math.max(0, Math.floor(seconds)).toString());
  }

  /** Update round indicators */
  public setRoundWins(p1Wins: number, p2Wins: number): void {
    this.p1RoundIndicators.forEach((indicator, i) => {
      indicator.setFillStyle(i < p1Wins ? 0xffcc00 : 0x333333);
    });
    this.p2RoundIndicators.forEach((indicator, i) => {
      indicator.setFillStyle(i < p2Wins ? 0xffcc00 : 0x333333);
    });
  }

  /** Instantly set health (no animation) */
  public setHealthInstant(p1: number, p2: number): void {
    this.p1Health = this.p1TargetHealth = Math.max(0, Math.min(100, p1));
    this.p2Health = this.p2TargetHealth = Math.max(0, Math.min(100, p2));
    this.drawHealthBars();
  }

  /** Show/hide the UI */
  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /** Destroy the UI */
  public destroy(): void {
    this.container.destroy();
  }
}
