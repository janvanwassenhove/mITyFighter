# Implementation Plan: Story Mode

**Branch**: N/A (retroactive) | **Date**: 2026-04-19 | **Spec**: [spec.md](spec.md)

## Summary
A single-player story mode with procedurally generated fight sequences, difficulty-scaled AI opponents, continue system, and pre/post-fight narrative screens. The AI participates through the standard InputFrame pipeline, maintaining simulation determinism.

## Technical Context
**Language/Version**: TypeScript ^5.3 (strict mode)
**Primary Dependencies**: Phaser 3 ^3.70 (scenes, UI), sim/ module (FightingAI)
**Testing**: Vitest ^1.0
**Target Platform**: Browser (ES2020)
**Performance Goals**: AI decision at 60Hz with zero allocation
**Constraints**: AI must produce InputFrames (same as human); sim/ stays Phaser-free

## Constitution Check (Retroactive)

### Deterministic Simulation Gate (Article II) ✅
- [x] FightingAI lives in sim/ with zero Phaser imports
- [x] AI returns InputFrame — same type as human input
- [x] Same AIContext → same InputFrame (deterministic)

### Registry-Driven Gate (Article III) ⚠️ Partial
- [x] Fighter roster pulled from registry (no hardcoded fighter list)
- [ ] Story dialogue is NOT data-driven — generated inline (TD-003)
- [x] Boss ID has fallback chain (not hard-fail)

### Separation of Concerns Gate (Article VI) ✅
- [x] AI logic in sim/ (no Phaser)
- [x] Story state in state/ (no rendering)
- [x] Story UI in scenes/ (reads state, doesn't modify sim)

## Architecture

### Module Layout
```
src/game/state/
├── StoryModeState.ts         # Story generation, progression, continues
└── GameState.ts              # MatchConfig, FightState enums

src/game/sim/
└── FightingAI.ts             # Behavior AI, difficulty configs, InputFrame output

src/game/scenes/
├── StorySelectScene.ts       # Fighter picker (excludes boss)
├── DifficultySelectScene.ts  # easy/medium/hard/nightmare selector
├── StoryModeScene.ts         # Pre-fight, continue, game-over, victory screens
└── FightScene.ts             # Receives storyProgress + storyFights, runs AI
```

### Scene Flow
```
ModeSelectScene (STORY)
    │
    ▼
StorySelectScene ─── pick fighter ───► DifficultySelectScene ─── pick difficulty
    │                                                                │
    │                        ┌───────────────────────────────────────┘
    │                        ▼
    │               StoryModeScene
    │               ├── showPreFightScreen() ── "VS [Opponent]" ──► FIGHT button
    │               │       │
    │               │       ▼
    │               │   FightScene (with storyProgress, aiDifficulty)
    │               │       │
    │               │       ├── WIN  → advanceStory() → back to StoryModeScene
    │               │       └── LOSE → handleDefeat()
    │               │                   ├── continues > 0 → showContinueScreen()
    │               │                   └── continues = 0 → showGameOverScreen()
    │               │
    │               ├── showVictoryScreen() ── 🏆 CHAMPION 🏆 ── confetti
    │               └── showGameOverScreen() ── TRY AGAIN / MAIN MENU
    │
    └── ESC at any point → ModeSelectScene
```

### AI Integration in FightScene
```
FightScene.update(time, delta)
└── FixedTimestepLoop.update(delta)
    └── per tick:
        ├── P1 input: inputManager.captureFrame(0)  → InputFrame
        ├── P2 input: fightingAI.getInput(context)   → InputFrame  ← AI here
        └── CombatSystem.step(p1Input, p2Input)
```

### AI Decision Pipeline (per tick)
```
Build AIContext (distance, states, health ratios)
    │
    ▼
decideBehavior(context)
    ├── opponent jumping? → anti_air
    ├── opponent attacking? → defensive (block)
    ├── low health? → retreat
    ├── opponent low + self healthy? → pressure
    └── distance-based → approach / jump_attack / idle
    │
    ▼
behaviorToInput(behavior) → InputFrame bitmask
    ├── approach: set LEFT or RIGHT toward opponent
    ├── pressure: move toward + ATTACK1/ATTACK2
    ├── defensive: BLOCK + counter on opening
    └── etc.
```

## Key Technical Decisions

See [research.md](research.md) for full ADRs:
- **ADR-016**: Procedural story generation over static data
- **ADR-017**: Fixed 6-fight count per difficulty
- **ADR-018**: Continue system (MAX_CONTINUES = 3)
- **ADR-019**: AI as InputFrame generator (same pipeline as human)
- **ADR-020**: Behavior-based AI over decision trees
