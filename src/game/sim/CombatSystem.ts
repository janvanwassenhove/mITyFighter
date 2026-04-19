/**
 * @fileoverview Combat simulation system
 * @description Handles fighter updates, collision, and damage
 */

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */

import { ComboInputDetector, COMBO_MOVE_DATA, type ComboMove } from './ComboInput';
import {
  FighterState,
  type FighterRuntimeState,
  FIGHTER_PHYSICS,
  ATTACK_DATA,
  canAct,
  isAttacking,
  isVulnerable,
  isBlocking,
} from './FighterState';
import { INPUT_FLAGS, hasFlag, type InputFrame } from './InputFrame';

// =============================================================================
// Hitbox System
// =============================================================================

/** Hitbox rectangle */
export interface HitBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Get fighter's hurtbox (vulnerable area) */
export function getHurtbox(fighter: FighterRuntimeState): HitBox {
  // Approximate hurtbox based on fighter position
  const width = 60;
  const height = fighter.state === FighterState.CROUCH ? 80 : 120;
  return {
    x: fighter.x - width / 2,
    y: fighter.y - height,
    width,
    height,
  };
}

/** Get fighter's hitbox (attack area) when attacking */
export function getHitbox(fighter: FighterRuntimeState): HitBox | null {
  if (!isAttacking(fighter) || !fighter.currentAttack) {
    return null;
  }

  // Only active during active frames
  const attack = fighter.currentAttack;
  if (
    fighter.stateFrames < attack.startup ||
    fighter.stateFrames >= attack.startup + attack.active
  ) {
    return null;
  }

  // Hitbox extends in facing direction
  const width = 70;
  const height = 60;
  const offsetX = fighter.facing * 50;

  return {
    x: fighter.x + offsetX - (fighter.facing === 1 ? 0 : width),
    y: fighter.y - 100,
    width,
    height,
  };
}

/** Check if two boxes overlap */
export function boxesOverlap(a: HitBox, b: HitBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// =============================================================================
// Combo Input System
// =============================================================================

/** Combo detectors for P1 and P2 */
const p1ComboDetector = new ComboInputDetector();
const p2ComboDetector = new ComboInputDetector();

/** Get the combo detector for a player */
export function getComboDetector(playerIndex: 0 | 1): ComboInputDetector {
  return playerIndex === 0 ? p1ComboDetector : p2ComboDetector;
}

/** Reset combo detectors (e.g., at round start) */
export function resetComboDetectors(): void {
  p1ComboDetector.reset();
  p2ComboDetector.reset();
}

// =============================================================================
// Fighter Update
// =============================================================================

/** Update a single fighter based on input */
export function updateFighter(
  fighter: FighterRuntimeState,
  input: InputFrame,
  opponent: FighterRuntimeState,
  playerIndex: 0 | 1 = 0
): void {
  // Get combo detector and update facing
  const comboDetector = getComboDetector(playerIndex);
  comboDetector.setFacing(fighter.facing);
  
  // Process input for combos
  const comboResult = comboDetector.processInput(input);
  
  // Decrement stun
  if (fighter.stunFrames > 0) {
    fighter.stunFrames--;
  }

  // Increment state frames
  fighter.stateFrames++;

  // Apply gravity
  if (!fighter.grounded) {
    fighter.vy += FIGHTER_PHYSICS.GRAVITY;
    fighter.y += fighter.vy;

    // Land
    if (fighter.y >= FIGHTER_PHYSICS.GROUND_Y) {
      fighter.y = FIGHTER_PHYSICS.GROUND_Y;
      fighter.vy = 0;
      fighter.grounded = true;
      if (fighter.state === FighterState.JUMP) {
        changeState(fighter, FighterState.IDLE);
      }
    }
  }

  // Apply velocity
  fighter.x += fighter.vx;

  // Clamp to stage bounds
  fighter.x = Math.max(
    FIGHTER_PHYSICS.STAGE_LEFT,
    Math.min(FIGHTER_PHYSICS.STAGE_RIGHT, fighter.x)
  );

  // Maintain minimum distance from opponent
  const dx = fighter.x - opponent.x;
  const dist = Math.abs(dx);
  if (dist < FIGHTER_PHYSICS.MIN_DISTANCE) {
    const push = (FIGHTER_PHYSICS.MIN_DISTANCE - dist) / 2;
    if (dx > 0) {
      fighter.x += push;
      opponent.x -= push;
    } else {
      fighter.x -= push;
      opponent.x += push;
    }
  }

  // Face opponent
  if (canAct(fighter)) {
    fighter.facing = fighter.x < opponent.x ? 1 : -1;
  }

  // Handle states
  switch (fighter.state) {
    case FighterState.IDLE:
    case FighterState.WALK:
    case FighterState.RUN:
      handleMovementState(fighter, input, comboResult.move);
      break;

    case FighterState.JUMP:
      handleJumpState(fighter, input, comboResult.move);
      break;

    case FighterState.ATTACK1:
    case FighterState.ATTACK2:
    case FighterState.SPECIAL:
    case FighterState.UPPERCUT:
    case FighterState.SLIDE:
      handleAttackState(fighter);
      break;

    case FighterState.DASH:
      handleDashState(fighter, input);
      break;

    case FighterState.HURT:
      handleHurtState(fighter);
      break;

    case FighterState.DEAD:
      // Stay dead
      fighter.vx = 0;
      break;

    case FighterState.WIN:
      // Stay in win pose
      fighter.vx = 0;
      break;

    case FighterState.INTRO:
      // Play intro, transition to idle when done
      handleIntroState(fighter);
      break;

    case FighterState.BLOCK:
      handleBlockState(fighter, input);
      break;

    case FighterState.CROUCH:
      handleCrouchState(fighter, input, comboResult.move);
      break;
  }

  // Decay horizontal velocity (ground has stronger friction than air)
  const isDash = fighter.state === FighterState.DASH;
  const isAirborne = !fighter.grounded;
  const decayRate = isDash ? 0.95 : isAirborne ? 0.98 : 0.8;
  fighter.vx *= decayRate;
  if (Math.abs(fighter.vx) < 0.1) fighter.vx = 0;
}

/** Handle movement states (idle, walk, run) */
function handleMovementState(
  fighter: FighterRuntimeState,
  input: InputFrame,
  comboMove: ComboMove
): void {
  if (fighter.stunFrames > 0) return;

  const left = hasFlag(input, INPUT_FLAGS.LEFT);
  const right = hasFlag(input, INPUT_FLAGS.RIGHT);
  const up = hasFlag(input, INPUT_FLAGS.UP);
  const down = hasFlag(input, INPUT_FLAGS.DOWN);
  const attack1 = hasFlag(input, INPUT_FLAGS.ATTACK1);
  const attack2 = hasFlag(input, INPUT_FLAGS.ATTACK2);
  const special = hasFlag(input, INPUT_FLAGS.SPECIAL);
  const block = hasFlag(input, INPUT_FLAGS.BLOCK);

  // Check for combo moves first (dash, uppercut, etc.)
  if (comboMove && fighter.grounded) {
    const moveData = COMBO_MOVE_DATA[comboMove];
    
    switch (comboMove) {
      case 'dash_forward':
      case 'dash_backward':
        changeState(fighter, FighterState.DASH);
        fighter.vx = moveData.velocityX * fighter.facing;
        if (comboMove === 'dash_backward') {
          fighter.vx = -Math.abs(moveData.velocityX) * fighter.facing;
          fighter.vy = moveData.velocityY; // Small hop for backdash
          fighter.grounded = moveData.velocityY < 0 ? false : true;
        }
        return;
        
      case 'uppercut':
        startAttack(fighter, FighterState.UPPERCUT, 'uppercut');
        fighter.vy = moveData.velocityY;
        fighter.grounded = false;
        return;
        
      case 'spin_kick':
        startAttack(fighter, FighterState.SPECIAL, 'special');
        fighter.vx = moveData.velocityX * fighter.facing;
        return;
        
      case 'fireball_forward':
      case 'fireball_backward':
        startAttack(fighter, FighterState.SPECIAL, 'special');
        fighter.vx = moveData.velocityX * fighter.facing;
        return;
        
      case 'character_special':
        startAttack(fighter, FighterState.SPECIAL, 'special');
        fighter.vx = moveData.velocityX * fighter.facing;
        return;
    }
  }

  // Check for attacks
  if (attack1) {
    startAttack(fighter, FighterState.ATTACK1, 'attack1');
    return;
  }
  if (attack2) {
    startAttack(fighter, FighterState.ATTACK2, 'attack2');
    return;
  }
  if (special) {
    startAttack(fighter, FighterState.SPECIAL, 'special');
    return;
  }

  // Check for jump combos
  if (up && fighter.grounded) {
    changeState(fighter, FighterState.JUMP);
    fighter.grounded = false;
    
    // Diagonal jumps
    if (comboMove === 'jump_forward') {
      const moveData = COMBO_MOVE_DATA.jump_forward;
      fighter.vy = moveData.velocityY;
      fighter.vx = moveData.velocityX * fighter.facing;
    } else if (comboMove === 'jump_backward') {
      const moveData = COMBO_MOVE_DATA.jump_backward;
      fighter.vy = moveData.velocityY;
      fighter.vx = moveData.velocityX * fighter.facing;
    } else {
      // Straight up jump
      fighter.vy = FIGHTER_PHYSICS.JUMP_VELOCITY;
      if (left) fighter.vx = -FIGHTER_PHYSICS.WALK_SPEED;
      else if (right) fighter.vx = FIGHTER_PHYSICS.WALK_SPEED;
    }
    return;
  }

  // Check for crouch/slide combos
  if (down) {
    if (comboMove === 'crouch_forward') {
      // Slide attack
      startAttack(fighter, FighterState.SLIDE, 'slide');
      fighter.vx = COMBO_MOVE_DATA.crouch_forward.velocityX * fighter.facing;
      return;
    }
    changeState(fighter, FighterState.CROUCH);
    fighter.vx = 0;
    return;
  }

  // Check for block
  if (block) {
    changeState(fighter, FighterState.BLOCK);
    fighter.vx = 0;
    return;
  }

  // Movement
  if (left || right) {
    const moveDir = left ? -1 : 1;
    const isBackward = moveDir !== fighter.facing;

    if (isBackward) {
      // Walk backward
      changeState(fighter, FighterState.WALK);
      fighter.vx = moveDir * FIGHTER_PHYSICS.WALK_SPEED * 0.7;
    } else {
      // Walk forward
      changeState(fighter, FighterState.WALK);
      fighter.vx = moveDir * FIGHTER_PHYSICS.WALK_SPEED;
    }
  } else {
    // Return to idle
    changeState(fighter, FighterState.IDLE);
    fighter.vx = 0;
  }
}

/** Handle jump state */
function handleJumpState(
  fighter: FighterRuntimeState,
  input: InputFrame,
  _comboMove: ComboMove
): void {
  // Can attack in air
  const attack1 = hasFlag(input, INPUT_FLAGS.ATTACK1);
  const attack2 = hasFlag(input, INPUT_FLAGS.ATTACK2);

  if (attack1 && !isAttacking(fighter)) {
    startAttack(fighter, FighterState.ATTACK1, 'attack1');
  } else if (attack2 && !isAttacking(fighter)) {
    startAttack(fighter, FighterState.ATTACK2, 'attack2');
  }

  // Air control
  const left = hasFlag(input, INPUT_FLAGS.LEFT);
  const right = hasFlag(input, INPUT_FLAGS.RIGHT);
  if (left) fighter.vx -= 0.3;
  if (right) fighter.vx += 0.3;
  fighter.vx = Math.max(-FIGHTER_PHYSICS.RUN_SPEED, Math.min(FIGHTER_PHYSICS.RUN_SPEED, fighter.vx));
}

/** Handle dash state */
function handleDashState(
  fighter: FighterRuntimeState,
  input: InputFrame
): void {
  const attack1 = hasFlag(input, INPUT_FLAGS.ATTACK1);
  const attack2 = hasFlag(input, INPUT_FLAGS.ATTACK2);
  
  // Can cancel dash into attack
  if (attack1) {
    startAttack(fighter, FighterState.ATTACK1, 'dash_attack');
    return;
  }
  if (attack2) {
    startAttack(fighter, FighterState.ATTACK2, 'attack2');
    return;
  }
  
  // Dash duration (8 frames)
  if (fighter.stateFrames >= 8) {
    changeState(fighter, FighterState.IDLE);
  }
}

/** Handle attack state */
function handleAttackState(fighter: FighterRuntimeState): void {
  if (!fighter.currentAttack) {
    changeState(fighter, FighterState.IDLE);
    return;
  }

  const totalFrames =
    fighter.currentAttack.startup +
    fighter.currentAttack.active +
    fighter.currentAttack.recovery;

  if (fighter.stateFrames >= totalFrames) {
    changeState(fighter, FighterState.IDLE);
    fighter.currentAttack = null;
    fighter.attackHit = false;
  }
}

/** Handle hurt state */
function handleHurtState(fighter: FighterRuntimeState): void {
  if (fighter.stunFrames <= 0) {
    changeState(fighter, FighterState.IDLE);
  }
}

/** Handle intro state - plays once then transitions to idle */
function handleIntroState(fighter: FighterRuntimeState): void {
  fighter.vx = 0;
  // Intro lasts ~60 frames (1 second at 60 ticks)
  if (fighter.stateFrames >= 60) {
    changeState(fighter, FighterState.IDLE);
  }
}

/** Handle block state */
function handleBlockState(
  fighter: FighterRuntimeState,
  input: InputFrame
): void {
  const block = hasFlag(input, INPUT_FLAGS.BLOCK);
  if (!block && fighter.stunFrames <= 0) {
    changeState(fighter, FighterState.IDLE);
  }
}

/** Handle crouch state */
function handleCrouchState(
  fighter: FighterRuntimeState,
  input: InputFrame,
  comboMove: ComboMove
): void {
  const down = hasFlag(input, INPUT_FLAGS.DOWN);
  const attack1 = hasFlag(input, INPUT_FLAGS.ATTACK1);
  const attack2 = hasFlag(input, INPUT_FLAGS.ATTACK2);

  // Crouch forward slide
  if (comboMove === 'crouch_forward') {
    startAttack(fighter, FighterState.SLIDE, 'slide');
    fighter.vx = COMBO_MOVE_DATA.crouch_forward.velocityX * fighter.facing;
    return;
  }
  
  // Crouch backward retreat
  if (comboMove === 'crouch_backward') {
    fighter.vx = COMBO_MOVE_DATA.crouch_backward.velocityX * fighter.facing;
  }

  if (attack1) {
    startAttack(fighter, FighterState.ATTACK1, 'attack1');
    return;
  }
  if (attack2) {
    startAttack(fighter, FighterState.ATTACK2, 'attack2');
    return;
  }

  if (!down && fighter.stunFrames <= 0) {
    changeState(fighter, FighterState.IDLE);
  }
}

/** Start an attack */
function startAttack(
  fighter: FighterRuntimeState,
  state: FighterState,
  attackId: string
): void {
  changeState(fighter, state);
  const attackData = ATTACK_DATA[attackId];
  fighter.currentAttack = attackData ?? ATTACK_DATA['attack1'] ?? null;
  fighter.attackHit = false;
  fighter.vx = fighter.facing * 2; // Slight forward movement
}

/** Change fighter state */
function changeState(fighter: FighterRuntimeState, newState: FighterState): void {
  if (fighter.state !== newState) {
    fighter.state = newState;
    fighter.stateFrames = 0;
    fighter.animFrame = 0;
  }
}

// =============================================================================
// Combat Resolution
// =============================================================================

/** Result of combat check */
export interface CombatResult {
  /** Damage dealt to player 0 */
  damageToP1: number;
  /** Damage dealt to player 1 */
  damageToP2: number;
  /** Was P1's attack blocked */
  p1Blocked: boolean;
  /** Was P2's attack blocked */
  p2Blocked: boolean;
}

/** Check and resolve combat between two fighters */
export function resolveCombat(
  p1: FighterRuntimeState,
  p2: FighterRuntimeState
): CombatResult {
  const result: CombatResult = {
    damageToP1: 0,
    damageToP2: 0,
    p1Blocked: false,
    p2Blocked: false,
  };

  // Check P1 hitting P2
  const p1Hitbox = getHitbox(p1);
  const p2Hurtbox = getHurtbox(p2);

  if (p1Hitbox && !p1.attackHit && boxesOverlap(p1Hitbox, p2Hurtbox)) {
    p1.attackHit = true;
    const attack = p1.currentAttack!;

    if (isBlocking(p2)) {
      // Blocked
      result.p1Blocked = true;
      p2.stunFrames = attack.blockstun;
      p2.vx = -p2.facing * FIGHTER_PHYSICS.BLOCK_PUSHBACK;
    } else if (isVulnerable(p2)) {
      // Hit!
      result.damageToP2 = attack.damage;
      p2.stunFrames = attack.hitstun;
      p2.vx = -p2.facing * attack.pushback;
      if (p2.state !== FighterState.DEAD) {
        changeState(p2, FighterState.HURT);
      }
    }
  }

  // Check P2 hitting P1
  const p2Hitbox = getHitbox(p2);
  const p1Hurtbox = getHurtbox(p1);

  if (p2Hitbox && !p2.attackHit && boxesOverlap(p2Hitbox, p1Hurtbox)) {
    p2.attackHit = true;
    const attack = p2.currentAttack!;

    if (isBlocking(p1)) {
      // Blocked
      result.p2Blocked = true;
      p1.stunFrames = attack.blockstun;
      p1.vx = -p1.facing * FIGHTER_PHYSICS.BLOCK_PUSHBACK;
    } else if (isVulnerable(p1)) {
      // Hit!
      result.damageToP1 = attack.damage;
      p1.stunFrames = attack.hitstun;
      p1.vx = -p1.facing * attack.pushback;
      if (p1.state !== FighterState.DEAD) {
        changeState(p1, FighterState.HURT);
      }
    }
  }

  return result;
}

/** Set fighter to dead state */
export function setFighterDead(fighter: FighterRuntimeState): void {
  fighter.state = FighterState.DEAD;
  fighter.stateFrames = 0;
  fighter.vx = 0;
  fighter.stunFrames = 999;
}

/** Set fighter to win state */
export function setFighterWin(fighter: FighterRuntimeState): void {
  fighter.state = FighterState.WIN;
  fighter.stateFrames = 0;
  fighter.vx = 0;
  fighter.currentAttack = null;
}

/** Set fighter to intro state */
export function setFighterIntro(fighter: FighterRuntimeState): void {
  fighter.state = FighterState.INTRO;
  fighter.stateFrames = 0;
  fighter.vx = 0;
  fighter.currentAttack = null;
}
