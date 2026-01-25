# Asset Conventions

> **Spec-Kit Document** - Update this before modifying asset-related code.

## Overview

All game assets follow strict conventions for consistency, pixel-perfect rendering, and extensibility.

## Fighter Sprites

### Directory Structure

```
src/assets/sprites/
  <FighterId>/
    <ActionName>.png
    ...
```

### Sprite Strip Format

| Property | Value | Notes |
|----------|-------|-------|
| Frame Width | 128px | Fixed, all fighters |
| Frame Height | 128px | Fixed, all fighters |
| Layout | Horizontal strip | Frames left-to-right |
| Format | PNG | 32-bit with alpha |
| Background | Transparent | Required |

### Frame Count Detection

Frame count is **auto-detected** at runtime:
```
frameCount = texture.width / FRAME_WIDTH
```

No hardcoded frame counts in registries.

### Naming Convention

| File Name | Action ID | Notes |
|-----------|-----------|-------|
| Idle.png | idle | Primary idle |
| Idle_2.png | idle2 | Alternate idle |
| Walk.png | walk | Walking |
| Run.png | run | Running |
| Jump.png | jump | Jumping |
| Hurt.png | hurt | Taking damage |
| Dead.png | dead | Death |
| Attack_1.png | attack1 | Primary attack |
| Attack_2.png | attack2 | Secondary attack |
| Attack_3.png | attack3 | Tertiary attack |
| Special.png | special | Special move |
| Cast.png | cast | Casting spell |
| Eating.png | eating | Eating (Homeless) |
| Spine.png | spine | Spine attack |
| Blade.png | blade | Blade attack |
| Kunai.png | kunai | Kunai throw |
| Dart.png | dart | Dart throw |
| Shot.png | shot | Shooting |
| Disguise.png | disguise | Disguise ability |

### Current Fighters

| Fighter ID | Display Name | Available Actions |
|------------|--------------|-------------------|
| homeless_1 | Homeless 1 | idle, idle2, walk, run, jump, hurt, dead, attack1, attack2, special |
| homeless_2 | Homeless 2 | idle, idle2, walk, run, jump, hurt, dead, attack1, attack2, attack3 |
| homeless_3 | Homeless 3 | idle, idle2, walk, run, jump, hurt, dead, attack1, attack2, special |
| kunoichi | Kunoichi | idle, walk, run, jump, hurt, dead, attack1, attack2, cast, eating, spine |
| ninja_monk | Ninja Monk | idle, walk, run, jump, hurt, dead, attack1, attack2, blade, cast, kunai |
| ninja_peasant | Ninja Peasant | idle, walk, run, jump, hurt, dead, attack1, attack2, dart, disguise, shot |

## Backgrounds

### Directory Structure

```
src/assets/backgrounds/
  <backgroundId>.png
```

### Format

| Property | Value | Notes |
|----------|-------|-------|
| Recommended Width | 1280px+ | Wider for parallax |
| Recommended Height | 720px+ | 16:9 aspect |
| Format | PNG or JPG | PNG for transparency |

### Current Backgrounds

| Background ID | Display Name | File |
|---------------|--------------|------|
| dojo | Training Dojo | dojo.png |

> Note: Placeholder background. Add more following EXTENSIBILITY.md.

## Asset Keys

### Texture Keys

```
fighter/<fighterId>/<actionId>
bg/<backgroundId>
```

Examples:
- `fighter/kunoichi/idle`
- `fighter/homeless_1/attack1`
- `bg/dojo`

### Animation Keys

```
fighter:<fighterId>:<actionId>
```

Examples:
- `fighter:kunoichi:idle`
- `fighter:homeless_1:attack1`

## Pixel-Perfect Rendering

### Phaser Configuration

```typescript
{
  pixelArt: true,
  antialias: false,
  roundPixels: true
}
```

### CSS Requirements

```css
canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

### Scaling Rules

1. Always scale by integer multiples when possible
2. Use `roundPixels: true` to prevent sub-pixel positioning
3. Camera zoom should be integer values for crispness

## Baseline and Positioning

- Character pivot point: bottom-center of frame
- Ground line: y = canvas.height - GROUND_OFFSET
- All fighters share the same frame size for consistent hitboxes
