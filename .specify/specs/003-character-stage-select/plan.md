# Implementation Plan: Character & Stage Selection

**Branch**: N/A (retroactive) | **Date**: 2026-04-19 | **Spec**: [spec.md](spec.md)

## Summary
MK-style dual-cursor character selection on a 6×4 portrait grid, followed by a full-screen stage carousel with DOM-based video/image preview. Both scenes pass typed data forward through the scene chain.

## Technical Context
**Language/Version**: TypeScript ^5.3 (strict mode)
**Primary Dependencies**: Phaser 3 ^3.70 (scene, text, input), DOM (video/image previews)
**Testing**: Vitest ^1.0
**Target Platform**: Browser (ES2020), touch devices
**Performance Goals**: Instant cursor movement; smooth stage transition
**Constraints**: Profile pics from pack manifests; DOM backgrounds; mode-specific behavior

## Constitution Check (Retroactive)

### Registry-Driven Gate (Article III) ✅
- [x] Fighter grid populated from fighter registry (not hardcoded)
- [x] Stage list populated from background registry (not hardcoded)
- [x] Profile pics from pack manifests

### Pixel-Perfect Gate (Article V) ✅
- [x] Portrait cells use pixel-art scaling for idle frame fallback
- [x] Integer portrait sizes (100×100px cells)

### Extensibility Gate (Article IX) ✅
- [x] Adding a fighter automatically adds it to the grid
- [x] Adding a background automatically adds it to the carousel

## Architecture

### Character Select Layout
```
┌──────────────────────────────────────────────────────────────────┐
│                    SELECT YOUR FIGHTER                            │
│                                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ F01  │ │ F02  │ │ F03  │ │ F04  │ │ F05  │ │ F06  │  Row 1  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ F07  │ │ F08  │ │ F09  │ │ F10  │ │ F11  │ │ F12  │  Row 2  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ F13  │ │ F14  │ │ F15  │ │ F16  │ │ F17  │ │ F18  │  Row 3  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐                                              │
│  │ F19  │ │ F20  │                                       Row 4  │
│  └──────┘ └──────┘                                              │
│                                                                  │
│  [P1 Cursor: blue]  [P2 Cursor: red]                           │
│  Fighter Name — Tagline                                         │
└──────────────────────────────────────────────────────────────────┘
```

**Grid Constants**: GRID_COLS=6, PORTRAIT_SIZE=100px, PORTRAIT_GAP=12px, GRID_Y=200px

### Portrait Rendering Fallback Chain
```
1. Profile pic texture (fighter/{id}/profile/0) → use if loaded
2. Idle spritesheet frame 0 (fighter/{id}/idle) → crop to square
3. Colored rectangle with fighter initial → last resort
```

### Stage Select Layout
```
┌──────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │              Full-Screen Background Preview               │   │
│  │              (DOM: <video> or <img>)                      │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ◄                   Stage Name                           ►     │
│                     Description                                  │
│                      3 / 15                                      │
│                                                                  │
│                    [Press ENTER to confirm]                       │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow
```
ModeSelectScene
    │  { gameMode: '1P' | '2P' | 'STORY' }
    ▼
CharacterSelectScene
    │  Mode-specific init:
    │  ├── 2P: Both cursors active, both must confirm
    │  ├── 1P: P1 active, P2 random + auto-confirm
    │  └── STORY: Redirects to StorySelectScene
    │
    │  { p1FighterId, p2FighterId, gameMode }
    ▼
StageSelectScene
    │  Carousel through background registry
    │  { p1FighterId, p2FighterId, stageId, gameMode }
    ▼
FightScene
```

## Key Technical Decisions

See [research.md](research.md) for full ADRs:
- **ADR-027**: Grid-based character select (MK-style, 6 columns)
- **ADR-028**: Dual independent cursors (simultaneous selection)
- **ADR-029**: Full-screen stage preview with DOM elements
