# Feature Specification: Pack-Based Asset System

**Status**: Delivered
**Reverse-Engineered**: 2026-04-19
**Source**: `src/game/assets/`, `public/packs/`, `public/data/`

## User Scenarios & Testing

### User Story 1 — Dynamic Fighter Loading (Priority: P1)
The game loads all fighter content from external pack folders containing `manifest.json` files and spritesheet PNGs. No fighters are hardcoded in source — everything is data-driven from `public/packs/`.

**Why this priority**: Enables content creators to add fighters without code changes.
**Independent Test**: Add a new pack folder with valid manifest, verify it appears in-game without code modifications.

**Acceptance Scenarios**:
1. **Given** a valid pack in `public/packs/<id>/` with `manifest.json`, **When** the game boots, **Then** the fighter appears in the character select grid
2. **Given** a manifest with 16 animations, **When** assets load, **Then** all spritesheets are loaded and Phaser animations created with correct frame timing
3. **Given** a pack with 4 profile pics, **When** the character select screen renders, **Then** the fighter's portrait displays correctly

### User Story 2 — Background Loading (Priority: P2)
Backgrounds are loaded from `public/data/backgrounds.json` registry pointing to files in `public/backgrounds/`. Supports images, videos, and GIFs.

**Acceptance Scenarios**:
1. **Given** a background entry in `backgrounds.json`, **When** the stage select screen loads, **Then** the background appears as a selectable option with preview
2. **Given** a video-type background, **When** selected, **Then** it plays as an animated background in the fight scene

### User Story 3 — Audio Loading (Priority: P2)
Audio assets are loaded from `public/data/audio.json` with categories (announcer, impact, music, ui, sfx).

**Acceptance Scenarios**:
1. **Given** audio entries in `audio.json`, **When** the game loads, **Then** all audio files are registered and playable by ID

## Requirements (As Implemented)

### Functional Requirements
- **FR-001**: Pack index loaded from `public/data/packs.json` listing all fighter pack IDs — `PackLoader.ts`
- **FR-002**: Pack manifests loaded in parallel from `public/packs/<id>/manifest.json` — `PackLoader.ts`
- **FR-003**: Spritesheets loaded as Phaser spritesheets with 128×128 frame size — `FighterAssets.ts`
- **FR-004**: Animations created with per-frame delay from manifest (not fixed FPS) — `PackLoader.ts`
- **FR-005**: Pack action folders map to canonical ACTION_IDS (e.g., `punch` → `attack1`) — `PackTypes.ts`
- **FR-006**: Fighter registry populated dynamically from loaded manifests — `fighterRegistry.ts`
- **FR-007**: Background registry populated from `backgrounds.json` — `backgroundRegistry.ts`
- **FR-008**: Audio registry populated from `audio.json` with category-based volume — `AudioManager.ts`
- **FR-009**: Profile pics loaded per fighter (up to 4) for character select screen — `PackLoader.ts`

### Key Entities
- **PackManifest**: Character identity, sprite size, animation list, profile pics
- **PackAnimation**: Name, folder, frameCount, loop mode, per-frame delays, spritesheet path
- **FighterRegistryEntry**: Resolved runtime entry with id, displayName, actions map, profile pics
- **BackgroundRegistryEntry**: id, displayName, file, type (image/video/gif)

## Known Issues & Technical Debt
- **[KNOWN ISSUE]**: `docs/ASSETS.md` still references old `src/assets/sprites/` path convention; actual system uses `public/packs/`
- **[KNOWN ISSUE]**: Hitbox data is defined in manifest frames but not yet consumed by the combat system

## Implementation Notes
- Loading flow: BootScene (JSON registries + manifests) → PreloadScene (spritesheets + audio) → ready
- 20 fighters currently loaded from packs
- 15+ backgrounds from backgrounds.json
- Action mapping: `PACK_ACTION_MAP` in `PackTypes.ts`
