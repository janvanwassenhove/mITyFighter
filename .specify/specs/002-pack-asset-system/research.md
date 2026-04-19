# Research: Pack-Based Asset System

**Feature**: 002-pack-asset-system
**Date**: 2026-04-19 (retroactive)
**Status**: Decisions implemented

---

## ADR-007: Pack-Based Content Architecture

**Context**: DevoxxFighter needs to support 20+ fighters, each with 13–16 animations, profile pics, and metadata. Content should be addable by non-developers (artists, designers) without modifying TypeScript source code.

**Decision**: Self-contained pack folders under `public/packs/<fighterId>/`, each with a `manifest.json` describing the character and all its assets. A central `packs.json` index lists available packs. The game discovers content at boot time by loading these JSON files.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Hardcoded registry in TypeScript | Adding content requires code changes; not artist-friendly |
| Convention-only (scan directories) | Browsers can't enumerate directories; needs explicit index |
| Single atlas per fighter | Limits animation count; harder to update individual actions |
| Database/CMS backend | Over-engineering; game is client-only static site |

**Consequences**: Adding a fighter = create folder + manifest + spritesheets. No TypeScript changes. Trade-off: many HTTP requests at boot (1 manifest per fighter) — acceptable for 20 fighters, may need bundling at scale.

**Reference**: `src/game/assets/PackLoader.ts`, `public/data/packs.json`, Constitution Article III

---

## ADR-008: JSON Registries for All Content Types

**Context**: Beyond fighters, the game also has backgrounds and audio that need the same data-driven pattern. Each type has different metadata (backgrounds have dimensions/type; audio has categories/volume).

**Decision**: Three JSON registries loaded at boot:
- `public/data/packs.json` → fighter pack IDs
- `public/data/backgrounds.json` → background entries (id, file, type, description)
- `public/data/audio.json` → audio entries (id, file, category)

Each populates a typed runtime registry used throughout the game.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Single combined JSON | Different schemas; hard to maintain; slower to parse |
| TypeScript const objects | Requires rebuild to add content; violates Article III |
| YAML/TOML | Browser-native JSON parsing is simpler; no extra dependencies |

**Consequences**: Boot sequence has 3 JSON fetches + N manifest fetches. Runtime registries are dynamically typed from JSON, requiring validation at load boundaries.

**Reference**: `src/game/assets/fighterRegistry.ts`, `src/game/assets/backgroundRegistry.ts`, `src/game/audio/AudioManager.ts`

---

## ADR-009: Manifest-Driven Animation Timing

**Context**: Different animations have different frame counts and per-frame durations (e.g., a punch's startup frame lasts 60ms but the impact frame lasts 30ms). Standard Phaser animations use a fixed frameRate for all frames.

**Decision**: Pack manifests define per-frame `delay` values in milliseconds. Animations are created using Phaser's frame-level duration overrides rather than a global frameRate. This gives artists precise timing control.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Fixed FPS per action category | Loses per-frame timing nuance (startup vs active frames) |
| Separate timing JSON | Fragments data; manifest should be self-contained |
| Hardcoded in TypeScript | Requires code changes per fighter; violates Article III |

**Consequences**: Manifest is the source of truth for animation timing. The `ANIMATIONS.md` doc category-level FPS values are approximate guidelines; actual timing comes from manifests.

**Reference**: `public/packs/*/manifest.json`, `src/game/assets/PackLoader.ts`

---

## ADR-010: Action Folder-to-ActionId Mapping

**Context**: Pack folders use human-readable names (`punch`, `kick`, `special`) but the engine uses canonical `ActionId` values (`attack1`, `attack2`, `special`). The mapping must be explicit and consistent.

**Decision**: A `PACK_ACTION_MAP` in `PackTypes.ts` maps folder names to `ActionId` values. Direct-match folders (e.g., `idle` → `idle`) pass through; remapped folders (e.g., `punch` → `attack1`, `kick` → `attack2`) are explicitly listed.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Force folder names to match ActionIds | Unintuitive for artists ("attack1" vs "punch") |
| Mapping in manifest.json | Duplicates mapping per fighter; inconsistent across packs |
| Regex/heuristic matching | Fragile; hard to debug when mappings fail |

**Consequences**: Adding a new action requires updating `PACK_ACTION_MAP` in one place. All fighters share the same mapping rules.

**Reference**: `src/game/assets/PackTypes.ts`

---

## ADR-011: Auto-Detected Frame Counts

**Context**: Sprite strips have varying numbers of frames (idle might be 5, attack might be 8). Hardcoding counts is error-prone and requires updates when sprites change.

**Decision**: Frame count auto-detected at load time: `frameCount = texture.width / FRAME_WIDTH`. Manifests also declare `frameCount` for validation, but the runtime calculation is authoritative.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Hardcoded in registry | Maintenance burden; out-of-sync bugs |
| Manifest-only count | Requires manual update when sprites change |
| Metadata file per sprite | Too many files; manifest already has the data |

**Consequences**: Sprite strips MUST be exact multiples of 128px wide. A 640px strip = 5 frames. Non-multiple widths are caught by `validate-assets.ts`.

**Reference**: `src/game/assets/AssetKeys.ts`, `tools/validate-assets.ts`, Constitution Article V
