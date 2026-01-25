/**
 * @fileoverview Fighting game AI Bot system
 * @description CPU opponent with configurable difficulty and behavior patterns
 */

import type { FighterRuntimeState } from './FighterState';
import { FighterState } from './FighterState';
import { INPUT_FLAGS, type InputFrame } from './InputFrame';

// =============================================================================
// Types
// =============================================================================

/** AI difficulty levels */
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'nightmare';

/** AI behavior state */
type AIBehavior = 
  | 'approach'      // Move toward opponent
  | 'retreat'       // Move away from opponent
  | 'pressure'      // Stay close and attack
  | 'defensive'     // Block and counter
  | 'jump_attack'   // Jump in with attack
  | 'anti_air'      // Counter opponent jumps
  | 'idle';         // Wait and observe

/** AI decision context */
interface AIContext {
  /** Distance to opponent */
  distance: number;
  /** Is opponent attacking */
  opponentAttacking: boolean;
  /** Is opponent jumping */
  opponentJumping: boolean;
  /** Is opponent crouching */
  opponentCrouching: boolean;
  /** AI's current health percentage */
  selfHealthPercent: number;
  /** Opponent's health percentage */
  opponentHealthPercent: number;
  /** Is AI grounded */
  grounded: boolean;
  /** AI facing direction */
  facing: 1 | -1;
  /** Relative direction to opponent (1 = opponent is right, -1 = opponent is left) */
  opponentDirection: 1 | -1;
}

// =============================================================================
// AI Configuration
// =============================================================================

/** Difficulty settings */
interface DifficultyConfig {
  /** Reaction time in frames (lower = faster) */
  reactionFrames: number;
  /** Chance to make optimal decision (0-1) */
  optimalDecisionChance: number;
  /** Chance to block incoming attack (0-1) */
  blockChance: number;
  /** Attack frequency (frames between attacks) */
  attackCooldown: number;
  /** Chance to use combos */
  comboChance: number;
  /** Aggression level (0-1, higher = more offensive) */
  aggression: number;
}

const DIFFICULTY_CONFIG: Record<AIDifficulty, DifficultyConfig> = {
  easy: {
    reactionFrames: 30,
    optimalDecisionChance: 0.3,
    blockChance: 0.2,
    attackCooldown: 60,
    comboChance: 0.1,
    aggression: 0.3,
  },
  medium: {
    reactionFrames: 18,
    optimalDecisionChance: 0.5,
    blockChance: 0.5,
    attackCooldown: 40,
    comboChance: 0.3,
    aggression: 0.5,
  },
  hard: {
    reactionFrames: 10,
    optimalDecisionChance: 0.75,
    blockChance: 0.75,
    attackCooldown: 25,
    comboChance: 0.5,
    aggression: 0.7,
  },
  nightmare: {
    reactionFrames: 5,
    optimalDecisionChance: 0.95,
    blockChance: 0.9,
    attackCooldown: 15,
    comboChance: 0.8,
    aggression: 0.85,
  },
};

// =============================================================================
// AI Bot Class
// =============================================================================

/**
 * AI-controlled fighter for single-player mode.
 * Makes decisions based on game state and difficulty level.
 */
export class FightingAI {
  private difficulty: AIDifficulty;
  private config: DifficultyConfig;
  
  // Internal state
  private currentBehavior: AIBehavior = 'approach';
  private behaviorTimer = 0;
  private attackCooldown = 0;
  private frameCounter = 0;
  private pendingJump = false;
  private comboStep = 0;
  private comboTimer = 0;

  constructor(difficulty: AIDifficulty = 'medium') {
    this.difficulty = difficulty;
    this.config = DIFFICULTY_CONFIG[difficulty];
  }

  /** Set AI difficulty */
  setDifficulty(difficulty: AIDifficulty): void {
    this.difficulty = difficulty;
    this.config = DIFFICULTY_CONFIG[difficulty];
  }

  /** Get current difficulty */
  getDifficulty(): AIDifficulty {
    return this.difficulty;
  }

  /** Reset AI state for new round */
  reset(): void {
    this.currentBehavior = 'approach';
    this.behaviorTimer = 0;
    this.attackCooldown = 0;
    this.frameCounter = 0;
    this.pendingJump = false;
    this.comboStep = 0;
    this.comboTimer = 0;
  }

  /**
   * Generate input for the AI fighter.
   * @param self - AI's fighter state
   * @param opponent - Human player's fighter state
   * @param selfHealth - AI's current health (0-100)
   * @param opponentHealth - Opponent's current health (0-100)
   * @returns Input bitmask
   */
  getInput(
    self: FighterRuntimeState,
    opponent: FighterRuntimeState,
    selfHealth = 100,
    opponentHealth = 100
  ): InputFrame {
    this.frameCounter++;

    // Build context
    const context = this.buildContext(self, opponent, selfHealth, opponentHealth);

    // Decrease cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.behaviorTimer > 0) this.behaviorTimer--;
    if (this.comboTimer > 0) this.comboTimer--;

    // Check if we should react (based on reaction time)
    const shouldReact = this.frameCounter % Math.max(1, this.config.reactionFrames) === 0;

    // Update behavior if timer expired
    if (this.behaviorTimer <= 0 && shouldReact) {
      this.decideBehavior(context);
    }

    // Generate input based on current behavior
    let input = this.executeBehavior(context, self);

    // Maybe add some randomness for less predictability (except on nightmare)
    if (this.difficulty !== 'nightmare' && Math.random() > 0.95) {
      input = 0; // Occasional pause makes AI feel more human
    }

    return input;
  }

  /** Build decision context from game state */
  private buildContext(
    self: FighterRuntimeState,
    opponent: FighterRuntimeState,
    selfHealth: number,
    opponentHealth: number
  ): AIContext {
    const distance = Math.abs(self.x - opponent.x);
    const opponentDirection = opponent.x > self.x ? 1 : -1;

    return {
      distance,
      opponentAttacking: this.isAttackState(opponent.state),
      opponentJumping: opponent.state === FighterState.JUMP,
      opponentCrouching: opponent.state === FighterState.CROUCH,
      selfHealthPercent: selfHealth / 100,
      opponentHealthPercent: opponentHealth / 100,
      grounded: self.grounded,
      facing: self.facing,
      opponentDirection: opponentDirection as 1 | -1,
    };
  }

  /** Check if a state is an attack */
  private isAttackState(state: FighterState): boolean {
    return [
      FighterState.ATTACK1,
      FighterState.ATTACK2,
      FighterState.SPECIAL,
      FighterState.UPPERCUT,
      FighterState.SLIDE,
    ].includes(state);
  }

  /** Decide what behavior to adopt */
  private decideBehavior(context: AIContext): void {
    const roll = Math.random();
    const optimalRoll = Math.random() < this.config.optimalDecisionChance;

    // Anti-air priority
    if (context.opponentJumping && optimalRoll) {
      this.currentBehavior = 'anti_air';
      this.behaviorTimer = 20;
      return;
    }

    // Defensive when opponent is attacking and we can block
    if (context.opponentAttacking && context.distance < 200) {
      if (Math.random() < this.config.blockChance) {
        this.currentBehavior = 'defensive';
        this.behaviorTimer = 30;
        return;
      }
    }

    // Low health - more defensive or desperate aggression
    if (context.selfHealthPercent < 0.3) {
      if (Math.random() < 0.5) {
        this.currentBehavior = 'retreat';
        this.behaviorTimer = 40;
        return;
      }
    }

    // Winning - maintain pressure
    if (context.opponentHealthPercent < 0.3 && context.selfHealthPercent > 0.5) {
      this.currentBehavior = 'pressure';
      this.behaviorTimer = 50;
      return;
    }

    // Distance-based decisions
    if (context.distance > 350) {
      // Far away - approach or jump attack
      if (roll < this.config.aggression) {
        this.currentBehavior = Math.random() < 0.3 ? 'jump_attack' : 'approach';
      } else {
        this.currentBehavior = 'idle';
      }
      this.behaviorTimer = 30 + Math.floor(Math.random() * 30);
    } else if (context.distance > 180) {
      // Mid range - mix of approach and jump attacks
      if (roll < this.config.aggression) {
        this.currentBehavior = Math.random() < 0.4 ? 'jump_attack' : 'approach';
      } else {
        this.currentBehavior = 'idle';
      }
      this.behaviorTimer = 20 + Math.floor(Math.random() * 20);
    } else {
      // Close range - attack or retreat
      if (roll < this.config.aggression) {
        this.currentBehavior = 'pressure';
      } else {
        this.currentBehavior = Math.random() < 0.3 ? 'retreat' : 'defensive';
      }
      this.behaviorTimer = 15 + Math.floor(Math.random() * 15);
    }
  }

  /** Execute current behavior and return input */
  private executeBehavior(context: AIContext, self: FighterRuntimeState): InputFrame {
    let input: InputFrame = 0;

    // Handle pending jump (diagonal jumps need up + direction)
    if (this.pendingJump && context.grounded) {
      input |= INPUT_FLAGS.UP;
      if (this.currentBehavior === 'jump_attack') {
        // Jump toward opponent
        if (context.opponentDirection === 1) {
          input |= INPUT_FLAGS.RIGHT;
        } else {
          input |= INPUT_FLAGS.LEFT;
        }
      }
      this.pendingJump = false;
      return input;
    }

    // Combo execution
    if (this.comboStep > 0 && this.comboTimer > 0) {
      return this.executeCombo(context);
    }

    switch (this.currentBehavior) {
      case 'approach':
        input = this.handleApproach(context);
        break;

      case 'retreat':
        input = this.handleRetreat(context);
        break;

      case 'pressure':
        input = this.handlePressure(context, self);
        break;

      case 'defensive':
        input = this.handleDefensive(context);
        break;

      case 'jump_attack':
        input = this.handleJumpAttack(context);
        break;

      case 'anti_air':
        input = this.handleAntiAir(context, self);
        break;

      case 'idle':
      default:
        // Occasional movement even when idle
        if (Math.random() < 0.1) {
          input = context.opponentDirection === 1 ? INPUT_FLAGS.RIGHT : INPUT_FLAGS.LEFT;
        }
        break;
    }

    return input;
  }

  /** Approach opponent */
  private handleApproach(context: AIContext): InputFrame {
    let input: InputFrame = 0;

    // Move toward opponent
    if (context.opponentDirection === 1) {
      input |= INPUT_FLAGS.RIGHT;
    } else {
      input |= INPUT_FLAGS.LEFT;
    }

    // Maybe start attacking when close
    if (context.distance < 200 && this.attackCooldown <= 0) {
      if (Math.random() < 0.3) {
        input |= INPUT_FLAGS.ATTACK1;
        this.attackCooldown = this.config.attackCooldown;
      }
    }

    return input;
  }

  /** Retreat from opponent */
  private handleRetreat(context: AIContext): InputFrame {
    let input: InputFrame = 0;

    // Move away from opponent
    if (context.opponentDirection === 1) {
      input |= INPUT_FLAGS.LEFT;
    } else {
      input |= INPUT_FLAGS.RIGHT;
    }

    // Maybe jump back
    if (Math.random() < 0.05 && context.grounded) {
      input |= INPUT_FLAGS.UP;
    }

    return input;
  }

  /** Pressure opponent with attacks */
  private handlePressure(context: AIContext, _self: FighterRuntimeState): InputFrame {
    let input: InputFrame = 0;

    // Stay close
    if (context.distance > 150) {
      if (context.opponentDirection === 1) {
        input |= INPUT_FLAGS.RIGHT;
      } else {
        input |= INPUT_FLAGS.LEFT;
      }
    }

    // Attack when close and cooldown is ready
    if (context.distance < 180 && this.attackCooldown <= 0) {
      const attackRoll = Math.random();

      // Decide attack type
      if (attackRoll < 0.4) {
        input |= INPUT_FLAGS.ATTACK1;
      } else if (attackRoll < 0.7) {
        input |= INPUT_FLAGS.ATTACK2;
      } else if (attackRoll < 0.85 && Math.random() < this.config.comboChance) {
        // Start a combo
        this.startCombo();
        input = this.executeCombo(context);
      } else {
        // Low attack (crouch + attack)
        if (context.grounded && !context.opponentCrouching) {
          input |= INPUT_FLAGS.DOWN;
          input |= INPUT_FLAGS.ATTACK1;
        } else {
          input |= INPUT_FLAGS.ATTACK1;
        }
      }

      this.attackCooldown = this.config.attackCooldown;
    }

    // Block sometimes while pressuring
    if (context.opponentAttacking && Math.random() < this.config.blockChance * 0.5) {
      input = INPUT_FLAGS.BLOCK;
      if (context.opponentDirection === 1) {
        input |= INPUT_FLAGS.LEFT;
      } else {
        input |= INPUT_FLAGS.RIGHT;
      }
    }

    return input;
  }

  /** Defensive play - block and counter */
  private handleDefensive(context: AIContext): InputFrame {
    let input: InputFrame = 0;

    // Hold block toward opponent (back + block)
    input |= INPUT_FLAGS.BLOCK;
    
    // Hold back to block
    if (context.opponentDirection === 1) {
      input |= INPUT_FLAGS.LEFT;
    } else {
      input |= INPUT_FLAGS.RIGHT;
    }

    // Crouch block sometimes
    if (Math.random() < 0.3) {
      input |= INPUT_FLAGS.DOWN;
    }

    // Counter attack when opponent whiffs
    if (!context.opponentAttacking && this.attackCooldown <= 0 && context.distance < 180) {
      if (Math.random() < this.config.optimalDecisionChance * 0.5) {
        input = INPUT_FLAGS.ATTACK1;
        this.attackCooldown = this.config.attackCooldown;
      }
    }

    return input;
  }

  /** Jump attack approach */
  private handleJumpAttack(context: AIContext): InputFrame {
    let input: InputFrame = 0;

    if (context.grounded) {
      // Initiate jump toward opponent
      input |= INPUT_FLAGS.UP;
      if (context.opponentDirection === 1) {
        input |= INPUT_FLAGS.RIGHT;
      } else {
        input |= INPUT_FLAGS.LEFT;
      }
    } else {
      // In air - maintain direction and attack
      if (context.opponentDirection === 1) {
        input |= INPUT_FLAGS.RIGHT;
      } else {
        input |= INPUT_FLAGS.LEFT;
      }

      // Attack during descent
      if (context.distance < 200) {
        if (Math.random() < 0.3) {
          input |= Math.random() < 0.5 ? INPUT_FLAGS.ATTACK1 : INPUT_FLAGS.ATTACK2;
        }
      }
    }

    return input;
  }

  /** Anti-air to counter jumping opponents */
  private handleAntiAir(context: AIContext, self: FighterRuntimeState): InputFrame {
    let input: InputFrame = 0;

    // Position under opponent
    if (context.distance > 80) {
      if (context.opponentDirection === 1) {
        input |= INPUT_FLAGS.RIGHT;
      } else {
        input |= INPUT_FLAGS.LEFT;
      }
    }

    // Uppercut when opponent is overhead
    if (context.distance < 200 && context.opponentJumping && this.attackCooldown <= 0) {
      // Use special (uppercut) or standing attack
      if (Math.random() < 0.4 && self.grounded) {
        // Crouch then up for uppercut (if implemented)
        input |= INPUT_FLAGS.DOWN;
        input |= INPUT_FLAGS.UP;
        input |= INPUT_FLAGS.ATTACK1;
      } else {
        input |= INPUT_FLAGS.ATTACK2;
      }
      this.attackCooldown = this.config.attackCooldown;
    }

    return input;
  }

  /** Start a combo sequence */
  private startCombo(): void {
    this.comboStep = 1;
    this.comboTimer = 40; // Total combo window
  }

  /** Execute combo sequence */
  private executeCombo(context: AIContext): InputFrame {
    let input: InputFrame = 0;

    switch (this.comboStep) {
      case 1:
        // First hit
        input |= INPUT_FLAGS.ATTACK1;
        this.comboStep = 2;
        this.comboTimer = 15;
        break;

      case 2:
        // Move forward slightly + second hit
        if (context.opponentDirection === 1) {
          input |= INPUT_FLAGS.RIGHT;
        } else {
          input |= INPUT_FLAGS.LEFT;
        }
        input |= INPUT_FLAGS.ATTACK2;
        this.comboStep = 3;
        this.comboTimer = 15;
        break;

      case 3:
        // Finisher - special or heavy attack
        if (Math.random() < 0.5) {
          input |= INPUT_FLAGS.SPECIAL;
        } else {
          input |= INPUT_FLAGS.ATTACK2;
        }
        this.comboStep = 0; // Combo done
        break;

      default:
        this.comboStep = 0;
        break;
    }

    if (this.comboTimer <= 0) {
      this.comboStep = 0; // Cancel combo if timer expired
    }

    return input;
  }
}

// =============================================================================
// Singleton Instance Factory
// =============================================================================

/** Create a new AI instance */
export function createFightingAI(difficulty: AIDifficulty = 'medium'): FightingAI {
  return new FightingAI(difficulty);
}
