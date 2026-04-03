# Fighter State Machine

## States

| State | Enum | Interruptible | Notes |
|-------|------|---------------|-------|
| IDLE | `idle` | Yes | Default standing state |
| WALK | `walk` | Yes | Horizontal movement |
| RUN | `run` | Yes | Fast horizontal movement |
| JUMP | `jump` | Partially | Can attack mid-air |
| CROUCH | `crouch` | Yes | Low profile, can block low |
| BLOCK | `block` | Yes | Standing guard |
| ATTACK1 | `attack1` | No | Light attack — fast, low damage |
| ATTACK2 | `attack2` | No | Heavy attack — slow, high damage |
| SPECIAL | `special` | No | Unique move per character |
| UPPERCUT | `uppercut` | No | Anti-air rising attack |
| SLIDE | `slide` | No | Low sweep/approaching attack |
| HURT | `hurt` | No | Hitstun — recovering from hit |
| DEAD | `dead` | No | Terminal state, no recovery |
| DASH | `dash` | No | Short burst of forward/backward speed |

## Transition Rules

```
IDLE/WALK/RUN/CROUCH/BLOCK → any action on input
ATTACK1/2/SPECIAL/UPPERCUT/SLIDE → IDLE after recovery frames
HURT → IDLE after hitstun expires
JUMP → IDLE on ground contact
DEAD → no transitions
```

## Interruptible vs Locked

- **Interruptible states** (`IDLE`, `WALK`, `RUN`, `CROUCH`, `BLOCK`): Input processed immediately
- **Locked states** (`ATTACK*`, `SPECIAL`, `HURT`, `DASH`): Must wait for duration to expire
- **Buffer window**: Inputs during locked state can be buffered for execution on recovery

## State Priorities (when multiple inputs)

1. Block (if holding block + direction)
2. Special (if special pressed)
3. Attack2 (heavy)
4. Attack1 (light)
5. Jump (up)
6. Crouch (down)
7. Walk/Run (left/right)

## Implementation Location

- State enum: `src/game/sim/FighterState.ts` → `FighterState`
- Runtime state: `src/game/sim/FighterState.ts` → `FighterRuntimeState`
- State transitions: `src/game/sim/CombatSystem.ts` → `processPlayerInput()`
- Sim types: `src/game/sim/SimTypes.ts` → `PlayerState`
