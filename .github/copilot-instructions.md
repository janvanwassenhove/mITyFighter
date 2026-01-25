# GitHub Copilot Instructions for mITyFighter

> These instructions guide Copilot's behavior when assisting with this project.

## Project Overview

mITyFighter is a **pixel-art 2D fighting game** built with:
- **TypeScript** (strict mode)
- **Phaser 3** (game framework)
- **Vite** (build tool)
- **Vitest** (testing)

## Critical: Documentation-First Workflow

**ALWAYS read and follow `docs/SPEC_KIT.md` before making any code changes.**

### Before ANY Code Change

1. **Update relevant documentation FIRST**:
   - `docs/ASSETS.md` → fighters, backgrounds
   - `docs/ANIMATIONS.md` → actions, frame rates
   - `docs/INPUT.md` → controls, key bindings
   - `docs/ARCHITECTURE.md` → modules, systems
   - `docs/DESIGN_KIT.md` → visual/UI elements
   - `docs/EXTENSIBILITY.md` → adding new content

2. **Keep registries in sync**:
   - `src/game/assets/fighterRegistry.ts` must match actual sprite folders
   - `src/game/assets/backgroundRegistry.ts` must match actual background files

3. **Include test updates** in the same change set

4. **Validate changes** pass all checks before marking complete

## Code Conventions

### File Structure
```
src/
  main.ts              # Entry point
  game/
    config/            # Game configuration
    assets/            # Asset loading and registries
    scenes/            # Phaser scenes
    sim/               # Deterministic simulation (NO Phaser deps)
    render/            # Rendering systems
    input/             # Input handling
    ui/                # UI components
    state/             # Game state
    utils/             # Utilities
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Fighter ID | `snake_case` | `'ninja_monk'` |
| Action ID | `camelCase` | `'attack1'` |
| Constants | `SCREAMING_SNAKE_CASE` | `FRAME_WIDTH` |
| Classes | `PascalCase` | `InputManager` |
| Functions | `camelCase` | `getFighterTextureKey()` |
| Source files | `PascalCase.ts` | `FightScene.ts` |
| Test files | `camelCase.test.ts` | `inputFrame.test.ts` |

### File Headers

Key source files should include:
```typescript
/**
 * @fileoverview [Description]
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 */
```

## Asset Specifications

### Sprite Strips
- **Frame size**: 128×128 pixels (fixed)
- **Layout**: Horizontal strip (left-to-right)
- **Format**: PNG with transparency
- **Scale**: 2x display (renders at 256×256)

### Canvas
- **Resolution**: 1280×720 (16:9)
- **Ground Y**: 620px (`GAME_HEIGHT - GROUND_OFFSET`)
- **Rendering**: Pixel-perfect (`pixelArt: true`, `roundPixels: true`)

### Animation Frame Rates
| Category | FPS |
|----------|-----|
| Idle | 8 |
| Walk | 10 |
| Run, Jump | 12 |
| Combat | 15 |
| Default | 10 |

## Simulation Rules

The `src/game/sim/` module MUST:
- Be **deterministic** (same inputs → same outputs)
- Have **NO Phaser dependencies**
- Support **headless execution** (for netplay)
- Run at **60 ticks/second**

## Quick Reference: Task → Doc Updates

| Task | Documentation | Code |
|------|---------------|------|
| Add fighter | ASSETS.md, EXTENSIBILITY.md | fighterRegistry.ts |
| Add background | ASSETS.md, EXTENSIBILITY.md | backgroundRegistry.ts |
| Add action | ANIMATIONS.md | AssetKeys.ts, registry |
| Change controls | INPUT.md | InputBindings.ts |
| Add module | ARCHITECTURE.md | Source files |
| Add UI element | DESIGN_KIT.md | Scene/UI files |

## Validation Commands

Always run these before completing a task:
```bash
npm run validate:assets   # Sprite dimensions, registry sync
npm run lint              # ESLint + Prettier
npm run test              # Vitest unit tests
npm run build             # TypeScript compilation
```

## Things to Avoid

- ❌ Modifying code without updating docs first
- ❌ Hardcoding frame counts (auto-detect from texture width)
- ❌ Adding Phaser dependencies to `sim/` module
- ❌ Using antialiasing or smooth scaling on sprites
- ❌ Forgetting to update registries when adding assets
- ❌ Skipping validation checks

## Testing Requirements

- New registry entries → validation tests
- New input bindings → InputFrame tests
- New asset conventions → key generation tests
- All tests must pass before merging

## Reference Documentation

Read these for detailed specifications:
- [SPEC_KIT.md](../docs/SPEC_KIT.md) - Development contract
- [DESIGN_KIT.md](../docs/DESIGN_KIT.md) - Visual/UI standards
- [ASSETS.md](../docs/ASSETS.md) - Asset conventions
- [ANIMATIONS.md](../docs/ANIMATIONS.md) - Animation system
- [INPUT.md](../docs/INPUT.md) - Input handling
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [EXTENSIBILITY.md](../docs/EXTENSIBILITY.md) - Adding content
