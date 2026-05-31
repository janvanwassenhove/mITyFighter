# Implementation Plan: Scene Flow & UI

**Branch**: N/A (retroactive) | **Date**: 2026-04-19 | **Spec**: [spec.md](spec.md)

## Summary
A 13-scene Phaser application with MK-inspired menu flow, dual-theme system persisted in localStorage, fight HUD (health bars + announcer), debug overlay, and consistent ESC-based back navigation. Backgrounds use DOM elements behind the Phaser canvas for video/GIF support.

## Technical Context
**Language/Version**: TypeScript ^5.3 (strict mode)
**Primary Dependencies**: Phaser 3 ^3.70 (scene management, game objects, text rendering)
**Testing**: Vitest ^1.0
**Target Platform**: Browser (ES2020), touch devices
**Performance Goals**: Instant scene transitions; 60 FPS during fights
**Constraints**: Theme colors via `getActiveTheme()` only — no hardcoded hex; DOM elements for video backgrounds

## Constitution Check (Retroactive)

### Documentation-First Gate (Article I) ✅
- [x] Scene flow documented in `docs/ARCHITECTURE.md`
- [x] Theme colors documented in `docs/DESIGN_KIT.md`
- [x] Input navigation documented in `docs/INPUT.md`

### Convention Gate (Article VIII) ✅
- [x] Scene files: `PascalCase.ts` (TitleScene.ts, FightScene.ts, etc.)
- [x] Theme IDs: `snake_case` (classic, devoxx_fr_2026)

### Extensibility Gate (Article IX) ✅
- [x] New themes addable by extending `THEMES` object in themes.ts
- [x] New scenes addable by creating file + registering in GameApp.ts

## Architecture

### Scene Graph (Full Navigation)
```
BootScene ──► PreloadScene ──► TitleScene ◄──── SettingsScene
                                  │       ◄──── AboutScene
                                  ▼
                            ModeSelectScene
                           ╱      │      ╲
                     STORY/    1P/2P      ╲
                        ▼         ▼        ▼
              StorySelectScene  CharacterSelectScene
                    │                  │
                    ▼                  ▼
           DifficultySelectScene  StageSelectScene
                    │                  │
                    ▼                  │
              StoryModeScene           │
                    │                  │
                    ▼                  ▼
                 FightScene ◄──────────┘
                    │
                    └──► StoryModeScene (on story fight end)
```

### ESC Navigation Map
| Scene | ESC Action |
|-------|------------|
| TitleScene | No action (root) |
| ModeSelectScene | → TitleScene |
| CharacterSelectScene | → ModeSelectScene |
| StageSelectScene | → CharacterSelectScene |
| FightScene | Open pause menu (Resume/Quit) |
| StorySelectScene | → ModeSelectScene |
| DifficultySelectScene | → StorySelectScene |
| StoryModeScene | → ModeSelectScene |
| SettingsScene | → TitleScene |
| AboutScene | → TitleScene |

### Data Contracts Between Scenes
```typescript
// ModeSelectScene → CharacterSelectScene
interface ModeSelectData { gameMode: '1P' | '2P' | 'STORY' }

// CharacterSelectScene → StageSelectScene
interface CharSelectData { p1FighterId: string; p2FighterId: string; gameMode: GameMode }

// StageSelectScene → FightScene
interface StageSelectData extends CharSelectData { stageId: string }

// StoryModeScene → FightScene (story path)
interface FightSceneData {
  p1FighterId: string; p2FighterId: string; stageId: string; gameMode: GameMode;
  storyProgress?: StoryProgress; storyFights?: StoryFight[]; aiDifficulty?: AIDifficulty;
}
```

### Theme System Architecture
```
themes.ts (module-level state)
├── THEMES: Record<ThemeId, GameTheme>
│   ├── 'classic': { colors, fonts }
│   └── 'devoxx_fr_2026': { colors, fonts }
├── activeThemeId: ThemeId (module variable)
├── getActiveTheme(): GameTheme
├── setActiveTheme(id): GameTheme (writes localStorage)
└── getThemeList(): { id, name }[]

localStorage key: 'devoxxFighterTheme'
├── Read: on module load (try-catch, fallback 'classic')
└── Write: on setActiveTheme() call from SettingsScene
```

### HUD Components (FightScene)
```
┌─────────────────────────────────────────────────────────────┐
│  [P1 Name]  ████████████░░░░  ●●○   ○●●  ░░░████████████  [P2 Name] │
│             ◄── P1 Health ──►  Rounds  ◄── P2 Health ──►            │
│                                                                      │
│                         ┌──────────────┐                             │
│                         │   FIGHT!     │  ← AnnouncerUI             │
│                         └──────────────┘                             │
│                                                                      │
│  [Fighter 1]                                          [Fighter 2]   │
│                                                                      │
│  ══════════════════════════════════════════════════════  Ground Y:620 │
│  [Debug: tick=1234  FPS=60  P1(400,620) idle  P2(880,620) walk]     │
└─────────────────────────────────────────────────────────────────────┘
```

**HealthBarUI**: Width=450px, height=30px, animated drain via tween, round indicators as circles
**AnnouncerUI**: Center screen, 96px title font, scale-in/out animation, audio clip on show
**DebugOverlay**: F1 toggle, monospace font, shows tick/FPS/positions/states/frame indices

### DOM Background Layer
```
Browser DOM:
┌──────────────────────────────────────┐
│  <div id="bg-container">            │  z-index: 0
│    <video> or <img>                 │  (behind canvas)
│  </div>                             │
│                                      │
│  <canvas id="phaser">              │  z-index: 1
│    (transparent background)         │  (Phaser renders here)
│  </canvas>                          │
└──────────────────────────────────────┘
```

Created in StageSelectScene and FightScene. Destroyed on scene shutdown to prevent DOM leaks.

## Key Technical Decisions

See [research.md](research.md) for full ADRs:
- **ADR-021**: 13 pre-registered Phaser scenes (no dynamic creation)
- **ADR-022**: Scene data passing via Phaser init() (no global store)
- **ADR-023**: Theme system with localStorage persistence
- **ADR-024**: ESC key as universal back navigation
- **ADR-025**: DOM-based background rendering (video/GIF support)
- **ADR-026**: Tab-based settings UI
