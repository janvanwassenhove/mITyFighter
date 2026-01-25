/**
 * @fileoverview Simulation type definitions for deterministic game state
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/NETPLAY_ROADMAP.md - State serialization requirements
 * @see docs/ARCHITECTURE.md - Simulation layer types
 */

import type { FighterId } from '../assets/fighterRegistry';
import type { ActionId } from '../assets/AssetKeys';
import { FacingDirection, PlayerId } from '../config/constants';

import type { InputFrame } from './InputFrame';

// =============================================================================
// Player State
// =============================================================================

/**
 * Position in 2D space.
 * Using integers for determinism.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Velocity in 2D space.
 */
export interface Velocity {
  x: number;
  y: number;
}

/**
 * Complete state for a single player.
 * Must be serializable for netplay.
 */
export interface PlayerState {
  /** Player identifier */
  playerId: PlayerId;

  /** Current fighter being used */
  fighterId: FighterId;

  /** World position */
  position: Position;

  /** Current velocity */
  velocity: Velocity;

  /** Direction the player is facing */
  facing: FacingDirection;

  /** Current action/animation */
  currentAction: ActionId;

  /** Frame index within current action */
  actionFrame: number;

  /** Tick when current action started */
  actionStartTick: number;

  /** Health points (0-100) */
  health: number;

  /** Whether player is grounded */
  isGrounded: boolean;

  /** Whether player is in hitstun */
  isHitstun: boolean;

  /** Hitstun frames remaining */
  hitstunFrames: number;

  /** Whether player is blocking */
  isBlocking: boolean;
}

/**
 * Create initial player state.
 *
 * @param playerId - Player identifier
 * @param fighterId - Fighter to use
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @param facing - Initial facing direction
 * @returns Initial player state
 */
export function createInitialPlayerState(
  playerId: PlayerId,
  fighterId: FighterId,
  startX: number,
  startY: number,
  facing: FacingDirection
): PlayerState {
  return {
    playerId,
    fighterId,
    position: { x: startX, y: startY },
    velocity: { x: 0, y: 0 },
    facing,
    currentAction: 'idle',
    actionFrame: 0,
    actionStartTick: 0,
    health: 100,
    isGrounded: true,
    isHitstun: false,
    hitstunFrames: 0,
    isBlocking: false,
  };
}

// =============================================================================
// Game State
// =============================================================================

/**
 * Complete game simulation state.
 * Must be fully serializable for rollback netcode.
 */
export interface SimulationState {
  /** Current simulation tick */
  tick: number;

  /** Player states */
  players: [PlayerState, PlayerState];

  /** Round number */
  round: number;

  /** Round timer in ticks */
  roundTimer: number;

  /** Match state */
  matchState: MatchState;
}

/**
 * Match state enumeration.
 */
export const enum MatchState {
  /** Before round starts */
  PRE_ROUND = 0,
  /** Active gameplay */
  FIGHTING = 1,
  /** Round ended, showing result */
  ROUND_END = 2,
  /** Match ended */
  MATCH_END = 3,
}

/**
 * Create initial simulation state.
 *
 * @param p1Fighter - Fighter for player 1
 * @param p2Fighter - Fighter for player 2
 * @param p1Start - Starting position for player 1
 * @param p2Start - Starting position for player 2
 * @returns Initial simulation state
 */
export function createInitialSimulationState(
  p1Fighter: FighterId,
  p2Fighter: FighterId,
  p1Start: Position,
  p2Start: Position
): SimulationState {
  return {
    tick: 0,
    players: [
      createInitialPlayerState(
        PlayerId.P1,
        p1Fighter,
        p1Start.x,
        p1Start.y,
        FacingDirection.RIGHT
      ),
      createInitialPlayerState(
        PlayerId.P2,
        p2Fighter,
        p2Start.x,
        p2Start.y,
        FacingDirection.LEFT
      ),
    ],
    round: 1,
    roundTimer: 99 * 60, // 99 seconds at 60 ticks/sec
    matchState: MatchState.FIGHTING,
  };
}

// =============================================================================
// Simulation Interface (Seam for Netplay)
// =============================================================================

/**
 * Interface for the game simulation.
 * Designed for rollback netcode compatibility.
 */
export interface ISimulation {
  /**
   * Advance simulation by one tick.
   *
   * @param inputs - Input frames for [P1, P2]
   */
  step(inputs: [InputFrame, InputFrame]): void;

  /**
   * Get current simulation state.
   * State must be fully serializable.
   */
  getState(): SimulationState;

  /**
   * Set simulation state (for rollback).
   *
   * @param state - State to restore
   */
  setState(state: SimulationState): void;

  /**
   * Serialize state to bytes (for network transfer).
   */
  serialize(): Uint8Array;

  /**
   * Deserialize state from bytes.
   *
   * @param data - Serialized state
   */
  deserialize(data: Uint8Array): void;
}

// =============================================================================
// Frame Data (Future)
// =============================================================================

/**
 * Frame data for an attack move.
 * For competitive frame-perfect gameplay.
 */
export interface AttackFrameData {
  /** Frames of startup before hitbox active */
  startup: number;

  /** Frames hitbox is active */
  active: number;

  /** Frames of recovery after active */
  recovery: number;

  /** Frame advantage on hit */
  onHitAdvantage: number;

  /** Frame advantage on block */
  onBlockAdvantage: number;

  /** Base damage */
  damage: number;

  /** Hitstun inflicted in frames */
  hitstun: number;

  /** Blockstun inflicted in frames */
  blockstun: number;
}

/**
 * Hitbox definition.
 */
export interface Hitbox {
  /** Offset from character position */
  offsetX: number;
  offsetY: number;

  /** Hitbox dimensions */
  width: number;
  height: number;
}
