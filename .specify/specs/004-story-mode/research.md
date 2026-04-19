# Research: Story Mode

**Feature**: 004-story-mode
**Date**: 2026-04-19 (retroactive)
**Status**: Decisions implemented

---

## ADR-016: Procedural Story Generation Over Static Data

**Context**: Story mode needs a sequence of fights per character, but creating hand-crafted storylines for 20 fighters is impractical. The system needs to feel varied without authoring N×M fight permutations.

**Decision**: `generateStoryFights()` procedurally creates a fight sequence: shuffle available fighters, assign escalating difficulty levels, pick random stages, and generate dialogue dynamically using fighter display names. The boss is always `elder_honkstorm` with a fallback chain (random fighter → mirror match).

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Hand-authored story per fighter | 20 fighters × 5–10 fights = too much content to maintain |
| JSON-driven story scripts | Added file management without enough benefit for procedural content |
| Fully random (no structure) | No sense of progression; boss fight wouldn't feel climactic |

**Consequences**: Every playthrough has different opponents in different order. Dialogue is generic ("You face [Name]!") rather than character-specific. Upgrading to data-driven dialogue is a planned improvement (TD-003).

**Reference**: `src/game/state/StoryModeState.ts`

---

## ADR-017: Fixed Fight Count Per Difficulty

**Context**: Story mode needs to feel appropriately challenging at each difficulty tier while remaining completable in a demo/conference setting.

**Decision**: Fight count is fixed per difficulty: 6 fights for all difficulties (5 regular + 1 boss). The difficulty progression within those 6 fights escalates: easy→easy→medium→medium→hard→nightmare(boss). Higher story difficulty shifts the entire curve up.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Same fight count, only AI changes | No feeling of escalation within a run |
| Variable count (3–10 based on difficulty) | Hard to balance; nightmare runs too long for events |
| Endless/survival mode | Different feature; story needs a clear endpoint |

**Consequences**: All runs are 6 fights long, keeping sessions predictable (~10–20 minutes). Boss is always the hardest difficulty regardless of story difficulty setting.

**Reference**: `src/game/state/StoryModeState.ts`

---

## ADR-018: Continue System with Limited Retries

**Context**: Players at a conference booth may be new to fighting games. Permadeath after one loss would frustrate casual players. Unlimited continues would remove all tension.

**Decision**: 3 continues (MAX_CONTINUES = 3). On defeat, the player retries the same fight without losing progress. When continues run out, it's game over with a stats screen and "Try Again" option that restarts the full story.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Unlimited continues | No stakes; devalues victory |
| Zero continues (arcade permadeath) | Too punishing for casual/demo settings |
| Scaling continues by difficulty | Added complexity; 3 is a well-known arcade convention |

**Consequences**: Casual players can complete Easy mode with 3 continues. Nightmare mode genuinely challenges even with continues. The 10-second auto-continue timer in StoryModeScene keeps the pace.

**Reference**: `src/game/state/StoryModeState.ts`, `src/game/scenes/StoryModeScene.ts`

---

## ADR-019: AI as InputFrame Generator

**Context**: The AI opponent needs to participate in the same deterministic simulation as human players. AI decisions must go through the same InputFrame pipeline.

**Decision**: `FightingAI.getInput()` returns an `InputFrame` (16-bit bitmask) — the exact same type a human player produces. FightScene calls `p2AI.getInput(context)` instead of `inputManager.captureFrame(1)` when in 1P/Story mode. The simulation doesn't know or care whether inputs are human or AI.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Direct state manipulation (AI sets fighter position/state) | Breaks determinism; bypasses physics and combat rules |
| Separate AI sim step | Different code paths for AI vs human; hard to balance |
| Script/replay playback | Not reactive; can't adapt to player behavior |

**Consequences**: AI is perfectly deterministic — same context → same InputFrame. This means AI fights can be replayed and predicted. AI balance is tuned through `DifficultyConfig` parameters (reaction frames, optimal chance, aggression, etc.), not special-cased logic.

**Reference**: `src/game/sim/FightingAI.ts`, `src/game/scenes/FightScene.ts`

---

## ADR-020: Behavior-Based AI Over Decision Trees

**Context**: The AI needs to feel like a fighting game opponent, not a random button masher. Different difficulty levels should exhibit qualitatively different playstyles.

**Decision**: Behavior state machine with 7 patterns (approach, retreat, pressure, defensive, jump_attack, anti_air, idle). Decision priority chain evaluates context (distance, opponent state, health ratios) to pick a behavior. Each behavior translates to specific InputFrame bits. Difficulty configs control reaction speed, optimal decision probability, block chance, and aggression.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Pure random inputs | Feels dumb; no challenge on any difficulty |
| MCTS/tree search | Too complex; performance overhead at 60Hz |
| Scripted sequences | Predictable; easy to exploit once learned |
| Neural network | Training data needed; non-deterministic weights |

**Consequences**: AI feels natural at each tier — easy AI is sluggish and reactive, nightmare AI reads and punishes. Combo system (3-step: ATTACK1 → forward+ATTACK2 → SPECIAL) gives the AI recognizable patterns. Balance tuning is pure config change.

**Reference**: `src/game/sim/FightingAI.ts`
