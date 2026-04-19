# DevoxxFighter — Brownfield Analysis Report

**Date**: 2026-04-19  
**Methodology**: Spec-Driven Development (SDD) Brownfield Bootstrap  
**Analyst**: GitHub Copilot (spec-kit-guide)

---

## 1. Technology Stack

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Language | TypeScript | ^5.3 | Strict mode, all strict flags enabled |
| Framework | Phaser 3 | ^3.70 | 2D game framework, pixel-perfect config |
| Bundler | Vite | ^5.0 | ES module build, dev server on :3000 |
| Test Runner | Vitest | ^1.0 | Node environment, 5 test suites |
| Linter | ESLint | ^8.55 | Flat config, TS plugin, import ordering |
| Formatter | Prettier | ^3.1 | Integrated with ESLint |
| CI | GitHub Actions | — | Node 18.x + 20.x matrix, Pages deploy |
| Deployment | GitHub Pages | — | Multi-branch: main + DevoxxFighter |
| Asset Tools | Sharp + tsx | — | Sprite conversion CLI tools |

### Noteworthy TypeScript Configuration
- `noUncheckedIndexedAccess: true` — strictest indexed access
- `exactOptionalPropertyTypes: true` — strict optional props
- Path aliases: `@/`, `@game/`, `@assets/`
- Target: ES2020, Module: ESNext, Bundler resolution

---

## 2. Architecture

### Module Map (49 source files)

```
src/
├── main.ts                          # Entry point → GameApp
├── game/
│   ├── GameApp.ts                   # Phaser game orchestrator (13 scenes)
│   ├── config/     (3 files)        # Constants, Phaser config, themes
│   ├── assets/     (7 files)        # Pack loading, registries, validators
│   ├── scenes/     (13 files)       # All Phaser scenes
│   ├── sim/        (7 files)        # Deterministic simulation (NO Phaser)
│   ├── render/     (3 files)        # Fighter/background/debug rendering
│   ├── input/      (5 files)        # Keyboard, touch, bindings, capture
│   ├── audio/      (1 file)         # Audio manager with JSON registry
│   ├── ui/         (2 files)        # HealthBarUI, AnnouncerUI
│   ├── state/      (2 files)        # GameState enums, StoryModeState
│   └── utils/      (3 files)        # Logger, assert, types
tests/    (5 files)                   # Vitest unit tests
tools/    (2 files)                   # Asset conversion/validation CLI
```

### Layer Separation (Verified)

| Layer | Directory | Depends On | Free From |
|-------|-----------|-----------|-----------|
| Simulation | `sim/` | Nothing (pure logic) | Phaser, DOM, rendering |
| Input | `input/` | Phaser keyboard API | Simulation, rendering |
| Rendering | `render/` | Phaser, sim state | Input, game logic |
| Scenes | `scenes/` | All layers | — |
| Assets | `assets/` | Phaser loader | Simulation |

**Sim module purity confirmed**: Zero Phaser imports in all 7 `sim/` files.

### Data Flow
```
Keyboard → InputManager → InputFrame (bitmask) → FixedTimestepLoop → CombatSystem
                                                                          ↓
Canvas ← PixelFighterRenderer ← Phaser Sprites ← SimulationState (positions, health)
```

---

## 3. Conventions Discovered

### Naming
| Type | Convention | Enforced By |
|------|-----------|-------------|
| Fighter IDs | `snake_case` | Registry validation |
| Action IDs | `camelCase` | TypeScript type |
| Constants | `SCREAMING_SNAKE` | ESLint + convention |
| Classes | `PascalCase` | TypeScript convention |
| Source files | `PascalCase.ts` | Convention |
| Test files | `camelCase.test.ts` | Vitest glob |

### Code Patterns
- **Registry pattern**: All content referenced via typed registries, never hardcoded
- **Dynamic JSON loading**: Fighters, backgrounds, and audio loaded from JSON at boot time
- **Manifest-driven packs**: Each fighter is a self-contained folder with `manifest.json`
- **Bitmask input encoding**: 16-bit InputFrame for compact, serializable input state
- **Fixed timestep accumulator**: Standard game loop pattern for deterministic ticks
- **Theme system**: All UI colors fetched via `getActiveTheme()`, stored in localStorage
- **Scene data passing**: Phaser `scene.start(key, data)` for inter-scene communication

### Error Handling
- `logger.ts` with 4 levels (DEBUG, INFO, WARN, ERROR) — dev-mode toggle
- `assert.ts` for runtime assertions (throws in dev, logs in prod)
- ESLint enforces no raw `console.log` (warn level)

### Testing Pattern
- Pure unit tests in `tests/` — no integration or e2e
- Tests target `sim/` module (InputFrame, combat) and asset key generation
- No scene tests, no rendering tests (by design — Phaser is hard to unit test)

---

## 4. Feature Inventory

### Delivered Features (6 Retroactive Specs Created)

| # | Feature | Status | Spec |
|---|---------|--------|------|
| 001 | Core Fighting Engine | ✅ Delivered | `specs/001-core-fighting-engine/` |
| 002 | Pack-Based Asset System | ✅ Delivered | `specs/002-pack-asset-system/` |
| 003 | Character & Stage Selection | ✅ Delivered | `specs/003-character-stage-select/` |
| 004 | Story Mode | ✅ Delivered | `specs/004-story-mode/` |
| 005 | Input System | ✅ Delivered | `specs/005-input-system/` |
| 006 | Scene Flow & UI | ✅ Delivered | `specs/006-scene-flow-ui/` |

### Content Inventory
- **20 fighters** loaded from packs (each with 13–16 actions, 4 profile pics)
- **15+ backgrounds** (image, video, and GIF types)
- **Audio categories**: Announcer, impact, music, UI, SFX
- **2 themes**: Classic, Devoxx France 2026

### Planned (Not Yet Implemented)
- **Netplay/Rollback**: Foundation laid (deterministic sim, InputFrame buffer), no network code yet
- **Frame data system**: Types defined in `SimTypes.ts`, not yet consumed in combat
- **Combo animations**: ComboInput detector exists, but combos don't trigger unique moves

---

## 5. Technical Debt Register

| ID | Category | Description | Severity | Location |
|----|----------|-------------|----------|----------|
| TD-001 | Documentation | `docs/ASSETS.md` references `src/assets/sprites/` but actual system uses `public/packs/` | Medium | `docs/ASSETS.md` |
| TD-002 | Test Coverage | Only 5 test suites; scenes, rendering, audio, and story mode untested | High | `tests/` |
| TD-003 | Data-Driven Content | Story dialogue hardcoded in `StoryModeState.ts` | Low | `src/game/state/` |
| TD-004 | Balance | AI difficulty levels and attack frame data untuned | Medium | `sim/FightingAI.ts`, `sim/CombatSystem.ts` |
| TD-005 | Hitbox Data | Pack manifests contain hitbox data per frame but it's not consumed | Low | `PackTypes.ts`, `CombatSystem.ts` |
| TD-006 | Round Timer | 99-second timer defined but not enforced in all modes | Low | `GameState.ts`, `FightScene.ts` |

---

## 6. Quality Gates (Already in Place)

| Gate | Command | CI-Enforced | Status |
|------|---------|:-----------:|--------|
| Lint | `npm run lint` | ✅ | Active |
| Type Check | `npm run typecheck` | ✅ | Active |
| Unit Tests | `npm run test` | ✅ | Active |
| Asset Validation | `npm run validate:assets` | ✅ | Active |
| Production Build | `npm run build` | ✅ | Active |

CI runs on Node 18.x and 20.x for every PR to `main`.

---

## 7. Recommendations

### Immediate (Before Next Feature)
1. **Fix docs/ASSETS.md** to reflect the actual pack-based asset system (TD-001)
2. **Increase test coverage** — add at least simulation integration tests (TD-002)

### Short-Term
3. **Consume hitbox data from manifests** in CombatSystem (TD-005)
4. **Externalize story dialogue** to JSON data files (TD-003)
5. **Add round timer enforcement** in FightScene (TD-006)

### Medium-Term
6. **Balance pass** on AI difficulty and attack frame data (TD-004)
7. **Add e2e simulation tests** — run headless fights and verify determinism

### Go-Forward Workflow
All new features should follow the full SDD lifecycle:
```
/speckit.specify → /speckit.clarify → /speckit.plan → /speckit.tasks → /speckit.implement
```

---

## 8. Spec-Kit Artifacts Created

```
.specify/
├── init-options.json                    # Brownfield bootstrap config
├── feature.json                         # Active feature tracking
├── extensions.yml                       # Extension registry
├── memory/
│   └── constitution.md                  # 9 articles + constraints + governance
├── templates/
│   ├── constitution-template.md         # Template for new constitutions
│   ├── spec-template.md                # Template for feature specs
│   ├── plan-template.md                # Template for implementation plans
│   ├── tasks-template.md               # Template for task breakdowns
│   └── checklist-template.md           # Template for quality checklists
├── scripts/
│   └── validate-artifacts.sh           # Artifact consistency checker
└── specs/
    ├── brownfield-analysis.md           # This report
    ├── 001-core-fighting-engine/
    │   ├── spec.md                      # Deterministic sim, combat, rounds
    │   ├── plan.md                      # Architecture + constitution gates
    │   ├── research.md                  # ADR-001 to ADR-006
    │   └── data-model.md               # SimState, FighterState, InputFrame, etc.
    ├── 002-pack-asset-system/
    │   ├── spec.md                      # Dynamic loading, registries, packs
    │   ├── plan.md                      # Loading sequence + module layout
    │   ├── research.md                  # ADR-007 to ADR-011
    │   └── data-model.md               # Manifest, registry, key patterns
    ├── 003-character-stage-select/
    │   ├── spec.md                      # MK-style selection screens
    │   ├── plan.md                      # Grid layout, cursors, stage carousel
    │   └── research.md                  # ADR-027 to ADR-029
    ├── 004-story-mode/
    │   ├── spec.md                      # Story progression, AI, difficulty
    │   ├── plan.md                      # Scene flow, AI integration
    │   ├── research.md                  # ADR-016 to ADR-020
    │   └── data-model.md               # StoryProgress, StoryFight, AI configs
    ├── 005-input-system/
    │   ├── spec.md                      # Dual-player input, bitmask, touch
    │   ├── plan.md                      # Input flow + binding architecture
    │   └── research.md                  # ADR-012 to ADR-015
    └── 006-scene-flow-ui/
        ├── spec.md                      # 13 scenes, themes, HUD, navigation
        ├── plan.md                      # Scene graph, theme arch, HUD layout
        └── research.md                  # ADR-021 to ADR-026
```

### ADR Index (Architecture Decision Records)

| ADR | Decision | Feature | File |
|-----|----------|---------|------|
| ADR-001 | Fixed timestep accumulator | 001 | research.md |
| ADR-002 | Sim module isolation (no Phaser) | 001 | research.md |
| ADR-003 | 16-bit bitmask InputFrame | 001 | research.md |
| ADR-004 | 17-state fighter state machine | 001 | research.md |
| ADR-005 | AABB hitbox/hurtbox combat | 001 | research.md |
| ADR-006 | Phaser 3 as game framework | 001 | research.md |
| ADR-007 | Pack-based content architecture | 002 | research.md |
| ADR-008 | JSON registries for all content | 002 | research.md |
| ADR-009 | Manifest-driven animation timing | 002 | research.md |
| ADR-010 | Action folder→ActionId mapping | 002 | research.md |
| ADR-011 | Auto-detected frame counts | 002 | research.md |
| ADR-012 | Split keyboard zones (anti-ghosting) | 005 | research.md |
| ADR-013 | Bitmask input over objects | 005 | research.md |
| ADR-014 | AZERTY auto-detection | 005 | research.md |
| ADR-015 | Input ring buffer for rollback | 005 | research.md |
| ADR-016 | Procedural story generation | 004 | research.md |
| ADR-017 | Fixed 6-fight count per difficulty | 004 | research.md |
| ADR-018 | Continue system (MAX_CONTINUES=3) | 004 | research.md |
| ADR-019 | AI as InputFrame generator | 004 | research.md |
| ADR-020 | Behavior-based AI over decision trees | 004 | research.md |
| ADR-021 | 13 pre-registered Phaser scenes | 006 | research.md |
| ADR-022 | Scene data passing via init() | 006 | research.md |
| ADR-023 | Theme system with localStorage | 006 | research.md |
| ADR-024 | ESC as universal back navigation | 006 | research.md |
| ADR-025 | DOM-based background rendering | 006 | research.md |
| ADR-026 | Tab-based settings UI | 006 | research.md |
| ADR-027 | Grid-based character select (MK) | 003 | research.md |
| ADR-028 | Dual independent cursors | 003 | research.md |
| ADR-029 | Full-screen stage preview (DOM) | 003 | research.md |
