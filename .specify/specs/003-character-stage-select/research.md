# Research: Character & Stage Selection

**Feature**: 003-character-stage-select
**Date**: 2026-04-19 (retroactive)
**Status**: Decisions implemented

---

## ADR-027: Grid-Based Character Select (MK-Style)

**Context**: The game has 20 fighters. Players need to browse and select from the full roster simultaneously. The UI should feel like a classic arcade fighting game.

**Decision**: A 6-column grid of 100×100px portrait cells with 12px gaps. Each player has an independent cursor. P1 navigates with WASD, P2 with arrow keys. Portraits use profile pics from pack manifests; fallback to idle frame 0 if no profile pic exists.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Horizontal carousel (one row) | Can't fit 20 fighters; slow to navigate |
| List/dropdown | Not a fighting game aesthetic; no visual identity |
| Random-only selection | Removes player agency; bad for tournaments |
| 3D rotating roster | Over-engineered; doesn't match pixel-art aesthetic |

**Consequences**: Grid is fixed at 6 columns — with 20 fighters, this means 4 rows with partial fill. Adding fighters beyond 24 would need scrolling or a larger grid. Portrait rendering has a 3-tier fallback chain (profile pic → idle frame → colored rectangle).

**Reference**: `src/game/scenes/CharacterSelectScene.ts`

---

## ADR-028: Dual Independent Cursors

**Context**: In 2P mode, both players select simultaneously on the same grid. In 1P mode, P2 is auto-assigned (random or last AI opponent).

**Decision**: Two cursor objects track grid position independently. Each cursor highlights its cell with a distinct color (P1 blue, P2 red). Cursors can overlap on the same fighter (mirror match). Confirmation is per-player — both must confirm before transitioning.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Sequential selection (P1 then P2) | Slower; not the arcade convention |
| Mouse-only selection | Doesn't support shared-keyboard multiplayer |
| Same fighter blocked | Mirror matches are a fighting game tradition |

**Consequences**: In 1P mode, P2 cursor is auto-confirmed (random fighter or AI-chosen). Mode-specific behavior adds branching in the scene logic. Data passed to StageSelectScene includes both fighter IDs.

**Reference**: `src/game/scenes/CharacterSelectScene.ts`

---

## ADR-029: Full-Screen Stage Preview with DOM Elements

**Context**: Stage selection needs to show what each background looks like at full size. Stages include static images, videos, and GIFs. Phaser's native video support is insufficient.

**Decision**: StageSelectScene uses a DOM container behind the Phaser canvas (same pattern as FightScene — see ADR-025). Left/right navigation cycles through backgrounds with wrapping. Stage name, description, and counter ("3 / 15") are rendered as Phaser text overlaid on the preview.

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|-----------------|
| Thumbnail grid (like character select) | Backgrounds need full-screen preview to evaluate |
| Phaser-only rendering | Can't handle video backgrounds without DOM |
| Split-screen preview | Wastes screen space; doesn't show true scale |

**Consequences**: DOM element must be cleaned up on scene exit. Video backgrounds auto-play and loop during preview. Navigation wraps around the array for seamless cycling.

**Reference**: `src/game/scenes/StageSelectScene.ts`, ADR-025
