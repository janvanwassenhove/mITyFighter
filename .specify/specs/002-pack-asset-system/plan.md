# Implementation Plan: Pack-Based Asset System

**Branch**: N/A (retroactive) | **Date**: 2026-04-19 | **Spec**: [spec.md](spec.md)

## Summary
A fully data-driven asset pipeline where fighters, backgrounds, and audio are loaded from external JSON registries and self-contained pack folders at boot time. No content is hardcoded in TypeScript source.

## Technical Context
**Language/Version**: TypeScript ^5.3 (strict mode)
**Primary Dependencies**: Phaser 3 ^3.70 (asset loading, spritesheet parsing, animation creation)
**Bundler**: Vite ^5.0 (serves public/ as static assets)
**Testing**: Vitest ^1.0
**Target Platform**: Browser (ES2020), GitHub Pages static hosting
**Performance Goals**: All 20 fighter packs load within 3 seconds on broadband
**Constraints**: Client-only (no server); browsers can't enumerate directories

## Constitution Check (Retroactive)

### Registry-Driven Gate (Article III) ✅
- [x] Fighter content from `public/packs/<id>/manifest.json` — not hardcoded
- [x] Backgrounds from `public/data/backgrounds.json`
- [x] Audio from `public/data/audio.json`
- [x] Frame counts auto-detected from texture width

### Extensibility Gate (Article IX) ✅
- [x] Adding content = data files only, no TypeScript changes
- [x] Recipe documented in `docs/EXTENSIBILITY.md`

### Pixel-Perfect Gate (Article V) ✅
- [x] Spritesheets loaded with `frameWidth: 128, frameHeight: 128`
- [x] `pixelArt: true` in Phaser config

## Architecture

### Directory Layout
```
public/
├── data/
│   ├── packs.json                # Index: list of fighter pack IDs
│   ├── backgrounds.json          # Background registry entries
│   └── audio.json                # Audio registry entries
├── packs/
│   └── <fighterId>/
│       ├── manifest.json         # Character metadata + animation list
│       ├── <action>/
│       │   ├── spritesheet.png   # Horizontal strip (N × 128×128 frames)
│       │   └── preview.gif       # Animation preview
│       └── profile-pics/
│           ├── pic_0.png
│           ├── pic_1.png
│           ├── pic_2.png
│           └── pic_3.png
├── backgrounds/
│   └── <bgId>.png|.mp4|.gif
└── audio/
    └── <audioId>.mp3|.ogg

src/game/assets/
├── PackLoader.ts                 # Fetch packs.json → load manifests → queue assets
├── PackTypes.ts                  # Manifest types + action folder mapping
├── FighterAssets.ts              # Fighter spritesheet loading helpers
├── BackgroundAssets.ts           # Background loading helpers
├── fighterRegistry.ts            # Runtime fighter registry (populated from manifests)
├── backgroundRegistry.ts         # Runtime background registry (from JSON)
└── AssetKeys.ts                  # Key generation: fighter/<id>/<action>, bg/<id>
```

### Loading Sequence
```
BootScene.preload()
├── fetch('data/packs.json')        → packIds[]
├── fetch('data/backgrounds.json')  → BackgroundRegistryEntry[]
├── fetch('data/audio.json')        → AudioRegistryEntry[]
└── for each packId:
    └── fetch('packs/{id}/manifest.json') → PackManifest   (parallel)

BootScene.create()
├── populateFighterRegistry(manifests)
├── populateBackgroundRegistry(entries)
└── populateAudioRegistry(entries)

PreloadScene.preload()
├── for each manifest:
│   ├── scene.load.spritesheet(key, path, {128, 128})  per action
│   └── scene.load.image(key, path)                     per profile pic
├── for each background:
│   └── scene.load.image|video(key, path)
└── for each audio:
    └── scene.load.audio(key, path)

PreloadScene.create()
└── for each manifest:
    └── scene.anims.create(...)   per action (with per-frame delays)
```

## Key Technical Decisions

See [research.md](research.md) for full ADRs:
- **ADR-007**: Self-contained pack folders (not centralized assets)
- **ADR-008**: Three separate JSON registries (packs, backgrounds, audio)
- **ADR-009**: Manifest-driven per-frame animation timing
- **ADR-010**: Explicit PACK_ACTION_MAP folder→ActionId mapping
- **ADR-011**: Auto-detected frame counts from texture width
