# Architecture Map

## Top-Level Structure

```
DevoxxFighter/
├── src/                    → All source code
│   ├── main.ts             → Entry point: creates Phaser game instance
│   └── game/
│       ├── GameApp.ts      → App orchestrator, global state
│       ├── config/         → Game configuration
│       ├── assets/         → Asset loading, registries, validators
│       ├── scenes/         → Phaser scenes (game screens)
│       ├── sim/            → Deterministic simulation (NO PHASER)
│       ├── render/         → Rendering systems
│       ├── input/          → Input handling
│       ├── audio/          → Sound management
│       ├── ui/             → UI components
│       ├── state/          → Game state management
│       └── utils/          → Shared utilities
├── tests/                  → Vitest unit tests
├── tools/                  → CLI scripts (asset validation)
├── public/                 → Static assets served by Vite
│   ├── data/               → JSON data files (fighters.json, backgrounds.json, audio.json)
│   ├── sprites/            → Fighter sprite strips (128×128 frames)
│   ├── backgrounds/        → Background images
│   └── audio/              → Sound files
├── docs/                   → Spec-kit documentation
└── .github/                → CI, agents, skills, instructions
```

## Module Details

### config/ — Game Configuration
| File | Purpose |
|------|---------|
| `constants.ts` | `GAME_WIDTH`, `GAME_HEIGHT`, `GROUND_OFFSET`, `FRAME_WIDTH`, frame rates, player IDs |
| `gameConfig.ts` | Phaser config object, scale settings, input config |

### assets/ — Asset Pipeline
| File | Purpose |
|------|---------|
| `fighterRegistry.ts` | Fighter metadata, JSON loading, ID→entry lookup |
| `backgroundRegistry.ts` | Background metadata, JSON loading |
| `AssetKeys.ts` | Texture/animation key generation, `ActionId` type |
| `FighterAssets.ts` | Sprite loading logic |
| `BackgroundAssets.ts` | Background loading logic |
| `validators/validateAssets.ts` | Runtime asset validation |

### scenes/ — Game Screens
| Scene | Purpose |
|-------|---------|
| `BootScene` | Minimal init, loading indicator |
| `PreloadScene` | Load all assets, create animations |
| `TitleScene` | Main menu |
| `ModeSelectScene` | 1P / 2P / Story mode selection |
| `CharacterSelectScene` | Fighter picker |
| `StageSelectScene` | Background/stage picker |
| `DifficultySelectScene` | Story mode difficulty |
| `StorySelectScene` | Story mode character selection |
| `StoryModeScene` | Story progression |
| `FightScene` | Main gameplay |
| `PlaygroundScene` | 2P testing sandbox |
| `SettingsScene` | Controls and options |
| `AboutScene` | Credits |

### sim/ — Deterministic Simulation (**NO PHASER**)
| File | Purpose |
|------|---------|
| `FighterState.ts` | State enum, runtime state, physics constants, attack data |
| `CombatSystem.ts` | Fighter updates, collision, damage, hitboxes/hurtboxes |
| `ComboInput.ts` | Directional combo detection per player |
| `InputFrame.ts` | 16-bit bitmask input representation |
| `FixedTimestepLoop.ts` | 60Hz tick accumulator |
| `SimTypes.ts` | `PlayerState`, `Position`, `Velocity` types |
| `FightingAI.ts` | CPU opponent logic |

### render/ — Rendering (reads sim state, never writes)
| File | Purpose |
|------|---------|
| `PixelFighterRenderer.ts` | Fighter sprite display, animation playback |
| `BackgroundRenderer.ts` | Background rendering |
| `DebugOverlay.ts` | F1 debug info overlay |

### input/ — Input Handling
| File | Purpose |
|------|---------|
| `InputBindings.ts` | Key→action mappings per player |
| `InputManager.ts` | Keyboard state tracking |
| `InputCapture.ts` | InputFrame bitmask generation from raw input |
| `KeyboardLayout.ts` | Layout detection |
| `TouchControls.ts` | Mobile touch input |

### ui/ — UI Components
| File | Purpose |
|------|---------|
| `HealthBarUI.ts` | Health bar rendering |
| `AnnouncerUI.ts` | "FIGHT!", "KO!" announcements |

### state/ — State Management
| File | Purpose |
|------|---------|
| `GameState.ts` | Global game state |
| `StoryModeState.ts` | Story mode progression |

### utils/ — Shared Utilities
| File | Purpose |
|------|---------|
| `logger.ts` | Structured logging (use instead of console) |
| `assert.ts` | Runtime assertions |
| `types.ts` | Shared TypeScript types |

## Key Boundaries

1. **sim/ → render/**: One-way dependency. Render reads sim state. Sim never knows about render.
2. **sim/ → Phaser**: FORBIDDEN. Sim must be headless-capable.
3. **assets/ → public/data/**: Registries load from JSON files at runtime.
4. **scenes/ → everything**: Scenes orchestrate all systems.
