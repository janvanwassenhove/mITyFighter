/**
 * @fileoverview Fighter state machine for combat
 * @description Handles fighter states, transitions, and physics
 */

/* eslint-disable no-unused-vars */

// =============================================================================
// Fighter States
// =============================================================================

/** Fighter action states */
export enum FighterState {
  /** Standing idle */
  IDLE = 'idle',
  /** Walking forward/backward */
  WALK = 'walk',
  /** Running */
  RUN = 'run',
  /** Jumping */
  JUMP = 'jump',
  /** Crouching/blocking low */
  CROUCH = 'crouch',
  /** Standing block */
  BLOCK = 'block',
  /** Light attack */
  ATTACK1 = 'attack1',
  /** Heavy attack */
  ATTACK2 = 'attack2',
  /** Special move */
  SPECIAL = 'special',
  /** Taking damage */
  HURT = 'hurt',
  /** Knocked down / defeated */
  DEAD = 'dead',
  /** Dashing forward */
  DASH = 'dash',
  /** Uppercut attack */
  UPPERCUT = 'uppercut',
  /** Slide/sweep attack */
  SLIDE = 'slide',
}

/** States where fighter can be interrupted */
export const INTERRUPTIBLE_STATES: FighterState[] = [
  FighterState.IDLE,
  FighterState.WALK,
  FighterState.RUN,
  FighterState.CROUCH,
  FighterState.BLOCK,
];

/** States where fighter is attacking */
export const ATTACK_STATES: FighterState[] = [
  FighterState.ATTACK1,
  FighterState.ATTACK2,
  FighterState.SPECIAL,
  FighterState.UPPERCUT,
  FighterState.SLIDE,
];

/** States where fighter is vulnerable (can be hit) */
export const VULNERABLE_STATES: FighterState[] = [
  FighterState.IDLE,
  FighterState.WALK,
  FighterState.RUN,
  FighterState.JUMP,
  FighterState.CROUCH,
  FighterState.ATTACK1,
  FighterState.ATTACK2,
  FighterState.SPECIAL,
  FighterState.DASH,
  FighterState.UPPERCUT,
  FighterState.SLIDE,
];

/** States where fighter can move */
export const MOBILE_STATES: FighterState[] = [
  FighterState.IDLE,
  FighterState.WALK,
  FighterState.RUN,
  FighterState.JUMP,
  FighterState.DASH,
];

// =============================================================================
// Fighter Physics
// =============================================================================

/** Fighter physics constants */
export const FIGHTER_PHYSICS = {
  /** Walking speed (pixels per tick) */
  WALK_SPEED: 6,
  /** Running speed (pixels per tick) */
  RUN_SPEED: 10,
  /** Jump initial velocity */
  JUMP_VELOCITY: -24,
  /** Gravity (pixels per tick squared) */
  GRAVITY: 0.85,
  /** Push back when hit */
  HIT_PUSHBACK: 10,
  /** Push back when blocked */
  BLOCK_PUSHBACK: 5,
  /** Minimum distance between fighters (bigger sprites need more space) */
  MIN_DISTANCE: 120,
  /** Stage left boundary */
  STAGE_LEFT: 150,
  /** Stage right boundary */
  STAGE_RIGHT: 1130,
  /** Ground Y position (lower for bigger sprites) */
  GROUND_Y: 680,
} as const;

// =============================================================================
// Attack Data
// =============================================================================

/** Attack definition */
export interface AttackData {
  /** Damage dealt */
  damage: number;
  /** Hitstun frames */
  hitstun: number;
  /** Blockstun frames */
  blockstun: number;
  /** Startup frames before hitbox active */
  startup: number;
  /** Active frames (hitbox out) */
  active: number;
  /** Recovery frames after attack */
  recovery: number;
  /** Pushback on hit */
  pushback: number;
  /** Can be blocked standing */
  blockableHigh: boolean;
  /** Can be blocked crouching */
  blockableLow: boolean;
}

/** Default attack data per attack type */
export const ATTACK_DATA: Record<string, AttackData> = {
  attack1: {
    damage: 8,
    hitstun: 12,
    blockstun: 6,
    startup: 4,
    active: 3,
    recovery: 8,
    pushback: FIGHTER_PHYSICS.HIT_PUSHBACK,
    blockableHigh: true,
    blockableLow: true,
  },
  attack2: {
    damage: 15,
    hitstun: 18,
    blockstun: 10,
    startup: 8,
    active: 4,
    recovery: 14,
    pushback: FIGHTER_PHYSICS.HIT_PUSHBACK * 1.5,
    blockableHigh: true,
    blockableLow: true,
  },
  special: {
    damage: 20,
    hitstun: 24,
    blockstun: 14,
    startup: 12,
    active: 6,
    recovery: 20,
    pushback: FIGHTER_PHYSICS.HIT_PUSHBACK * 2,
    blockableHigh: true,
    blockableLow: false,
  },
  uppercut: {
    damage: 18,
    hitstun: 20,
    blockstun: 12,
    startup: 3,
    active: 8,
    recovery: 12,
    pushback: FIGHTER_PHYSICS.HIT_PUSHBACK * 1.5,
    blockableHigh: true,
    blockableLow: false,
  },
  slide: {
    damage: 12,
    hitstun: 14,
    blockstun: 8,
    startup: 2,
    active: 6,
    recovery: 10,
    pushback: FIGHTER_PHYSICS.HIT_PUSHBACK,
    blockableHigh: false,
    blockableLow: true,
  },
  dash_attack: {
    damage: 10,
    hitstun: 12,
    blockstun: 6,
    startup: 4,
    active: 4,
    recovery: 8,
    pushback: FIGHTER_PHYSICS.HIT_PUSHBACK * 1.2,
    blockableHigh: true,
    blockableLow: true,
  },
};

// =============================================================================
// Fighter Runtime State
// =============================================================================

/** Runtime state for a single fighter */
export interface FighterRuntimeState {
  /** Current state */
  state: FighterState;
  /** Position X */
  x: number;
  /** Position Y */
  y: number;
  /** Velocity X */
  vx: number;
  /** Velocity Y */
  vy: number;
  /** Facing direction (1 = right, -1 = left) */
  facing: 1 | -1;
  /** Current animation frame */
  animFrame: number;
  /** Frames in current state */
  stateFrames: number;
  /** Stun frames remaining */
  stunFrames: number;
  /** Is on ground */
  grounded: boolean;
  /** Current attack data (if attacking) */
  currentAttack: AttackData | null;
  /** Has current attack hit */
  attackHit: boolean;
}

/** Create initial fighter state */
export function createFighterState(
  x: number,
  facing: 1 | -1
): FighterRuntimeState {
  return {
    state: FighterState.IDLE,
    x,
    y: FIGHTER_PHYSICS.GROUND_Y,
    vx: 0,
    vy: 0,
    facing,
    animFrame: 0,
    stateFrames: 0,
    stunFrames: 0,
    grounded: true,
    currentAttack: null,
    attackHit: false,
  };
}

/** Check if fighter can perform action */
export function canAct(fighter: FighterRuntimeState): boolean {
  return (
    fighter.stunFrames <= 0 &&
    INTERRUPTIBLE_STATES.includes(fighter.state)
  );
}

/** Check if fighter is attacking */
export function isAttacking(fighter: FighterRuntimeState): boolean {
  return ATTACK_STATES.includes(fighter.state);
}

/** Check if fighter can be hit */
export function isVulnerable(fighter: FighterRuntimeState): boolean {
  return VULNERABLE_STATES.includes(fighter.state);
}

/** Check if fighter is blocking */
export function isBlocking(fighter: FighterRuntimeState): boolean {
  return fighter.state === FighterState.BLOCK;
}

/** Map fighter state to animation action ID */
export function stateToActionId(state: FighterState): string {
  switch (state) {
    case FighterState.IDLE:
      return 'idle';
    case FighterState.WALK:
      return 'walk';
    case FighterState.RUN:
    case FighterState.DASH:
      return 'run';
    case FighterState.JUMP:
    case FighterState.UPPERCUT:
      return 'jump';
    case FighterState.CROUCH:
    case FighterState.SLIDE:
      return 'idle'; // Use idle or a crouch anim if available
    case FighterState.BLOCK:
      return 'idle'; // Use idle or block anim
    case FighterState.ATTACK1:
      return 'attack1';
    case FighterState.ATTACK2:
      return 'attack2';
    case FighterState.SPECIAL:
      return 'special';
    case FighterState.HURT:
      return 'hurt';
    case FighterState.DEAD:
      return 'dead';
    default:
      return 'idle';
  }
}
