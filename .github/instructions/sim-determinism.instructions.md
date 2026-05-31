---
description: "Enforces deterministic simulation rules. Use when editing files in src/game/sim/."
applyTo: "src/game/sim/**"
---
# Simulation Module Rules

This file is in the **deterministic simulation** layer. Strict rules apply:

- **NO Phaser imports** — sim must run headless
- **NO `Math.random()`** — use seeded RNG if randomness is needed
- **NO `Date.now()` or wall-clock reads** — use tick count only
- **NO rendering or DOM references**
- **Same inputs MUST produce same outputs** (determinism)
- All state must be serializable (for netplay rollback)
- Runs at 60 ticks/second via `FixedTimestepLoop`
- Input is a 16-bit bitmask (`InputFrame`)
