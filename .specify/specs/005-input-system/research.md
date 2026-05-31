# Research: Input System

**Feature**: 005-input-system
**Date**: 2026-04-19 (retroactive)
**Status**: Decisions implemented

---

## ADR-012: Split Keyboard Zones (Anti-Ghosting)

**Context**: Two players share one keyboard. Most keyboards have ghosting limitations where certain 3+ key combinations in the same matrix row/column fail to register. This breaks simultaneous play.

**Decision**: Players use completely separate keyboard regions — P1 on the left (WASD zone), P2 on the right (arrows + numpad). These zones are physically distant enough that ghosting between them is effectively zero on standard keyboards.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Gamepad-only multiplayer | Not all players have gamepads; keyboard is universal |
| Single-zone with conflict detection | Complex; still fails on cheap keyboards |
| Polling instead of events | Higher CPU; doesn't solve hardware ghosting |

**Consequences**: P2 bindings differ based on hardware (numpad vs. no-numpad). AZERTY layouts require remapped P1 bindings. Both handled via `KeyboardLayout.ts` detection.

**Reference**: `src/game/input/InputBindings.ts`, `docs/INPUT.md`

---

## ADR-013: Bitmask Input Over Structured Objects

**Context**: The simulation needs compact, serializable input representation for each tick. This must be efficient for both local play (60 captures/second) and future netplay (sending over network).

**Decision**: 16-bit integer bitmask. Each input action is a single bit. Bitwise operations (`|`, `&`, `~`) for set/clear/test — zero allocation per tick.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| `{ left: bool, right: bool, ... }` objects | GC pressure from 60 allocations/sec × 2 players |
| TypedArray (Uint8Array) | Over-engineered for 8 flags; harder to serialize as single value |
| String encoding (`"LRUD"`) | Parsing overhead; not directly comparable |

**Consequences**: Extremely compact (2 bytes per player per tick). Easy to send over network. Easy to store in replay buffer. Adding new inputs = new bit flags (8 reserved bits available).

**Reference**: `src/game/sim/InputFrame.ts`, ADR-003

---

## ADR-014: AZERTY Auto-Detection

**Context**: DevoxxFighter targets Devoxx France — many attendees use AZERTY keyboards where WASD maps to ZQSD physically.

**Decision**: Auto-detect layout using `navigator.keyboard.getLayoutMap()` API. Falls back to browser language heuristic (`navigator.language` starting with `fr`). Caches result for session.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Manual layout selection only | Bad UX; most users won't find the setting |
| Always show rebind prompt | Interrupts flow; annoying for QWERTY users |
| Ignore AZERTY | Alienates French audience at a French conference |

**Consequences**: `navigator.keyboard` API has limited browser support (Chrome/Edge only). Fallback heuristic works but isn't perfect. User can always manually rebind in Settings.

**Reference**: `src/game/input/KeyboardLayout.ts`

---

## ADR-015: Input Ring Buffer for Rollback

**Context**: Future netplay rollback needs to replay N ticks of input history. Local play benefits from input recording for debugging and replays.

**Decision**: `InputCapture.ts` implements a ring buffer storing recent InputFrames with tick numbers. Fixed capacity, overwrites oldest when full.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Unlimited array | Memory grows unbounded in long sessions |
| No buffer (live only) | Can't support rollback or replay |
| External recording file | Too slow for per-tick capture at 60Hz |

**Consequences**: Buffer capacity must be tuned for netplay (typically 7–10 frames of rollback). Currently used for debugging; netplay integration is Phase 2 (see NETPLAY_ROADMAP.md).

**Reference**: `src/game/input/InputCapture.ts`, `docs/NETPLAY_ROADMAP.md`
