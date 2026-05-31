# Combo System Reference

## Input Detection Architecture

The `ComboInputDetector` class (one per player) in `src/game/sim/ComboInput.ts` tracks directional input history and detects multi-input combinations.

## Directional Model

Directions are **facing-relative**:
- `forward` = toward opponent (right when facing right, left when facing left)
- `backward` = away from opponent
- `up`, `down`, `neutral` = absolute

This ensures combos work identically regardless of which side the fighter is on.

## Currently Implemented Combos

| Combo Move | Input Sequence | Result |
|------------|---------------|--------|
| `jump_forward` | Up + Forward | Forward jumping attack |
| `jump_backward` | Up + Backward | Retreat jump |
| `crouch_forward` | Down + Forward | Sliding sweep |
| `crouch_backward` | Down + Backward | Defensive crouch |
| `dash_forward` | Forward, Forward (tap) | Forward dash |
| `dash_backward` | Backward, Backward (tap) | Backdash |
| `uppercut` | Down, Up | Rising uppercut |
| `fireball_forward` | Down, Forward + Attack | Projectile attack |
| `fireball_backward` | Down, Backward + Attack | Reverse projectile |
| `spin_kick` | Backward, Forward + Attack | Spinning attack |

## Detection Windows

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `COMBO_WINDOW_FRAMES` | 12 | Max frames between combo inputs |
| `DOUBLE_TAP_WINDOW` | 10 | Max frames between double-tap |
| `DOUBLE_TAP_MIN_GAP` | 2 | Min frames between taps (prevents accidental) |
| `maxHistory` | 30 | Input history buffer size |

## Adding a New Combo

1. Add the combo name to `ComboMove` type in `ComboInput.ts`
2. Add detection logic in `ComboInputDetector.detect()` method
3. Add move data (damage, state transition) to `COMBO_MOVE_DATA`
4. Handle the new combo in `CombatSystem.ts` → `processPlayerInput()`
5. Update `docs/INPUT.md` with the new combo
6. Add test in `tests/`

## Classic Fighting Game Input Motions

Reference for implementing future combos:

| Motion | Numpad Notation | Name |
|--------|----------------|------|
| ↓↘→ | 236 | Quarter-circle forward (hadouken) |
| ↓↙← | 214 | Quarter-circle backward |
| →↓↘ | 623 | Dragon punch / shoryuken |
| ←↓↙ | 421 | Reverse DP |
| ←→ | 46 | Charge forward |
| ↓↑ | 28 | Charge up (flash kick) |
| →←→ | 646 | Pretzel motion |
| 360° | 63214789 | Full circle (grappler) |

*Numpad notation: imagine a numpad, 5 = neutral, 6 = forward, 4 = back, 8 = up, 2 = down.*

## Implementation Location

- Detector class: `src/game/sim/ComboInput.ts` → `ComboInputDetector`
- Move data: `src/game/sim/ComboInput.ts` → `COMBO_MOVE_DATA`
- Integration: `src/game/sim/CombatSystem.ts`
