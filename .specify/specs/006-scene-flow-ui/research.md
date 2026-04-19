# Research: Scene Flow & UI

**Feature**: 006-scene-flow-ui
**Date**: 2026-04-19 (retroactive)
**Status**: Decisions implemented

---

## ADR-021: 13 Pre-Registered Phaser Scenes

**Context**: The game has a complex menu flow (title → mode → character select → stage select → fight) plus story mode paths, settings, and about. Scenes need to transition smoothly with data passing.

**Decision**: All 13 scenes are registered at boot in `GameApp.ts`. Transitions use `scene.start(key, data)` with typed data interfaces. No dynamic scene creation — all scenes exist from init.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Single scene with state machine | Massive file; hard to maintain; can't leverage Phaser's scene lifecycle |
| Dynamic scene loading | Adds complexity; all scenes are small enough to preload |
| Route-based (like SPA router) | Not a Phaser pattern; would fight the framework |

**Consequences**: Scene registration order matters for initialization. Data contracts between scenes are implicit (TypeScript interfaces help but aren't enforced at runtime). Adding a scene requires updating `GameApp.ts`.

**Reference**: `src/game/GameApp.ts`

---

## ADR-022: Scene Data Passing via Phaser init()

**Context**: Each scene needs data from the previous scene (selected fighters, game mode, stage ID, story progress). Phaser provides `scene.start(key, data)` which passes data to the next scene's `init(data)` method.

**Decision**: Use Phaser's built-in `init(data)` for all inter-scene data. Define TypeScript interfaces for each data contract (e.g., `FightSceneData`, `ModeSelectData`). No global state store.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Global game state singleton | Introduces tight coupling; harder to test scenes in isolation |
| Redux/Zustand-style store | Over-engineering for scene-to-scene data; adds dependency |
| URL query params | Not applicable for Phaser (not a web app router) |
| Phaser registry (game.registry) | Untyped; harder to track data flow |

**Consequences**: Data flows forward through the scene chain. Going "back" (ESC) means re-entering a scene without the forward data — scenes must handle being entered with or without data. Story mode passes full `storyProgress` + `storyFights` arrays through FightScene.

**Reference**: `src/game/scenes/FightScene.ts` (FightSceneData), `src/game/scenes/StageSelectScene.ts`

---

## ADR-023: Theme System with localStorage Persistence

**Context**: The game needs switchable visual themes (Classic for general use, Devoxx France 2026 for the conference). Theme preference should survive browser refreshes.

**Decision**: Module-level theme state in `themes.ts`. Two themes defined as const objects (`ThemeColors` + `ThemeFonts`). `getActiveTheme()` returns current theme. `setActiveTheme(id)` persists to localStorage key `'devoxxFighterTheme'`. Loaded on module init with try-catch fallback to 'classic'.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| CSS variables | Phaser doesn't use CSS for rendering; would only affect DOM overlays |
| Phaser plugin/registry | No built-in theme support; custom plugin is overkill |
| Compile-time theme selection | Can't switch at runtime; bad for demos |
| Cookie-based persistence | localStorage is simpler; no server needed |

**Consequences**: Every scene calls `getActiveTheme()` in its `create()` method — there's no reactive system. Changing theme mid-scene requires scene restart (handled in Settings). All color references use theme functions, never hardcoded hex values.

**Reference**: `src/game/config/themes.ts`, `src/game/scenes/SettingsScene.ts`

---

## ADR-024: ESC Key as Universal Back Navigation

**Context**: Players need consistent navigation. Arcade games typically use a single button to go "back" from any screen.

**Decision**: ESC provides context-aware back navigation in every scene. In menus: go to previous scene. In FightScene: open pause overlay (Resume/Quit). In TitleScene: no action (already at root).

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Back button only (no keyboard shortcut) | Bad UX for keyboard-driven game; touch button exists separately |
| Browser back button (history API) | Doesn't work in Phaser canvas; unexpected behavior |
| Dedicated "Back" key (e.g., Backspace) | ESC is the universal convention for menus in games |

**Consequences**: Each scene implements its own ESC handler. Mobile gets a visual ◀ BACK button in top-left (FightScene shows ⏸ pause instead). Navigation graph is well-defined — ESC always goes to the "parent" scene.

**Reference**: All scene files, `docs/INPUT.md`

---

## ADR-025: DOM-Based Background Rendering

**Context**: Stage backgrounds include videos and GIFs. Phaser's built-in video support is limited — especially for looping, performance, and format compatibility across browsers.

**Decision**: Backgrounds render in a DOM element (HTML div) positioned behind the transparent Phaser canvas. `StageSelectScene` and `FightScene` create DOM preview containers with z-index layering. Images use `<img>`, videos use `<video>`, GIFs use `<img>`.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Phaser video game object | Poor loop support; inconsistent across browsers; blocks loading |
| Phaser sprite for all backgrounds | Can't play video; GIF support requires frame extraction |
| Canvas-only (draw frames manually) | Performance overhead for video decode + draw at 60fps |

**Consequences**: Background layer is outside Phaser's scene graph — can't be affected by Phaser camera or shaders. Parallax scroll uses CSS transform, not Phaser camera. DOM cleanup needed on scene transitions to prevent leaking elements.

**Reference**: `src/game/scenes/StageSelectScene.ts`, `src/game/scenes/FightScene.ts`

---

## ADR-026: Tab-Based Settings UI

**Context**: Settings need to cover P1 controls, P2 controls, and general options (theme, keyboard layout, numpad toggle). A single scrolling list would be overwhelming.

**Decision**: Three tabs: P1, P2, OPTIONS. Each tab renders its own content. Controls display in a two-column layout (Movement left, Combat right). Key rebinding uses a "press ENTER then press key" flow. Theme switching triggers immediate visual update.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Single scrollable list | Too long; hard to find settings; poor UX |
| Separate scenes per settings category | Over-fragmented; 3 extra scenes for simple config |
| Modal dialogs | Phaser doesn't have native modals; complex to implement |

**Consequences**: Tab state is local to SettingsScene. Rebinding captures the next keypress after ENTER confirmation. P2 numpad toggle requires re-rendering the P2 tab to show updated bindings.

**Reference**: `src/game/scenes/SettingsScene.ts`
