# Asset Pipeline

## Overview

Assets are loaded in two stages:
1. **Boot**: JSON data files are fetched (`fighters.json`, `backgrounds.json`, `audio.json`)
2. **Preload**: Actual sprite strips, backgrounds, and audio files are loaded via Phaser loader

## JSON Data Files (public/data/)

| File | Purpose | Loaded By |
|------|---------|-----------|
| `fighters.json` | Fighter metadata, display names, bios, action→file mappings | `fighterRegistry.ts` → `loadFightersFromJson()` |
| `backgrounds.json` | Background metadata, display names, file paths | `backgroundRegistry.ts` → `loadBackgroundsFromJson()` |
| `audio.json` | Audio metadata, categories, file paths | `AudioManager.ts` |

## Fighter Loading Flow

```
1. BootScene calls loadFightersFromJson()
2. JSON is fetched from public/data/fighters.json
3. Registry is populated: fighterRegistry[id] = FighterRegistryEntry
4. PreloadScene iterates registry entries
5. For each fighter+action: load sprite strip from public/sprites/<basePath>/<filename>.png
6. After load: create Phaser animation with auto-detected frame count
   frameCount = texture.width / FRAME_WIDTH (128)
7. Animation key: fighter:<fighterId>:<actionId>
```

## Sprite Strip Format

```
┌───────┬───────┬───────┬───────┬───────┐
│128×128│128×128│128×128│128×128│128×128│ ← Horizontal strip, PNG, transparent bg
└───────┴───────┴───────┴───────┴───────┘
  Frame0  Frame1  Frame2  Frame3  Frame4
```

- Width: `N × 128` (N = number of frames)
- Height: exactly `128`
- Format: PNG with alpha transparency
- Display scale: 2× (renders at 256×256)

## Background Loading Flow

```
1. BootScene calls loadBackgroundsFromJson()
2. JSON is fetched from public/data/backgrounds.json
3. Registry populated with background entries
4. PreloadScene loads each background image
5. BackgroundRenderer displays the selected background at scene start
```

## Adding New Assets

- **New fighter**: See `docs/EXTENSIBILITY.md` → "Adding a New Fighter"
- **New background**: See `docs/EXTENSIBILITY.md` → "Adding a New Background"
- **New action**: See `docs/EXTENSIBILITY.md` → "Adding a New Action"

Always update:
1. The JSON data file (`public/data/fighters.json` or `backgrounds.json`)
2. The relevant `docs/` file
3. Run `npm run validate:assets`

## Validation

`npm run validate:assets` (or `tools/validate-assets.ts`) checks:
- Every registry entry has matching files on disk
- Sprite strips: height = 128, width divisible by 128
- No orphaned sprites without registry entries
- Action IDs are valid `ActionId` type values
