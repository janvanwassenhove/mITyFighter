# Feature Specification: Core Fighting Engine

**Status**: Delivered
**Reverse-Engineered**: 2026-04-19
**Source**: `src/game/sim/`, `src/game/render/`, `src/game/scenes/FightScene.ts`

## User Scenarios & Testing

### User Story 1 — Two Players Fight Locally (Priority: P1)
Two players share a keyboard and engage in a real-time 2D fighting match. Each player controls a fighter with movement (walk, run, jump, crouch), attacks (punch, kick, special), and blocking. The match proceeds through rounds until one player wins the required number of rounds.

**Why this priority**: This is the core gameplay loop — without it, there is no game.
**Independent Test**: Launch FightScene with two fighters, verify both respond to inputs and combat resolves.

**Acceptance Scenarios**:
1. **Given** two fighters on screen, **When** P1 presses attack, **Then** the fighter plays the attack animation and a hitbox is active during startup/active frames
2. **Given** P1's attack hitbox overlaps P2's hurtbox, **When** the attack connects, **Then** P2 takes damage, enters hitstun, and health bar decreases
3. **Given** P2 is blocking, **When** P1's attack connects, **Then** damage is reduced and P2 stays standing
4. **Given** a fighter's health reaches zero, **When** KO is triggered, **Then** the round ends with announcer "KO!" and the winner gets a round point

### User Story 2 — Deterministic Simulation (Priority: P1)
The fight simulation runs at a fixed 60Hz tick rate, independent of rendering frame rate. Given identical InputFrame sequences, the simulation produces identical results every time.

**Why this priority**: Foundation for netplay, replays, and testability.
**Independent Test**: Feed identical InputFrame sequences into the simulation headlessly, verify identical final states.

**Acceptance Scenarios**:
1. **Given** a fixed timestep loop at 60Hz, **When** variable render deltas occur, **Then** the simulation always ticks at 16.67ms intervals
2. **Given** two runs with identical InputFrame sequences, **When** both complete, **Then** final positions, health, and states are identical

### User Story 3 — Round System (Priority: P2)
Matches consist of multiple rounds (best of 3 by default). Round wins are tracked and displayed. The match ends when one player wins the majority of rounds.

**Acceptance Scenarios**:
1. **Given** a best-of-3 match, **When** P1 wins 2 rounds, **Then** the match ends with P1 as the winner
2. **Given** a round ends, **When** the next round starts, **Then** both fighters' health is restored and positions reset

## Requirements (As Implemented)

### Functional Requirements
- **FR-001**: System runs simulation at fixed 60Hz tick rate via accumulator pattern — `FixedTimestepLoop.ts`
- **FR-002**: Inputs encoded as 16-bit bitmask per player per tick — `InputFrame.ts`
- **FR-003**: Combat resolution with hitbox/hurtbox collision detection — `CombatSystem.ts`
- **FR-004**: Fighter state machine with 17 states (IDLE → ATTACK → HITSTUN → etc.) — `FighterState.ts`
- **FR-005**: Attack frame data with startup/active/recovery phases — `CombatSystem.ts`
- **FR-006**: Health tracking, damage application, KO detection — `CombatSystem.ts`, `FightScene.ts`
- **FR-007**: Round management (countdown → fight → KO → result → next round) — `FightScene.ts`
- **FR-008**: Health bar UI with animated drain and round indicators — `HealthBarUI.ts`
- **FR-009**: Announcer UI with "FIGHT!", "KO!", winner text — `AnnouncerUI.ts`

## Known Issues & Technical Debt
- **[KNOWN ISSUE]**: No round timer enforcement (99-second timer defined but not active in all modes)
- **[KNOWN ISSUE]**: Combo system exists (`ComboInput.ts`) but combo moves don't trigger distinct animations/damage yet
- **[KNOWN ISSUE]**: Frame data (startup/active/recovery) is defined but balance tuning is unverified

## Implementation Notes
- Primary modules: `src/game/sim/` (all 7 files), `src/game/render/PixelFighterRenderer.ts`, `src/game/scenes/FightScene.ts`
- Data model: `SimulationState` (tick, players[]), `FighterRuntimeState` (x, y, vx, vy, health, state, stateFrames)
- Physics: Gravity, friction, max velocity constants in `FighterState.ts`
