/**
 * @fileoverview Combo input detection for fighting game moves
 * @description Detects directional combinations like forward+up, down+forward, etc.
 */

import { INPUT_FLAGS, type InputFrame, hasFlag } from './InputFrame';

// =============================================================================
// Combo Types
// =============================================================================

/** Direction relative to facing */
export type RelativeDirection = 'forward' | 'backward' | 'up' | 'down' | 'neutral';

/** Combo move identifiers */
export type ComboMove =
  | 'jump_forward'        // Up + Forward - jumping kick
  | 'jump_backward'       // Up + Backward - retreat jump
  | 'crouch_forward'      // Down + Forward - sliding sweep
  | 'crouch_backward'     // Down + Backward - defensive crouch
  | 'dash_forward'        // Forward + Forward (tap tap) - dash
  | 'dash_backward'       // Backward + Backward (tap tap) - backdash
  | 'uppercut'            // Down, Up - rising uppercut
  | 'fireball_forward'    // Down, Forward + Attack - hadouken style
  | 'fireball_backward'   // Down, Backward + Attack - reverse fireball
  | 'spin_kick'           // Backward, Forward + Attack - spinning attack
  | 'character_special'   // Down, Down + Attack1 - character special move
  | null;

/** Input history entry */
interface InputHistoryEntry {
  /** Raw input flags */
  input: InputFrame;
  /** Frame timestamp */
  frame: number;
  /** Directions pressed relative to facing */
  directions: RelativeDirection[];
}

/** Combo detection result */
export interface ComboResult {
  /** Detected combo move (null if none) */
  move: ComboMove;
  /** Modified input frame with combo applied */
  modifiedInput: InputFrame;
  /** Whether to consume the attack input */
  consumeAttack: boolean;
}

// =============================================================================
// Combo Detector Class
// =============================================================================

/** Window in frames for combo input detection */
const COMBO_WINDOW_FRAMES = 12;

/** Window for double-tap detection */
const DOUBLE_TAP_WINDOW = 10;

/** Minimum frames between taps for double-tap */
const DOUBLE_TAP_MIN_GAP = 2;

/**
 * Combo input detector for a single player.
 * Tracks input history and detects directional combinations.
 */
export class ComboInputDetector {
  /** Input history buffer */
  private history: InputHistoryEntry[] = [];
  
  /** Current frame counter */
  private currentFrame = 0;
  
  /** Maximum history length */
  private readonly maxHistory = 30;
  
  /** Player facing direction (1 = right, -1 = left) */
  private facing: 1 | -1 = 1;
  
  /** Last direction pressed (for double-tap detection) */
  private lastDirection: RelativeDirection = 'neutral';
  
  /** Frame when last direction was first pressed */
  private lastDirectionFrame = 0;
  
  /** Whether we're in neutral since last direction */
  private wasNeutral = true;

  /**
   * Update facing direction.
   * @param facing - 1 for right, -1 for left
   */
  setFacing(facing: 1 | -1): void {
    this.facing = facing;
  }

  /**
   * Process new input and detect combos.
   * @param input - Raw input frame
   * @returns Combo detection result
   */
  processInput(input: InputFrame): ComboResult {
    this.currentFrame++;
    
    // Convert raw input to relative directions
    const directions = this.getRelativeDirections(input);
    
    // Add to history
    this.history.push({
      input,
      frame: this.currentFrame,
      directions,
    });
    
    // Trim old history
    while (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // Detect combos
    const combo = this.detectCombo(input, directions);
    
    // Track for double-tap detection
    this.updateDoubleTapTracking(directions);
    
    return combo;
  }

  /**
   * Convert raw input to relative directions based on facing.
   */
  private getRelativeDirections(input: InputFrame): RelativeDirection[] {
    const dirs: RelativeDirection[] = [];
    
    const left = hasFlag(input, INPUT_FLAGS.LEFT);
    const right = hasFlag(input, INPUT_FLAGS.RIGHT);
    const up = hasFlag(input, INPUT_FLAGS.UP);
    const down = hasFlag(input, INPUT_FLAGS.DOWN);
    
    // Forward/backward relative to facing
    if (this.facing === 1) {
      if (right) dirs.push('forward');
      if (left) dirs.push('backward');
    } else {
      if (left) dirs.push('forward');
      if (right) dirs.push('backward');
    }
    
    if (up) dirs.push('up');
    if (down) dirs.push('down');
    
    if (dirs.length === 0) dirs.push('neutral');
    
    return dirs;
  }

  /**
   * Detect combo from current input and history.
   */
  private detectCombo(input: InputFrame, currentDirs: RelativeDirection[]): ComboResult {
    const hasAttack1 = hasFlag(input, INPUT_FLAGS.ATTACK1);
    const hasAttack2 = hasFlag(input, INPUT_FLAGS.ATTACK2);
    const hasAnyAttack = hasAttack1 || hasAttack2;
    
    // Check simultaneous direction combos first
    
    // Jump + direction (diagonal jumps)
    if (currentDirs.includes('up')) {
      if (currentDirs.includes('forward')) {
        return {
          move: 'jump_forward',
          modifiedInput: input,
          consumeAttack: false,
        };
      }
      if (currentDirs.includes('backward')) {
        return {
          move: 'jump_backward',
          modifiedInput: input,
          consumeAttack: false,
        };
      }
    }
    
    // Crouch + direction (crouch movement)
    if (currentDirs.includes('down')) {
      if (currentDirs.includes('forward')) {
        return {
          move: 'crouch_forward',
          modifiedInput: input,
          consumeAttack: false,
        };
      }
      if (currentDirs.includes('backward')) {
        return {
          move: 'crouch_backward',
          modifiedInput: input,
          consumeAttack: false,
        };
      }
    }
    
    // Check for double-tap dash
    const dashCombo = this.checkDoubleTap(currentDirs);
    if (dashCombo) {
      return {
        move: dashCombo,
        modifiedInput: input,
        consumeAttack: false,
      };
    }
    
    // Check motion + attack combos
    if (hasAnyAttack) {
      // Down, Down + Attack1 = Character Special (↓↓+A1)
      if (hasAttack1 && this.checkMotion(['down', 'down'])) {
        return {
          move: 'character_special',
          modifiedInput: input,
          consumeAttack: true,
        };
      }

      // Down, Forward + Attack = Fireball forward
      if (this.checkMotion(['down', 'forward'])) {
        return {
          move: 'fireball_forward',
          modifiedInput: input,
          consumeAttack: true,
        };
      }
      
      // Down, Backward + Attack = Fireball backward
      if (this.checkMotion(['down', 'backward'])) {
        return {
          move: 'fireball_backward',
          modifiedInput: input,
          consumeAttack: true,
        };
      }
      
      // Backward, Forward + Attack = Spin kick
      if (this.checkMotion(['backward', 'forward'])) {
        return {
          move: 'spin_kick',
          modifiedInput: input,
          consumeAttack: true,
        };
      }
    }
    
    // Down, Up = Uppercut (no attack needed)
    if (currentDirs.includes('up') && this.checkMotion(['down', 'up'])) {
      return {
        move: 'uppercut',
        modifiedInput: input,
        consumeAttack: false,
      };
    }
    
    // No combo detected
    return {
      move: null,
      modifiedInput: input,
      consumeAttack: false,
    };
  }

  /**
   * Check if a motion sequence was performed recently.
   * @param motion - Array of directions in order
   */
  private checkMotion(motion: RelativeDirection[]): boolean {
    if (this.history.length < motion.length) return false;
    
    const windowStart = this.currentFrame - COMBO_WINDOW_FRAMES;
    let motionIndex = 0;
    
    for (const entry of this.history) {
      if (entry.frame < windowStart) continue;
      
      // Check if this entry contains the next direction in the motion
      const targetDir = motion[motionIndex];
      if (targetDir && entry.directions.includes(targetDir)) {
        motionIndex++;
        if (motionIndex >= motion.length) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check for double-tap dash input.
   */
  private checkDoubleTap(currentDirs: RelativeDirection[]): ComboMove {
    const hasForward = currentDirs.includes('forward');
    const hasBackward = currentDirs.includes('backward');
    
    if (!hasForward && !hasBackward) {
      return null;
    }
    
    const currentDir = hasForward ? 'forward' : 'backward';
    
    // Check if this is the second tap
    if (currentDir === this.lastDirection && this.wasNeutral) {
      const gap = this.currentFrame - this.lastDirectionFrame;
      if (gap >= DOUBLE_TAP_MIN_GAP && gap <= DOUBLE_TAP_WINDOW) {
        // Reset tracking
        this.lastDirection = 'neutral';
        this.lastDirectionFrame = 0;
        
        return currentDir === 'forward' ? 'dash_forward' : 'dash_backward';
      }
    }
    
    return null;
  }

  /**
   * Update tracking for double-tap detection.
   */
  private updateDoubleTapTracking(currentDirs: RelativeDirection[]): void {
    const hasForward = currentDirs.includes('forward');
    const hasBackward = currentDirs.includes('backward');
    const isNeutral = currentDirs.includes('neutral') || (!hasForward && !hasBackward && !currentDirs.includes('up') && !currentDirs.includes('down'));
    
    if (isNeutral) {
      this.wasNeutral = true;
    } else if (hasForward || hasBackward) {
      const currentDir = hasForward ? 'forward' : 'backward';
      
      if (this.wasNeutral) {
        // This is a new tap
        if (currentDir !== this.lastDirection) {
          // Different direction, start fresh
          this.lastDirection = currentDir;
          this.lastDirectionFrame = this.currentFrame;
        }
        this.wasNeutral = false;
      }
    }
  }

  /**
   * Reset detector state.
   */
  reset(): void {
    this.history = [];
    this.currentFrame = 0;
    this.lastDirection = 'neutral';
    this.lastDirectionFrame = 0;
    this.wasNeutral = true;
  }
}

// =============================================================================
// Combo Move Properties
// =============================================================================

/** Properties for combo moves */
export interface ComboMoveProperties {
  /** Damage multiplier */
  damageMultiplier: number;
  /** Horizontal velocity */
  velocityX: number;
  /** Vertical velocity */
  velocityY: number;
  /** Startup frames */
  startup: number;
  /** Recovery frames */
  recovery: number;
  /** Description */
  description: string;
}

/** Combo move data */
export const COMBO_MOVE_DATA: Record<NonNullable<ComboMove>, ComboMoveProperties> = {
  jump_forward: {
    damageMultiplier: 1.2,
    velocityX: 14,
    velocityY: -23,
    startup: 0,
    recovery: 0,
    description: 'Jumping forward kick',
  },
  jump_backward: {
    damageMultiplier: 1.0,
    velocityX: -12,
    velocityY: -22,
    startup: 0,
    recovery: 0,
    description: 'Backward escape jump',
  },
  crouch_forward: {
    damageMultiplier: 1.1,
    velocityX: 7,
    velocityY: 0,
    startup: 2,
    recovery: 5,
    description: 'Low sliding attack',
  },
  crouch_backward: {
    damageMultiplier: 0.8,
    velocityX: -3,
    velocityY: 0,
    startup: 0,
    recovery: 4,
    description: 'Defensive crouch retreat',
  },
  dash_forward: {
    damageMultiplier: 1.0,
    velocityX: 16,
    velocityY: 0,
    startup: 1,
    recovery: 6,
    description: 'Quick forward dash',
  },
  dash_backward: {
    damageMultiplier: 1.0,
    velocityX: -14,
    velocityY: -6,
    startup: 1,
    recovery: 8,
    description: 'Backdash escape',
  },
  uppercut: {
    damageMultiplier: 1.5,
    velocityX: 2,
    velocityY: -24,
    startup: 2,
    recovery: 10,
    description: 'Rising uppercut',
  },
  fireball_forward: {
    damageMultiplier: 1.3,
    velocityX: 2,
    velocityY: 0,
    startup: 6,
    recovery: 14,
    description: 'Forward projectile attack',
  },
  fireball_backward: {
    damageMultiplier: 1.2,
    velocityX: -2,
    velocityY: 0,
    startup: 6,
    recovery: 14,
    description: 'Backward projectile attack',
  },
  spin_kick: {
    damageMultiplier: 1.4,
    velocityX: 12,
    velocityY: 0,
    startup: 3,
    recovery: 14,
    description: 'Spinning kick attack',
  },
  character_special: {
    damageMultiplier: 1.8,
    velocityX: 4,
    velocityY: 0,
    startup: 10,
    recovery: 18,
    description: 'Character special move (↓↓+A1)',
  },
};
