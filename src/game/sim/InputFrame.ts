/**
 * @fileoverview Input frame bitmask for netplay-ready input capture
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/INPUT.md - InputFrame format and bit layout
 * @see docs/NETPLAY_ROADMAP.md - Why we need compact input representation
 */

// =============================================================================
// Input Flags
// =============================================================================

/**
 * Input bit flags.
 * Each flag represents a single input action as a power of 2.
 *
 * Bit layout (16-bit):
 * [0]  Left
 * [1]  Right
 * [2]  Up (Jump)
 * [3]  Down (Crouch)
 * [4]  Attack1
 * [5]  Attack2
 * [6]  Special
 * [7]  Block
 * [8-15] Reserved
 */
export const INPUT_FLAGS = {
  NONE: 0,
  LEFT: 1 << 0,
  RIGHT: 1 << 1,
  UP: 1 << 2,
  DOWN: 1 << 3,
  ATTACK1: 1 << 4,
  ATTACK2: 1 << 5,
  SPECIAL: 1 << 6,
  BLOCK: 1 << 7,
} as const;

/** Type for input flag values */
export type InputFlag = (typeof INPUT_FLAGS)[keyof typeof INPUT_FLAGS];

/** Input frame is a 16-bit unsigned integer */
export type InputFrame = number;

// =============================================================================
// Input Actions
// =============================================================================

/**
 * Input action names that map to flags.
 */
export const INPUT_ACTIONS = [
  'left',
  'right',
  'up',
  'down',
  'attack1',
  'attack2',
  'special',
  'block',
] as const;

/** Type for input action names */
export type InputAction = (typeof INPUT_ACTIONS)[number];

/** Map action names to flags */
export const ACTION_TO_FLAG: Record<InputAction, InputFlag> = {
  left: INPUT_FLAGS.LEFT,
  right: INPUT_FLAGS.RIGHT,
  up: INPUT_FLAGS.UP,
  down: INPUT_FLAGS.DOWN,
  attack1: INPUT_FLAGS.ATTACK1,
  attack2: INPUT_FLAGS.ATTACK2,
  special: INPUT_FLAGS.SPECIAL,
  block: INPUT_FLAGS.BLOCK,
};

// =============================================================================
// Pack/Unpack Functions
// =============================================================================

/**
 * Create an input frame from active actions.
 *
 * @param actions - Array of active input actions
 * @returns Packed input frame
 *
 * @example
 * ```typescript
 * const frame = packInputFrame(['left', 'attack1']);
 * // frame = 0b00010001 = 17
 * ```
 */
export function packInputFrame(actions: readonly InputAction[]): InputFrame {
  let frame: InputFrame = INPUT_FLAGS.NONE;
  for (const action of actions) {
    frame |= ACTION_TO_FLAG[action];
  }
  return frame;
}

/**
 * Unpack an input frame to active actions.
 *
 * @param frame - Packed input frame
 * @returns Array of active input actions
 *
 * @example
 * ```typescript
 * const actions = unpackInputFrame(17);
 * // actions = ['left', 'attack1']
 * ```
 */
export function unpackInputFrame(frame: InputFrame): InputAction[] {
  const actions: InputAction[] = [];
  for (const action of INPUT_ACTIONS) {
    if (hasFlag(frame, ACTION_TO_FLAG[action])) {
      actions.push(action);
    }
  }
  return actions;
}

// =============================================================================
// Flag Operations
// =============================================================================

/**
 * Check if an input frame has a specific flag set.
 *
 * @param frame - Input frame to check
 * @param flag - Flag to check for
 * @returns True if flag is set
 */
export function hasFlag(frame: InputFrame, flag: InputFlag): boolean {
  return (frame & flag) !== 0;
}

/**
 * Set a flag in an input frame.
 *
 * @param frame - Input frame
 * @param flag - Flag to set
 * @returns New input frame with flag set
 */
export function setFlag(frame: InputFrame, flag: InputFlag): InputFrame {
  return frame | flag;
}

/**
 * Clear a flag in an input frame.
 *
 * @param frame - Input frame
 * @param flag - Flag to clear
 * @returns New input frame with flag cleared
 */
export function clearFlag(frame: InputFrame, flag: InputFlag): InputFrame {
  return frame & ~flag;
}

/**
 * Toggle a flag in an input frame.
 *
 * @param frame - Input frame
 * @param flag - Flag to toggle
 * @returns New input frame with flag toggled
 */
export function toggleFlag(frame: InputFrame, flag: InputFlag): InputFrame {
  return frame ^ flag;
}

// =============================================================================
// Direction Helpers
// =============================================================================

/**
 * Get horizontal direction from input frame.
 *
 * @param frame - Input frame
 * @returns -1 (left), 0 (none), or 1 (right)
 */
export function getHorizontalDirection(frame: InputFrame): -1 | 0 | 1 {
  const left = hasFlag(frame, INPUT_FLAGS.LEFT);
  const right = hasFlag(frame, INPUT_FLAGS.RIGHT);

  if (left && !right) return -1;
  if (right && !left) return 1;
  return 0;
}

/**
 * Get vertical direction from input frame.
 *
 * @param frame - Input frame
 * @returns -1 (up/jump), 0 (none), or 1 (down/crouch)
 */
export function getVerticalDirection(frame: InputFrame): -1 | 0 | 1 {
  const up = hasFlag(frame, INPUT_FLAGS.UP);
  const down = hasFlag(frame, INPUT_FLAGS.DOWN);

  if (up && !down) return -1;
  if (down && !up) return 1;
  return 0;
}

// =============================================================================
// Input Record (for replay/rollback)
// =============================================================================

/**
 * Input record for a single simulation tick.
 * Stores inputs for both players.
 */
export interface InputRecord {
  /** Simulation tick number */
  tick: number;
  /** Input frames for each player [P1, P2] */
  inputs: [InputFrame, InputFrame];
}

/**
 * Create an empty input record.
 *
 * @param tick - Tick number
 * @returns Input record with empty inputs
 */
export function createInputRecord(tick: number): InputRecord {
  return {
    tick,
    inputs: [INPUT_FLAGS.NONE, INPUT_FLAGS.NONE],
  };
}
