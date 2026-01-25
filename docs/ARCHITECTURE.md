# Architecture

> **Spec-Kit Document** - Update this when adding or modifying modules.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Phaser 3                          │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │    │
│  │  │ BootScene │→ │ Preload   │→ │ Playground│       │    │
│  │  └───────────┘  │ Scene     │  │ Scene     │       │    │
│  │                 └───────────┘  └─────┬─────┘       │    │
│  └──────────────────────────────────────┼──────────────┘    │
│                                         │                    │
│  ┌──────────────────────────────────────┼──────────────┐    │
│  │              Game Application        │              │    │
│  │  ┌─────────────┐  ┌─────────────────┴───────────┐  │    │
│  │  │   Input     │  │         Render              │  │    │
│  │  │   Manager   │  │  ┌─────────┐ ┌───────────┐  │  │    │
│  │  └──────┬──────┘  │  │ Fighter │ │ Background│  │  │    │
│  │         │         │  │ Renderer│ │ Renderer  │  │  │    │
│  │         │         │  └─────────┘ └───────────┘  │  │    │
│  │         │         │  ┌─────────────────────────┐│  │    │
│  │         │         │  │    Debug Overlay        ││  │    │
│  │         │         │  └─────────────────────────┘│  │    │
│  │         │         └─────────────────────────────┘  │    │
│  │         │                        ▲                 │    │
│  │         │         ┌──────────────┴──────────────┐  │    │
│  │         └────────►│      Simulation (sim/)      │  │    │
│  │                   │  ┌─────────────────────────┐│  │    │
│  │                   │  │  Fixed Timestep Loop    ││  │    │
│  │                   │  │  InputFrame Processing  ││  │    │
│  │                   │  │  Game State             ││  │    │
│  │                   │  └─────────────────────────┘│  │    │
│  │                   └─────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### `src/main.ts`
Entry point. Creates Phaser game instance with configuration.

### `src/game/GameApp.ts`
Application orchestrator. Manages global state and module initialization.

### `src/game/config/`

| File | Purpose |
|------|---------|
| `gameConfig.ts` | Phaser configuration, input settings |
| `constants.ts` | Game constants, frame rates, dimensions |

### `src/game/sim/` (Deterministic Simulation)

**Critical**: This module MUST NOT depend on Phaser or any rendering code.

| File | Purpose |
|------|---------|
| `FixedTimestepLoop.ts` | 60Hz tick accumulator |
| `InputFrame.ts` | Bitmask input representation |
| `SimTypes.ts` | Type definitions for simulation state |

**Why separate?**
- Can run headless for netplay prediction
- Deterministic = same inputs → same outputs
- No render dependencies = faster rollback

### `src/game/assets/`

| File | Purpose |
|------|---------|
| `fighterRegistry.ts` | Fighter metadata and action mappings |
| `backgroundRegistry.ts` | Background metadata |
| `AssetKeys.ts` | Key generation utilities |
| `FighterAssets.ts` | Fighter loading logic |
| `BackgroundAssets.ts` | Background loading logic |
| `validators/validateAssets.ts` | Asset validation utilities |

### `src/game/scenes/`

| Scene | Purpose | Next Scene |
|-------|---------|------------|
| `BootScene` | Minimal setup, show loading indicator | PreloadScene |
| `PreloadScene` | Load all assets, create animations | TitleScene |
| `TitleScene` | Main title screen with start menu | ModeSelectScene, SettingsScene, AboutScene |
| `ModeSelectScene` | Choose game mode (1P, 2P, Story) | CharacterSelectScene, StorySelectScene |
| `CharacterSelectScene` | Fighter selection | StageSelectScene |
| `StageSelectScene` | Background/stage selection | FightScene |
| `FightScene` | Main fighting gameplay | ModeSelectScene |
| `StorySelectScene` | Story mode character selection | DifficultySelectScene |
| `DifficultySelectScene` | Story difficulty selection | StoryModeScene |
| `StoryModeScene` | Story mode progression | FightScene |
| `SettingsScene` | Configure controls and options | TitleScene |
| `AboutScene` | Credits and game information | TitleScene |
| `PlaygroundScene` | 2-player testing environment | - |

### `src/game/render/`

**Note**: Render modules depend on simulation state but don't modify it.

| File | Purpose |
|------|---------|
| `PixelFighterRenderer.ts` | Fighter sprite rendering, animation |
| `BackgroundRenderer.ts` | Background rendering |
| `DebugOverlay.ts` | Debug information display |

### `src/game/input/`

| File | Purpose |
|------|---------|
| `InputBindings.ts` | Key-to-action mappings per player |
| `InputManager.ts` | Input state tracking |
| `InputCapture.ts` | InputFrame generation |

### `src/game/utils/`

| File | Purpose |
|------|---------|
| `logger.ts` | Structured logging |
| `assert.ts` | Runtime assertions |
| `types.ts` | Shared type definitions |

### `tools/`

| File | Purpose |
|------|---------|
| `validate-assets.ts` | CLI asset validation |

### `tests/`

Unit tests using Vitest.

## Data Flow

### Input → Simulation → Render

```
┌──────────┐    ┌──────────────┐    ┌────────────┐    ┌──────────┐
│ Keyboard │───►│ InputManager │───►│ InputFrame │───►│ Sim Step │
└──────────┘    └──────────────┘    └────────────┘    └────┬─────┘
                                                           │
                                                           ▼
┌──────────┐    ┌──────────────┐    ┌────────────┐    ┌──────────┐
│  Canvas  │◄───│   Renderer   │◄───│ Sim State  │◄───│ Position │
└──────────┘    └──────────────┘    └────────────┘    └──────────┘
```

### Asset Loading Flow

```
┌──────────┐    ┌──────────────┐    ┌────────────┐
│ Registry │───►│ PreloadScene │───►│ Texture    │
│ (static) │    │ (load)       │    │ Cache      │
└──────────┘    └──────────────┘    └─────┬──────┘
                                          │
                                          ▼
                                    ┌────────────┐
                                    │ Animation  │
                                    │ Manager    │
                                    └────────────┘
```

## Key Design Decisions

### 1. Typed Registries

```typescript
// Fighter IDs derived from registry keys
type FighterId = keyof typeof FIGHTER_REGISTRY;

// Compile-time safety for asset references
const textureKey = getTextureKey('kunoichi', 'idle'); // Type-checked
```

### 2. Auto-Detected Frame Counts

```typescript
// Frame count computed from loaded texture
const frameCount = texture.source[0].width / FRAME_WIDTH;
```

No hardcoded counts = less maintenance, fewer bugs.

### 3. Separation of Concerns

| Layer | Knows About | Doesn't Know About |
|-------|-------------|-------------------|
| sim/ | Input, game rules | Phaser, rendering |
| render/ | sim/ state, Phaser | Input handling |
| input/ | Key events | Game rules, rendering |

### 5. Movement Friction

- Grounded fighters use stronger friction (decay 0.8) to stop quickly when the stick is released.
- Airborne fighters use light friction (decay 0.98) to preserve forward/backward momentum during diagonal jumps.

### 4. Multiplayer-Ready Seams

Even without netcode, we have:
- Fixed timestep (60Hz)
- InputFrame capture
- State serialization interface
- Render interpolation points

## File Dependencies

```
main.ts
  └── GameApp.ts
        ├── config/gameConfig.ts
        ├── config/constants.ts
        └── scenes/*

scenes/PreloadScene.ts
  ├── assets/fighterRegistry.ts
  ├── assets/backgroundRegistry.ts
  ├── assets/AssetKeys.ts
  ├── assets/FighterAssets.ts
  └── assets/BackgroundAssets.ts

scenes/PlaygroundScene.ts
  ├── sim/FixedTimestepLoop.ts
  ├── sim/InputFrame.ts
  ├── input/InputManager.ts
  ├── render/PixelFighterRenderer.ts
  ├── render/BackgroundRenderer.ts
  └── render/DebugOverlay.ts
```

## Adding New Modules

1. Determine which layer (sim, render, input, assets)
2. Create file in appropriate directory
3. Update this document
4. Add tests in `tests/`
5. Update `SPEC_KIT.md` if it affects workflow
