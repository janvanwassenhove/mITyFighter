/**
 * @fileoverview Input key bindings for player controls
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/INPUT.md - Key zones and binding rationale
 */

import { PlayerId } from '../config/constants';
import type { InputAction } from '../sim/InputFrame';

import { getKeyboardLayout, getP1MovementKeys, type KeyboardLayout } from './KeyboardLayout';


// =============================================================================
// Types
// =============================================================================

/**
 * Meta actions for game control (not part of InputFrame).
 */
export type MetaAction =
  | 'cycleCharacterPrev'
  | 'cycleCharacterNext'
  | 'cycleBackgroundPrev'
  | 'cycleBackgroundNext'
  | 'toggleDebug';

/** All possible actions (game + meta) */
export type AnyAction = InputAction | MetaAction;

/**
 * Single key binding entry.
 */
export interface KeyBinding {
  /** Key code (e.g., 'KeyA', 'ArrowLeft') */
  code: string;
  /** Action this key triggers */
  action: AnyAction;
  /** Player this binding belongs to (null for global) */
  player: PlayerId | null;
}

// =============================================================================
// Player 1 Bindings (Left Side of Keyboard)
// =============================================================================

/**
 * Get Player 1 key bindings based on keyboard layout.
 * Uses WASD for QWERTY, ZQSD for AZERTY.
 */
export function getP1Bindings(layout: KeyboardLayout = getKeyboardLayout()): KeyBinding[] {
  const movement = getP1MovementKeys(layout);
  return [
    // Movement (layout-aware)
    { code: movement.left, action: 'left', player: PlayerId.P1 },
    { code: movement.right, action: 'right', player: PlayerId.P1 },
    { code: movement.up, action: 'up', player: PlayerId.P1 },
    { code: movement.down, action: 'down', player: PlayerId.P1 },

    // Combat
    { code: 'KeyF', action: 'attack1', player: PlayerId.P1 },
    { code: 'KeyG', action: 'attack2', player: PlayerId.P1 },
    { code: 'KeyH', action: 'special', player: PlayerId.P1 },
    { code: 'KeyR', action: 'block', player: PlayerId.P1 },

    // Character cycling (layout-aware: use A/E for AZERTY, Q/E for QWERTY)
    { code: layout === 'azerty' ? 'KeyA' : 'KeyQ', action: 'cycleCharacterPrev', player: PlayerId.P1 },
    { code: 'KeyE', action: 'cycleCharacterNext', player: PlayerId.P1 },
  ];
}

/**
 * Player 1 key bindings (default QWERTY).
 * @deprecated Use getP1Bindings() for layout-aware bindings
 */
export const P1_BINDINGS: KeyBinding[] = [
  // Movement
  { code: 'KeyA', action: 'left', player: PlayerId.P1 },
  { code: 'KeyD', action: 'right', player: PlayerId.P1 },
  { code: 'KeyW', action: 'up', player: PlayerId.P1 },
  { code: 'KeyS', action: 'down', player: PlayerId.P1 },

  // Combat
  { code: 'KeyF', action: 'attack1', player: PlayerId.P1 },
  { code: 'KeyG', action: 'attack2', player: PlayerId.P1 },
  { code: 'KeyH', action: 'special', player: PlayerId.P1 },
  { code: 'KeyR', action: 'block', player: PlayerId.P1 },

  // Character cycling
  { code: 'KeyQ', action: 'cycleCharacterPrev', player: PlayerId.P1 },
  { code: 'KeyE', action: 'cycleCharacterNext', player: PlayerId.P1 },
];

// =============================================================================
// Player 2 Bindings (Right Side - Numpad Mode)
// =============================================================================

/**
 * Player 2 key bindings with numpad.
 * Uses arrow keys for movement, numpad for actions.
 */
export const P2_BINDINGS_NUMPAD: KeyBinding[] = [
  // Movement
  { code: 'ArrowLeft', action: 'left', player: PlayerId.P2 },
  { code: 'ArrowRight', action: 'right', player: PlayerId.P2 },
  { code: 'ArrowUp', action: 'up', player: PlayerId.P2 },
  { code: 'ArrowDown', action: 'down', player: PlayerId.P2 },

  // Combat (Numpad)
  { code: 'Numpad1', action: 'attack1', player: PlayerId.P2 },
  { code: 'Numpad2', action: 'attack2', player: PlayerId.P2 },
  { code: 'Numpad3', action: 'special', player: PlayerId.P2 },
  { code: 'Numpad0', action: 'block', player: PlayerId.P2 },

  // Character cycling
  { code: 'KeyU', action: 'cycleCharacterPrev', player: PlayerId.P2 },
  { code: 'KeyO', action: 'cycleCharacterNext', player: PlayerId.P2 },
];

// =============================================================================
// Player 2 Bindings (Right Side - No Numpad Mode)
// =============================================================================

/**
 * Player 2 key bindings without numpad.
 * For laptops without numpad: uses JKL/UIOP area.
 */
export const P2_BINDINGS_NO_NUMPAD: KeyBinding[] = [
  // Movement
  { code: 'KeyJ', action: 'left', player: PlayerId.P2 },
  { code: 'KeyL', action: 'right', player: PlayerId.P2 },
  { code: 'KeyI', action: 'up', player: PlayerId.P2 },
  { code: 'KeyK', action: 'down', player: PlayerId.P2 },

  // Combat
  { code: 'KeyU', action: 'attack1', player: PlayerId.P2 },
  { code: 'KeyO', action: 'attack2', player: PlayerId.P2 },
  { code: 'KeyP', action: 'special', player: PlayerId.P2 },
  { code: 'KeyY', action: 'block', player: PlayerId.P2 },

  // Character cycling
  { code: 'Digit8', action: 'cycleCharacterPrev', player: PlayerId.P2 },
  { code: 'Digit9', action: 'cycleCharacterNext', player: PlayerId.P2 },
];

// =============================================================================
// Global Bindings
// =============================================================================

/**
 * Global key bindings (not player-specific).
 */
export const GLOBAL_BINDINGS: KeyBinding[] = [
  { code: 'F1', action: 'toggleDebug', player: null },
  { code: 'KeyZ', action: 'cycleBackgroundPrev', player: null },
  { code: 'KeyC', action: 'cycleBackgroundNext', player: null },
];

// =============================================================================
// Binding Helpers
// =============================================================================

/**
 * Get all key bindings for a configuration.
 *
 * @param useNumpad - Whether to use numpad bindings for P2
 * @param layout - Keyboard layout (auto-detected if not specified)
 * @returns Array of all key bindings
 */
export function getAllBindings(useNumpad: boolean, layout: KeyboardLayout = getKeyboardLayout()): KeyBinding[] {
  const p1Bindings = getP1Bindings(layout);
  const p2Bindings = useNumpad ? P2_BINDINGS_NUMPAD : P2_BINDINGS_NO_NUMPAD;
  return [...p1Bindings, ...p2Bindings, ...GLOBAL_BINDINGS];
}

/**
 * Create a lookup map from key code to binding.
 *
 * @param bindings - Array of key bindings
 * @returns Map of key code to binding
 */
export function createBindingMap(
  bindings: KeyBinding[]
): Map<string, KeyBinding> {
  const map = new Map<string, KeyBinding>();
  for (const binding of bindings) {
    map.set(binding.code, binding);
  }
  return map;
}

/**
 * Check if an action is a game input action (part of InputFrame).
 *
 * @param action - Action to check
 * @returns True if it's a game input action
 */
export function isInputAction(action: AnyAction): action is InputAction {
  return [
    'left',
    'right',
    'up',
    'down',
    'attack1',
    'attack2',
    'special',
    'block',
  ].includes(action);
}

/**
 * Check if an action is a meta action.
 *
 * @param action - Action to check
 * @returns True if it's a meta action
 */
export function isMetaAction(action: AnyAction): action is MetaAction {
  return !isInputAction(action);
}

/**
 * Get bindings for a specific player.
 *
 * @param bindings - All bindings
 * @param playerId - Player to filter for
 * @returns Bindings for the specified player
 */
export function getPlayerBindings(
  bindings: KeyBinding[],
  playerId: PlayerId
): KeyBinding[] {
  return bindings.filter((b) => b.player === playerId);
}

/**
 * Get global bindings (not player-specific).
 *
 * @param bindings - All bindings
 * @returns Global bindings
 */
export function getGlobalBindings(bindings: KeyBinding[]): KeyBinding[] {
  return bindings.filter((b) => b.player === null);
}
