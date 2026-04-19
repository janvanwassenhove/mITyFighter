# Implementation Plan: Core Fighting Engine

**Branch**: N/A (retroactive) | **Date**: 2026-04-19 | **Spec**: [spec.md](spec.md)

## Summary
A deterministic 2D fighting engine with fixed 60Hz simulation, hitbox/hurtbox combat, 17-state fighter state machine, and round management. Simulation runs independently of Phaser rendering for future netplay capability.

## Technical Context
**Language/Version**: TypeScript ^5.3 (strict mode)
**Primary Dependencies**: Phaser 3 ^3.70 (rendering only; sim is Phaser-free)
**Bundler**: Vite ^5.0
**Testing**: Vitest ^1.0
**Target Platform**: Browser (ES2020)
**Project Type**: 2D pixel fighting game
**Performance Goals**: 60 FPS render, 60Hz deterministic simulation tick
**Constraints**: No Phaser in sim/; integer positions; pixel-perfect rendering

## Constitution Check (Retroactive)

### Deterministic Simulation Gate (Article II) ✅
- [x] sim/ has zero Phaser imports — verified
- [x] Fixed timestep at 60Hz — `FixedTimestepLoop.ts`
- [x] Identical inputs produce identical outputs — integer math, no floats

### Separation of Concerns Gate (Article VI) ✅
- [x] Input layer: `InputManager` → `InputFrame` bitmask
- [x] Simulation layer: `FixedTimestepLoop` → `CombatSystem` → `FighterState`
- [x] Render layer: `PixelFighterRenderer` reads state, never writes

### Quality Gates Gate (Article VII) ✅
- [x] lint, test, validate:assets, build — CI enforced

## Architecture

### Module Layout
```
src/game/sim/                    # Pure deterministic logic
├── SimTypes.ts                  # Core types (Position, PlayerState, SimulationState)
├── FighterState.ts              # 17-state enum + physics constants + transition rules
├── InputFrame.ts                # 16-bit bitmask + pack/unpack utilities
├── CombatSystem.ts              # Hitbox/hurtbox resolution + damage + hitstun
├── ComboInput.ts                # Combo detection (12 combo types)
├── FixedTimestepLoop.ts         # 60Hz accumulator pattern
└── FightingAI.ts                # CPU opponent (4 difficulty levels)

src/game/render/
├── PixelFighterRenderer.ts      # Sprite animation from sim state
├── BackgroundRenderer.ts        # Stage rendering
└── DebugOverlay.ts              # F1 debug display

src/game/scenes/
└── FightScene.ts                # Orchestrates sim + render + UI

src/game/ui/
├── HealthBarUI.ts               # Dual health bars + round indicators
└── AnnouncerUI.ts               # "FIGHT!" / "KO!" text announcements
```

### Data Flow Per Frame
```
1. Browser requestAnimationFrame(delta)
2. FightScene.update(time, delta)
3. FixedTimestepLoop.update(delta)
   └── While accumulator >= 16.67ms:
       a. InputManager.captureFrame(P1) → InputFrame
       b. InputManager.captureFrame(P2) → InputFrame (or FightingAI.decide())
       c. CombatSystem.updateFighter(P1, P1input)
       d. CombatSystem.updateFighter(P2, P2input)
       e. CombatSystem.resolveCombat(P1, P2)
       f. tick++; accumulator -= 16.67ms
4. PixelFighterRenderer.render(P1state, P2state)
5. HealthBarUI.update(P1health, P2health)
6. FightScene checks for KO / round end
```

### Fight State Machine (Scene-Level)
```
COUNTDOWN → FIGHT_ANNOUNCE → ACTIVE → KO → RESULT → (next round or MATCH_END)
```

## Key Technical Decisions

See [research.md](research.md) for full ADRs:
- **ADR-001**: Fixed timestep accumulator (not variable delta)
- **ADR-002**: Sim module isolation (no Phaser in sim/)
- **ADR-003**: 16-bit bitmask InputFrame
- **ADR-004**: Enum-based 17-state fighter state machine
- **ADR-005**: AABB hitbox/hurtbox combat resolution
- **ADR-006**: Phaser 3 as game framework
