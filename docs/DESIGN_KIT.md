# Design Kit

> **Spec-Kit Document** - Reference this for all visual and UX design decisions.

## Overview

DevoxxFighter is a **pixel-art 2D fighting game** built with TypeScript, Phaser 3, and Vite. This design kit establishes visual and interaction standards to ensure consistency across all game elements.

## Visual Identity

### Art Style

| Aspect | Standard | Notes |
|--------|----------|-------|
| Style | Pixel art | Retro aesthetic |
| Rendering | Crisp edges | No antialiasing |
| Scale | Integer scaling | 2x default |
| Animation | Frame-based | Sprite strips |

### Color Palette

Colors are managed through the theme system (`src/game/config/themes.ts`). All UI components use `getActiveTheme()` instead of hardcoded values.

#### Classic Theme (default)

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#ffcc00` | Titles, selected items |
| Highlight | `#ff4444` | Accents, hover, combat |
| Text | `#ffffff` | Body text |
| Text Muted | `#888888` | Secondary labels |
| Panel | `#222244` | Card/tab backgrounds |
| Border | `#444466` | Inactive borders |

#### Devoxx France 2026 Theme

| Role | Hex | Usage |
|------|-----|-------|
| Primary / Banner | `#E7B127` | Titles, selected items |
| Highlight | `#EA7E14` | Accents, hover, combat |
| Text | `#FFFFFF` | Body text |
| Text Muted | `#9BC1B8` | Secondary labels |
| Teal accent | `#609689` | Borders, success state |
| Dark green | `#304936` | Panel backgrounds |

Themes are selectable in **Settings → Options → Theme**.

### Typography

| Context | Classic | Devoxx FR 2026 | Notes |
|---------|---------|----------------|-------|
| Titles / Headlines | Impact | Pirulen | Large, bold |
| Body / UI text | Arial | Open Sans | Clean, readable |
| Announcer | Impact | Pirulen | "FIGHT!", "KO!" etc. |
| Debug Overlay | Courier New | Courier New | Fixed-width |

---

## Canvas & Display

### Resolution

```
┌──────────────────────────────────────────────────────────────┐
│                     1280 × 720 (16:9)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Game Area                           │  │
│  │                                                        │  │
│  │                                                        │  │
│  │                                                        │  │
│  │                                                        │  │
│  │  ══════════════════════════════════════════════════    │  │
│  │                   Ground (Y: 620)                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

| Property | Value | Source |
|----------|-------|--------|
| Width | 1280px | `GAME_WIDTH` |
| Height | 720px | `GAME_HEIGHT` |
| Aspect Ratio | 16:9 | Standard widescreen |
| Ground Y | 620px | `GAME_HEIGHT - GROUND_OFFSET` |
| Ground Offset | 100px | `GROUND_OFFSET` |

### Scaling Behavior

| Mode | Description |
|------|-------------|
| Method | `Phaser.Scale.FIT` |
| Centering | `CENTER_BOTH` |
| Min Scale | 50% (640×360) |
| Max Scale | 200% (2560×1440) |

### Pixel-Perfect Rendering

```typescript
// Required Phaser config
pixelArt: true,
antialias: false,
roundPixels: true,
```

```css
/* Required CSS */
canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

---

## Sprite System

### Frame Dimensions

```
┌───────┬───────┬───────┬───────┬───────┐
│ Frame │ Frame │ Frame │ Frame │ Frame │  ← Horizontal strip
│  0    │  1    │  2    │  3    │  4    │
│128×128│128×128│128×128│128×128│128×128│
└───────┴───────┴───────┴───────┴───────┘
```

| Property | Value | Notes |
|----------|-------|-------|
| Frame Width | 128px | Fixed for all fighters |
| Frame Height | 128px | Fixed for all fighters |
| Display Scale | 2x | Renders at 256×256 |
| Layout | Horizontal | Left-to-right frames |
| Format | PNG | 32-bit with alpha |
| Background | Transparent | Required |

### Anchor Point

| Property | Value | Notes |
|----------|-------|-------|
| Origin X | 0.5 | Center horizontally |
| Origin Y | 1.0 | Bottom (feet) |

This ensures:
- Fighters stand ON the ground line
- Flipping doesn't shift position
- Consistent hitbox alignment

### Fighter Positioning

```
              ← 256px →
            ┌──────────┐
            │          │
            │  Sprite  │
            │  (2x)    │
            │          │
            │          │
            └────┬─────┘
                 │ Anchor (0.5, 1.0)
═════════════════●═════════════════════  Ground Y: 620
```

---

## Animation System

### Frame Rates

| Category | FPS | Actions |
|----------|-----|---------|
| Idle | 8 | idle, idle2, eating |
| Movement | 10-12 | walk (10), run (12), jump (12) |
| Combat | 15 | attack1/2/3, special, blade, kunai, etc. |
| Impact | 10 | hurt, dead |
| Default | 10 | Any unlisted |

### Looping Behavior

| Type | Actions | Notes |
|------|---------|-------|
| Looping | idle, idle2, walk, run | Continuous play |
| One-shot | All others | Play once, return to idle |

### State Transitions

```
┌────────────┐
│   IDLE     │◄──────────────────────────────┐
└─────┬──────┘                               │
      │ Input                                │
      ▼                                      │
┌────────────┐    ┌──────────┐    ┌─────────┴───┐
│   WALK     │    │  ATTACK  │───►│ ON COMPLETE │
└────────────┘    └──────────┘    └─────────────┘
      │                 ▲
      │ Run held        │ Attack input
      ▼                 │
┌────────────┐          │
│    RUN     │──────────┘
└────────────┘
```

---

## UI Layout

### Health Bars (Future)

```
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────┐            ┌────────────────────┐    │
│  │ P1 ████████░░░░░░░ │            │ ░░░░░░░████████ P2 │    │
│  └────────────────────┘            └────────────────────┘    │
│                                                              │
│                       ROUND 1                                │
│                                                              │
```

| Property | P1 | P2 |
|----------|----|----|
| Position | Top-left | Top-right |
| Fill Direction | Left-to-right | Right-to-left |
| Health Color | Green → Yellow → Red | Same gradient |

### Timer (Future)

| Property | Value |
|----------|-------|
| Position | Top-center |
| Format | `99` seconds |
| Font | Large pixel |

### Announcer Text (Future)

| Text | When | Duration |
|------|------|----------|
| "ROUND 1" | Round start | 2s |
| "FIGHT!" | After round text | 1s |
| "K.O.!" | Fighter defeated | 2s |
| "PLAYER 1 WINS" | Match end | 3s |

---

## Debug Overlay

Toggled with **F1** key.

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ┌─────────────────────┐                                      │
│ │ FPS: 60             │                                      │
│ │ Tick: 3847          │                                      │
│ │ P1: kunoichi        │                                      │
│ │ P2: ninja_monk      │                                      │
│ │ Action: idle        │                                      │
│ └─────────────────────┘                                      │
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Debug Info

| Field | Description |
|-------|-------------|
| FPS | Current frame rate |
| Tick | Simulation tick count |
| P1/P2 | Current fighter ID |
| Action | Current animation |

---

## Input Visualization

### Key Indicators (Future)

```
P1 Controls:              P2 Controls:
┌───┬───┬───┐            ┌───┬───┬───┐
│   │ W │   │            │   │ ↑ │   │
├───┼───┼───┤            ├───┼───┼───┤
│ A │ S │ D │            │ ← │ ↓ │ → │
└───┴───┴───┘            └───┴───┴───┘
```

| State | Visual |
|-------|--------|
| Not pressed | Outline only |
| Pressed | Filled |
| Just pressed | Flash/pulse |

---

## Scene Flow

```
┌─────────────┐
│  BootScene  │
│ (minimal)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│PreloadScene │
│(load assets)│
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌───────────────┐         ┌─────────────┐
│ TitleScene  │────────►│ ModeSelect    │────────►│CharSelect   │
│  ├─Settings │   ESC◄──│    Scene      │   ESC◄──│   Scene     │
│  └─About    │         └───────┬───────┘         └──────┬──────┘
└──────┬──────┘                 │                        │
       │              ┌──────────┴────────┐              ▼
       │              │ Story Mode Path   │         ┌─────────────┐
       ▼              ▼                   │   ESC◄──│ StageSelect │
┌─────────────┐ ┌─────────────┐           │         │    Scene    │
│SettingsScene│ │StorySelect  │           │         └──────┬──────┘
│ (controls)  │ │   Scene     │           │                │
└─────────────┘ └──────┬──────┘           │                ▼
       ▲               │                   │         ┌─────────────┐
       │               ▼                   │    ESC──│ FightScene  │
┌─────────────┐ ┌─────────────┐           │  (pause) │             │
│ AboutScene  │ │Difficulty   │           │         └─────────────┘
│ (credits)   │ │Select Scene │           │
└─────────────┘ └──────┬──────┘           │
                       │                   │
                       ▼                   │
                ┌─────────────┐           │
          ESC◄──│StoryMode    │───────────┘
                │   Scene     │
                └─────────────┘
```

### Navigation Controls

- **ESC** on keyboard: Go back to previous scene (or open pause menu in FightScene)
- **◀ BACK** button on mobile: Same as ESC key for touch devices
- **⏸** button in FightScene (mobile): Opens pause menu with Resume/Quit options

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Fighter folder | `snake_case` | `ninja_monk/` |
| Sprite files | `PascalCase.png` | `Attack_1.png` |
| Background files | `snake_case.png` | `training_dojo.png` |
| Source files | `PascalCase.ts` | `FightScene.ts` |
| Test files | `camelCase.test.ts` | `inputFrame.test.ts` |

### Code

| Type | Convention | Example |
|------|------------|---------|
| Fighter ID | `snake_case` | `'ninja_monk'` |
| Action ID | `camelCase` | `'attack1'` |
| Background ID | `snake_case` | `'training_dojo'` |
| Constants | `SCREAMING_SNAKE_CASE` | `FRAME_WIDTH` |
| Classes | `PascalCase` | `InputManager` |
| Functions | `camelCase` | `getFighterTextureKey()` |

### Asset Keys

| Type | Format | Example |
|------|--------|---------|
| Texture key | `fighter/<id>/<action>` | `fighter/kunoichi/idle` |
| Animation key | `fighter:<id>:<action>` | `fighter:kunoichi:idle` |
| Background key | `background/<id>` | `background/training_dojo` |

---

## Responsive Design

### Breakpoints

| Size | Resolution | Notes |
|------|------------|-------|
| Minimum | 640×360 | 50% scale |
| Default | 1280×720 | Native |
| Maximum | 2560×1440 | 200% scale |

### Touch Support (Future)

```
┌──────────────────────────────────────────────────────────────┐
│                        Game View                             │
│                                                              │
│                                                              │
│                                                              │
├────────────────────────┬─────────────────────────────────────┤
│   Virtual D-Pad        │              Action Buttons         │
│   ┌───┐                │                      ┌───┐ ┌───┐   │
│   │ ↑ │                │                      │ A │ │ B │   │
│ ┌─┼───┼─┐              │                      └───┘ └───┘   │
│ │←│   │→│              │                      ┌───┐ ┌───┐   │
│ └─┼───┼─┘              │                      │ X │ │ Y │   │
│   │ ↓ │                │                      └───┘ └───┘   │
│   └───┘                │                                     │
└────────────────────────┴─────────────────────────────────────┘
```

---

## Audio Guidelines (Future)

### Categories

| Category | Volume | Notes |
|----------|--------|-------|
| Music | 70% | Background tracks |
| SFX | 100% | Hit sounds, etc. |
| Voice | 90% | Announcer, grunts |

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Music | `music_<scene>.ogg` | `music_fight.ogg` |
| SFX | `sfx_<action>.wav` | `sfx_punch.wav` |
| Voice | `voice_<text>.wav` | `voice_fight.wav` |

---

## Quality Checklist

When adding new visual elements:

- [ ] Follows pixel-art style (no smooth gradients)
- [ ] Uses established color palette or extends it intentionally
- [ ] Sprites are 128×128 frame size
- [ ] Anchored at bottom-center (0.5, 1.0)
- [ ] Animation frames consistent with frame rate table
- [ ] Naming follows conventions
- [ ] Works at all scale levels (50%-200%)
- [ ] Looks crisp (no blurring/antialiasing artifacts)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-25 | Initial design kit |
