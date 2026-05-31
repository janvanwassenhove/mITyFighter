# Data Model: Core Fighting Engine

**Feature**: 001-core-fighting-engine
**Date**: 2026-04-19 (retroactive)

---

## SimulationState (Top-Level)

The root state object for the entire fight simulation.

```typescript
interface SimulationState {
  tick: number;                     // Current simulation tick (0-based, increments each 16.67ms)
  matchState: MatchState;           // WAITING | FIGHTING | ROUND_END | MATCH_END
  players: [PlayerState, PlayerState];  // Exactly 2 players
}

enum MatchState {
  WAITING = 'waiting',
  FIGHTING = 'fighting',
  ROUND_END = 'round_end',
  MATCH_END = 'match_end',
}
```

**Source**: `src/game/sim/SimTypes.ts`

---

## PlayerState

Per-player state within a simulation tick.

```typescript
interface PlayerState {
  position: Position;     // { x: number, y: number } — integer pixels
  velocity: Velocity;     // { vx: number, vy: number } — pixels per tick
  health: number;         // 0–100
  hitstun: number;        // Remaining hitstun frames (0 = not stunned)
  blocking: boolean;      // Currently blocking
  facing: FacingDirection; // LEFT | RIGHT
}

type Position = { x: number; y: number };
type Velocity = { vx: number; vy: number };
enum FacingDirection { LEFT = -1, RIGHT = 1 }
```

**Source**: `src/game/sim/SimTypes.ts`

---

## FighterRuntimeState (Extended State)

Detailed per-fighter state used by CombatSystem, beyond the minimal PlayerState.

```typescript
interface FighterRuntimeState {
  // Position & physics
  x: number;              // Horizontal position (integer)
  y: number;              // Vertical position (integer, 0 = ground)
  vx: number;             // Horizontal velocity
  vy: number;             // Vertical velocity

  // State machine
  state: FighterState;    // Current state (17 possible values)
  stateFrames: number;    // Ticks spent in current state

  // Combat
  health: number;         // 0–100
  hitstun: number;        // Remaining hitstun ticks
  blocking: boolean;      // Block active
  facing: FacingDirection; // -1 (LEFT) or 1 (RIGHT)

  // Identity
  fighterId: string;      // Which character
  playerId: number;       // 0 or 1
}
```

**Source**: `src/game/sim/FighterState.ts`

---

## FighterState Enum (17 States)

```typescript
enum FighterState {
  IDLE,       WALKING,    RUNNING,    JUMPING,
  CROUCHING,  BLOCKING,   ATTACK1,    ATTACK2,
  ATTACK3,    SPECIAL,    HURT,       HITSTUN,
  KNOCKDOWN,  KO,         INTRO,      WIN,
  LOSE
}
```

### State Transition Rules
| From | Allowed Transitions | Condition |
|------|-------------------|-----------|
| IDLE | WALKING, RUNNING, JUMPING, CROUCHING, BLOCKING, ATTACK*, SPECIAL | Input flags |
| WALKING/RUNNING | IDLE, JUMPING, ATTACK*, SPECIAL | Input change |
| JUMPING | ATTACK* (air attacks) | Attack input while airborne |
| ATTACK* | IDLE (on completion), HURT (if hit) | Animation complete or interrupted |
| HITSTUN | IDLE (when hitstun=0) | Timer expiry |
| KO | (terminal) | — |

**Interruptible states**: IDLE, WALKING, RUNNING, CROUCHING, BLOCKING

**Source**: `src/game/sim/FighterState.ts`

---

## Attack Data

```typescript
interface AttackData {
  startup: number;      // Frames before hitbox active
  active: number;       // Frames hitbox is active
  recovery: number;     // Frames after hitbox deactivates
  damage: number;       // Base damage (0–100 scale)
  hitstun: number;      // Hitstun frames applied to victim
  knockback: number;    // Horizontal push on hit
  blockDamage: number;  // Reduced damage when blocked
}
```

**Source**: `src/game/sim/CombatSystem.ts`

---

## Hitbox / Hurtbox

```typescript
interface HitBox {
  x: number;      // Offset from fighter position
  y: number;
  width: number;
  height: number;
}

// Hurtbox = fighter's vulnerable area (always active)
// Hitbox = attack's damage area (only during active frames)
```

**Collision rule**: AABB overlap between attacker's hitbox and defender's hurtbox triggers damage application.

**Source**: `src/game/sim/CombatSystem.ts`

---

## InputFrame

```typescript
type InputFrame = number;  // 16-bit unsigned integer

const INPUT_FLAGS = {
  LEFT:     0b00000001,  // bit 0
  RIGHT:    0b00000010,  // bit 1
  UP:       0b00000100,  // bit 2
  DOWN:     0b00001000,  // bit 3
  ATTACK1:  0b00010000,  // bit 4
  ATTACK2:  0b00100000,  // bit 5
  SPECIAL:  0b01000000,  // bit 6
  BLOCK:    0b10000000,  // bit 7
  // bits 8–15: reserved
} as const;
```

**Source**: `src/game/sim/InputFrame.ts`

---

## Physics Constants

```typescript
const FIGHTER_PHYSICS = {
  GRAVITY: number;        // Downward acceleration per tick
  FRICTION: number;       // Ground friction coefficient
  MAX_VX: number;         // Maximum horizontal velocity
  MAX_VY: number;         // Maximum vertical velocity (fall speed)
  WALK_SPEED: number;     // Horizontal velocity when walking
  RUN_SPEED: number;      // Horizontal velocity when running
  JUMP_FORCE: number;     // Initial upward velocity on jump
};
```

**Source**: `src/game/sim/FighterState.ts`

---

## Match Configuration

```typescript
interface MatchConfig {
  roundTime: number;            // Round duration in ms (default: 99000)
  maxRounds: number;            // Best-of-N (default: 3)
  p1InitialHealth: number;      // Starting health (default: 100)
  p2InitialHealth: number;      // Starting health (default: 100)
  difficultyScaling: boolean;   // Enable AI difficulty scaling (story mode)
}
```

**Source**: `src/game/state/GameState.ts`

---

## Entity Relationships

```
SimulationState
├── tick: number
├── matchState: MatchState
└── players[2]: PlayerState
    ├── position: Position
    ├── velocity: Velocity
    ├── health: number
    └── (extended in FighterRuntimeState with state machine, fighterId)

FighterRuntimeState uses:
├── FighterState enum (17 values)
├── AttackData (per attack type)
├── HitBox / HurtBox (AABB collision)
└── InputFrame (consumed each tick)
```
