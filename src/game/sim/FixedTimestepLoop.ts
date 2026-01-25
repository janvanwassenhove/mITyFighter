/**
 * @fileoverview Fixed timestep loop for deterministic simulation
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/NETPLAY_ROADMAP.md - Why fixed timestep is critical
 * @see docs/ARCHITECTURE.md - Simulation vs render separation
 */

import { TICK_RATE, TICK_DURATION_MS } from '../config/constants';

import type { InputFrame } from './InputFrame';

// =============================================================================
// Types
// =============================================================================

/**
 * Callback for each fixed simulation tick.
 *
 * @param tick - Current tick number
 * @param inputs - Input frames for [P1, P2]
 */
export type TickCallback = (
  tick: number,
  inputs: [InputFrame, InputFrame]
) => void;

/**
 * Callback to retrieve current input frames.
 *
 * @returns Input frames for [P1, P2]
 */
export type InputProvider = () => [InputFrame, InputFrame];

// =============================================================================
// FixedTimestepLoop
// =============================================================================

/**
 * Fixed timestep simulation loop.
 *
 * Ensures consistent simulation regardless of frame rate.
 * Critical for deterministic netplay.
 *
 * @example
 * ```typescript
 * const loop = new FixedTimestepLoop();
 * loop.setTickCallback((tick, inputs) => {
 *   simulation.step(inputs);
 * });
 * loop.setInputProvider(() => inputManager.captureInputs());
 *
 * // In Phaser update:
 * loop.update(delta);
 * ```
 */
export class FixedTimestepLoop {
  /** Accumulated time in milliseconds */
  private accumulator = 0;

  /** Current tick number */
  private currentTick = 0;

  /** Callback for each simulation tick */
  private tickCallback: TickCallback | null = null;

  /** Provider for current inputs */
  private inputProvider: InputProvider | null = null;

  /** Whether simulation is paused */
  private paused = false;

  /** Maximum ticks per update (prevents spiral of death) */
  private readonly maxTicksPerUpdate = 5;

  /**
   * Create a new fixed timestep loop.
   */
  constructor() {
    this.reset();
  }

  /**
   * Reset the loop to initial state.
   */
  public reset(): void {
    this.accumulator = 0;
    this.currentTick = 0;
    this.paused = false;
  }

  /**
   * Set the callback invoked for each simulation tick.
   *
   * @param callback - Tick callback function
   */
  public setTickCallback(callback: TickCallback): void {
    this.tickCallback = callback;
  }

  /**
   * Set the input provider function.
   *
   * @param provider - Function that returns current inputs
   */
  public setInputProvider(provider: InputProvider): void {
    this.inputProvider = provider;
  }

  /**
   * Update the simulation loop.
   * Call this from Phaser's update method.
   *
   * @param deltaMs - Time elapsed since last update in milliseconds
   * @returns Number of ticks executed
   */
  public update(deltaMs: number): number {
    if (this.paused) {
      return 0;
    }

    this.accumulator += deltaMs;

    let ticksExecuted = 0;

    // Process accumulated time in fixed steps
    while (
      this.accumulator >= TICK_DURATION_MS &&
      ticksExecuted < this.maxTicksPerUpdate
    ) {
      this.executeTick();
      this.accumulator -= TICK_DURATION_MS;
      ticksExecuted++;
    }

    // Cap accumulator to prevent spiral of death
    if (this.accumulator > TICK_DURATION_MS * this.maxTicksPerUpdate) {
      this.accumulator = TICK_DURATION_MS * this.maxTicksPerUpdate;
    }

    return ticksExecuted;
  }

  /**
   * Execute a single simulation tick.
   */
  private executeTick(): void {
    const inputs = this.inputProvider?.() ?? [0, 0];
    this.tickCallback?.(this.currentTick, inputs as [InputFrame, InputFrame]);
    this.currentTick++;
  }

  /**
   * Get the current tick number.
   */
  public getCurrentTick(): number {
    return this.currentTick;
  }

  /**
   * Get the interpolation alpha for rendering.
   * Value between 0 and 1 representing progress to next tick.
   */
  public getAlpha(): number {
    return this.accumulator / TICK_DURATION_MS;
  }

  /**
   * Pause the simulation.
   */
  public pause(): void {
    this.paused = true;
  }

  /**
   * Resume the simulation.
   */
  public resume(): void {
    this.paused = false;
  }

  /**
   * Check if simulation is paused.
   */
  public isPaused(): boolean {
    return this.paused;
  }

  /**
   * Get the tick rate (ticks per second).
   */
  public getTickRate(): number {
    return TICK_RATE;
  }

  /**
   * Get the tick duration in milliseconds.
   */
  public getTickDuration(): number {
    return TICK_DURATION_MS;
  }

  /**
   * Force set the current tick (for rollback).
   *
   * @param tick - Tick number to set
   */
  public setTick(tick: number): void {
    this.currentTick = tick;
  }
}
