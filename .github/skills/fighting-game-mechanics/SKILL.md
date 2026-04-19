---
name: fighting-game-mechanics
description: "Deep knowledge of arcade 2D fighting game design. Use when: implementing combat systems, frame data, hitboxes, hurtboxes, combo input detection, attack properties, blocking, hitstun, knockback, damage scaling, fighter state machines, balance tuning, dash/jump arcs, or applying classic fighting game patterns (Street Fighter, Guilty Gear, etc.) to DevoxxFighter code."
---
# Fighting Game Mechanics

Expert-level domain knowledge for implementing 2D arcade fighting game systems.

## When to Use
- Designing or modifying attack frame data (startup, active, recovery)
- Implementing hitbox/hurtbox collision
- Adding combo input detection or new combo routes
- Tuning damage, knockback, hitstun values
- Implementing new fighter states or transitions
- Balancing characters or move properties
- Adding movement mechanics (dashes, jumps, air control)
- Reviewing combat code for correctness against FGC conventions

## Procedure

### 1. Understand the State Machine

Read [fighter states reference](./references/fighter-states.md) for the full state machine, then check `src/game/sim/FighterState.ts` for current implementation.

### 2. Apply Frame Data Correctly

Read [frame data reference](./references/frame-data.md) for how startup/active/recovery frames work, then check `ATTACK_DATA` in `src/game/sim/FighterState.ts`.

### 3. Implement Combos

Read [combo system reference](./references/combo-system.md) for input detection patterns, then check `src/game/sim/ComboInput.ts`.

### 4. Balance Check

After any combat change:
- Verify frame advantage on block and on hit
- Ensure no infinite combos (hitstun scaling or gravity)
- Test that blocking reduces damage and prevents hitstun
- Confirm knockback distances feel right at 1280×720 resolution

### 5. Validate Determinism

All combat code lives in `src/game/sim/` — verify:
- No `Math.random()` (use seeded RNG if needed)
- No Phaser imports
- No `Date.now()` or wall-clock reads
- Same InputFrame sequence → identical outcome
