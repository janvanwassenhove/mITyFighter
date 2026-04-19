# Research: Core Fighting Engine

**Feature**: 001-core-fighting-engine
**Date**: 2026-04-19 (retroactive)
**Status**: Decisions implemented

---

## ADR-001: Fixed Timestep Accumulator for Simulation

**Context**: Fighting games require frame-precise gameplay. Variable frame rates would cause different behavior on different hardware — unacceptable for competitive play and future netplay.

**Decision**: Use a fixed 60Hz timestep with an accumulator pattern. The render loop runs at the browser's refresh rate, but simulation ticks are always exactly 16.67ms apart.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Variable timestep (`delta * speed`) | Non-deterministic; position depends on frame rate |
| Locked render to 60fps | Wastes high-refresh displays; couples render to sim |
| Server-authoritative tick | No server exists yet; adds latency for local play |

**Consequences**: Render must interpolate between sim states for smooth visuals on >60Hz displays. Currently no interpolation is implemented — this is acceptable at 60fps but will need attention for 144Hz monitors.

**Reference**: `src/game/sim/FixedTimestepLoop.ts`

---

## ADR-002: Simulation Module Isolation (No Phaser in sim/)

**Context**: Future netplay requires rollback — rewinding game state and re-simulating with corrected inputs. This requires the simulation to run headlessly, without any rendering framework.

**Decision**: The `src/game/sim/` module has zero Phaser imports. It operates purely on InputFrames and produces SimulationState. Types are framework-agnostic.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Use Phaser physics (Arcade/Matter) | Tied to Phaser scene lifecycle; can't run headless |
| Abstract Phaser behind interface | Still a dependency; complicates testing |
| Separate npm package for sim | Over-engineering at this stage; directory boundary sufficient |

**Consequences**: Physics (gravity, friction, collision) must be hand-implemented. No access to Phaser's built-in collision detection. Worth it for determinism guarantee.

**Reference**: `src/game/sim/` (all 7 files), Constitution Article II

---

## ADR-003: 16-Bit Bitmask InputFrame

**Context**: Netplay and replay systems need compact, serializable input representation. Each tick captures the state of all player inputs.

**Decision**: 16-bit integer bitmask per player per tick. 8 bits used (LEFT, RIGHT, UP, DOWN, ATTACK1, ATTACK2, SPECIAL, BLOCK), 8 reserved.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| JSON object per tick | Too large for network; parsing overhead per tick |
| String encoding | Not compact; harder to manipulate |
| 8-bit (exact fit) | No room for future inputs (taunt, grab, etc.) |
| 32-bit | Overkill; wastes bandwidth for netplay |

**Consequences**: Adding new input actions (e.g., grab, taunt) requires only setting new bits — no structural change. Ring buffer stores frames efficiently for rollback.

**Reference**: `src/game/sim/InputFrame.ts`, `src/game/input/InputCapture.ts`

---

## ADR-004: Fighter State Machine (17 States)

**Context**: Fighting games need precise state tracking — a fighter can't attack while already in hitstun, can't block mid-jump, etc. State transitions must be explicit and deterministic.

**Decision**: Enum-based state machine with 17 states (IDLE, WALKING, RUNNING, JUMPING, CROUCHING, BLOCKING, ATTACK1–3, SPECIAL, HURT, HITSTUN, KNOCKDOWN, KO, INTRO, WIN, LOSE). Transitions governed by interruptibility rules.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Free-form animation-driven state | Non-deterministic; hard to reason about |
| Hierarchical state machine (HSM) | Added complexity not justified yet |
| Behavior tree | Better for AI, not core state tracking |

**Consequences**: Adding new states (e.g., GRAB, TECH) requires extending the enum and updating transition rules. Current 17 states cover the implemented feature set.

**Reference**: `src/game/sim/FighterState.ts`

---

## ADR-005: Hitbox/Hurtbox Combat Resolution

**Context**: Attacks need frame-precise collision detection. Each attack has startup frames (wind-up), active frames (can hit), and recovery frames (vulnerable).

**Decision**: AABB (axis-aligned bounding box) hitbox/hurtbox system. Attack data defines startup/active/recovery frame counts. Hitboxes only active during active frames. Damage applied on first overlap.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Distance-only (no boxes) | Imprecise; doesn't support varied attack ranges |
| Per-pixel collision | Too expensive at 60Hz for pixel art |
| Circle colliders | Less accurate for humanoid sprites |
| Manifest hitbox data | Data exists in packs but integration deferred (see TD-005) |

**Consequences**: Hitbox positions are currently code-defined, not data-driven from pack manifests. Pack manifests already include per-frame hitbox data — consuming this is a planned improvement.

**Reference**: `src/game/sim/CombatSystem.ts`

---

## ADR-006: Phaser 3 as Game Framework

**Context**: The game needs a 2D rendering engine with sprite animation, input handling, scene management, audio, and asset loading. Must run in the browser.

**Decision**: Phaser 3 — mature, well-documented, large community, built-in scene management, sprite animation, and audio.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Raw Canvas/WebGL | Too much boilerplate for scene/audio/input management |
| PixiJS | No built-in scene system, audio, or physics |
| Kaboom.js | Less mature; fewer features for complex games |
| Godot (web export) | Different language (GDScript); larger export size |
| Unity WebGL | Heavyweight; slow load times; C# not TypeScript |

**Consequences**: Locked to Phaser's scene lifecycle and rendering API. Simulation deliberately isolated from Phaser to avoid framework lock-in for the core game logic.

**Reference**: `package.json` (dependency), `src/game/config/gameConfig.ts`
