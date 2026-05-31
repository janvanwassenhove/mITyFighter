# Data Model: Pack-Based Asset System

**Feature**: 002-pack-asset-system
**Date**: 2026-04-19 (retroactive)

---

## Pack Index (packs.json)

Top-level index listing available fighter packs.

```json
// public/data/packs.json
[
  "arrow_lad",
  "bartholomew_blaze",
  "brother_silent",
  ...
]
```

**Type**: `string[]` — array of fighter pack IDs (snake_case)

---

## Pack Manifest (manifest.json)

Self-contained metadata for a single fighter.

```typescript
interface PackManifest {
  name: string;                     // Display name
  version: string;                  // Semver
  character: PackCharacter;
  spriteSize: { width: 128; height: 128 };
  animationCount: number;           // Total animation count
  profilePicCount: number;          // Total profile pic count
  animations: PackAnimation[];
  profilePics: PackProfilePic[];
  exportedAt: string;               // ISO 8601 timestamp
}

interface PackCharacter {
  id: string;                       // snake_case fighter ID
  displayName: string;
  tagline: string;
  bio: string;
  motivation: string;
}
```

**Source**: `src/game/assets/PackTypes.ts`, `public/packs/*/manifest.json`

---

## Pack Animation

Per-action animation metadata within a manifest.

```typescript
interface PackAnimation {
  name: string;                     // Human-readable ("Punch", "Idle")
  folder: string;                   // Folder name ("punch", "idle")
  frameCount: number;               // Expected frame count
  loop: 'loop' | 'once';           // Looping behavior
  totalDuration: number;            // Total animation duration in ms
  spriteSheet: string;              // Relative path: "punch/spritesheet.png"
  gif: string;                      // Preview: "punch/preview.gif"
  frames: PackFrame[];              // Per-frame data
}

interface PackFrame {
  index: number;                    // Frame index (0-based)
  delay: number;                    // Display duration in ms
  hitboxes: PackHitbox[];           // Per-frame hitbox data (reserved)
}

interface PackHitbox {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'damage' | 'hurt';
}
```

**Source**: `src/game/assets/PackTypes.ts`

---

## Pack Profile Pic

```typescript
interface PackProfilePic {
  name: string;                     // "Portrait 1"
  filename: string;                 // "pic_0.png"
  description: string;              // "Portrait at 1/4 health"
}
```

---

## Action Mapping (folder → ActionId)

```typescript
// Canonical action IDs used by the engine
type ActionId = 'idle' | 'walk' | 'run' | 'jump' | 'crouch' | 'block'
             | 'hurt' | 'dead' | 'attack1' | 'attack2' | 'special'
             | 'win' | 'intro';

// Pack folder names that map to ActionIds
const PACK_ACTION_MAP: Record<string, ActionId> = {
  // Direct mappings
  idle:    'idle',
  walk:    'walk',
  run:     'run',
  jump:    'jump',
  crouch:  'crouch',
  block:   'block',
  hurt:    'hurt',
  ko:      'dead',
  win:     'win',
  intro:   'intro',
  special: 'special',
  // Remapped folders
  punch:   'attack1',
  kick:    'attack2',
  attack3: 'attack1',   // Alternate attack
  idle2:   'idle',       // Alternate idle
  cast:    'special',    // Magic = special
  shot:    'special',    // Ranged = special
};
```

**Source**: `src/game/assets/PackTypes.ts`

---

## Fighter Registry Entry (Runtime)

Populated at boot from loaded manifests.

```typescript
interface FighterRegistryEntry {
  id: string;                                       // snake_case
  displayName: string;
  tagline: string;
  bio: string;
  motivation: string;
  frameWidth: number;                               // 128
  frameHeight: number;                              // 128
  actions: Partial<Record<ActionId, FighterAnimationData>>;
  profilePics: readonly PackProfilePic[];
  specialCombo: string;                             // Combo notation
}

interface FighterAnimationData {
  key: string;            // Phaser animation key: "fighter:fighterId:actionId"
  textureKey: string;     // Phaser texture key: "fighter/fighterId/actionId"
  frameCount: number;
  loop: boolean;
  frameDurations: number[]; // Per-frame delay in ms
}
```

**Source**: `src/game/assets/fighterRegistry.ts`

---

## Background Registry Entry (Runtime)

```typescript
interface BackgroundRegistryEntry {
  id: string;                 // snake_case
  displayName: string;
  description: string;
  file: string;               // Filename in public/backgrounds/
  type: 'image' | 'video' | 'gif';
}
```

**Source**: `src/game/assets/backgroundRegistry.ts`

---

## Audio Registry Entry (Runtime)

```typescript
interface AudioRegistryEntry {
  id: string;
  displayName: string;
  description: string;
  file: string;               // Filename in public/audio/
  category: 'announcer' | 'impact' | 'music' | 'ui' | 'sfx';
}
```

**Source**: `src/game/audio/AudioManager.ts`

---

## Asset Key Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Fighter texture | `fighter/{fighterId}/{actionId}` | `fighter/ninja_jan/idle` |
| Fighter animation | `fighter:{fighterId}:{actionId}` | `fighter:ninja_jan:idle` |
| Fighter profile pic | `fighter/{fighterId}/profile/{index}` | `fighter/ninja_jan/profile/0` |
| Background | `bg/{backgroundId}` | `bg/volcano_customer_support_hotline` |
| Audio | `audio/{audioId}` | `audio/announcer_fight` |

**Source**: `src/game/assets/AssetKeys.ts`

---

## Entity Relationships

```
packs.json (string[])
    │
    ▼
PackManifest (per fighter)
├── character: PackCharacter (identity)
├── animations[]: PackAnimation
│   ├── frames[]: PackFrame
│   │   └── hitboxes[]: PackHitbox
│   └── spriteSheet: path → Phaser spritesheet texture
├── profilePics[]: PackProfilePic → Phaser image textures
│
└── ► Populates FighterRegistryEntry (runtime)
        └── actions: Record<ActionId, FighterAnimationData>
            └── key → Phaser animation

backgrounds.json → BackgroundRegistryEntry[] → Phaser image/video textures
audio.json → AudioRegistryEntry[] → Phaser audio objects
```
