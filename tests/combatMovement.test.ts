import { describe, expect, it } from 'vitest';
import { updateFighter } from '../src/game/sim/CombatSystem';
import {
  createFighterState,
  FIGHTER_PHYSICS,
  FighterState,
} from '../src/game/sim/FighterState';
import { INPUT_FLAGS } from '../src/game/sim/InputFrame';

/**
 * These tests ensure movement tuning (especially diagonal jumps) retains enough
 * horizontal momentum while airborne.
 */
describe('Combat movement tuning', () => {
  it('preserves horizontal momentum in air', () => {
    const p1 = createFighterState(300, 1);
    const p2 = createFighterState(900, -1);

    // Simulate being mid-air with forward velocity from a diagonal jump
    p1.state = FighterState.JUMP;
    p1.grounded = false;
    p1.y = FIGHTER_PHYSICS.GROUND_Y - 30;
    p1.vx = 10;
    p1.vy = 0;

    updateFighter(p1, INPUT_FLAGS.NONE, p2, 0);

    expect(p1.vx).toBeGreaterThan(9); // Air friction should not drain momentum
  });
});
