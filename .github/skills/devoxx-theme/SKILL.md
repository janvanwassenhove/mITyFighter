---
name: devoxx-theme
description: "Devoxx France 2026 visual theme and branding. Use when: styling UI elements, creating slides, updating colors, applying conference theme to game UI, or switching between theme variations. Covers color palette, typography, tone, and theming system."
---
# Skill: Devoxx France 2026 Theme

## Purpose
Apply the Devoxx France 2026 visual and storytelling style to game UI and slide generation.

## When to Use
- Styling game UI elements (menus, health bars, announcements)
- Creating presentation slides for Devoxx talks
- Reviewing or updating color schemes
- Adding new theme variations
- Ensuring brand consistency across the app

## Design Rules
- Prefer dark backgrounds (`#0a0a15` base)
- Use large, readable text
- Avoid dense bullet lists (one core message per screen)
- Favor strong headlines and short supporting text
- Keep visual rhythm over text density
- Code should be large and readable on demo slides

## Typography
- Title font: `Pirulen` (fallback: `Impact, sans-serif`)
- Body font: `Open Sans` (fallback: `Arial, sans-serif`)

## Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary / Banner | `#E7B127` | Title text, active highlights, selected items |
| Highlight | `#EA7E14` | Accent, hover states, combat UI |
| Default text | `#FFFFFF` | Body text, labels |
| Teal accent | `#609689` | Secondary UI, health bar good state |
| Light teal | `#9BC1B8` | Muted text, disabled states |
| Dark green | `#304936` | Backgrounds, panels, dark accents |
| Background | `#0a0a15` | Scene backgrounds |

## Theme System

The game supports switchable themes via `src/game/config/themes.ts`:

```typescript
import { getActiveTheme } from '../config/themes';

const theme = getActiveTheme();
// Use theme.colors.primary, theme.fonts.title, etc.
```

### Available Themes
- `classic` — Original MK-inspired red/gold style
- `devoxx_fr_2026` — Devoxx France 2026 conference branding

### Adding a New Theme
1. Add theme definition in `src/game/config/themes.ts`
2. Add the theme ID to the `ThemeId` type
3. Update `THEME_IDS` array
4. Theme is automatically available in Settings

## Tone
- Energetic
- Tech conference style
- Demo-friendly
- Minimal but impactful

## Procedure

### 1. Check Current Theme
Read `src/game/config/themes.ts` for all theme definitions and the active theme getter.

### 2. Apply Theme Colors
Always use `getActiveTheme()` instead of hardcoded colors in UI components.

### 3. Test Theme Switching
Verify theme changes persist via localStorage and apply correctly across all scenes.
