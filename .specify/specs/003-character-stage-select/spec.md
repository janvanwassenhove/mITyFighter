# Feature Specification: Character & Stage Selection

**Status**: Delivered
**Reverse-Engineered**: 2026-04-19
**Source**: `src/game/scenes/CharacterSelectScene.ts`, `src/game/scenes/StageSelectScene.ts`

## User Scenarios & Testing

### User Story 1 — MK-Style Fighter Selection (Priority: P1)
Both players simultaneously choose their fighter from a grid of character portraits. A cursor per player navigates the grid. Profile pics and fighter names display as cursors move. Both players must confirm before proceeding.

**Why this priority**: Required to start any fight — gateway to core gameplay.
**Independent Test**: Open CharacterSelectScene, navigate cursors, confirm selections, verify data passes to next scene.

**Acceptance Scenarios**:
1. **Given** the character select screen, **When** it loads, **Then** a 6×4 grid of fighter portraits is displayed
2. **Given** P1 and P2 cursors, **When** P1 moves with WASD and P2 with arrows, **Then** cursors move independently on the grid
3. **Given** both players confirmed, **When** selections lock in, **Then** the scene transitions to StageSelectScene with selected fighter IDs

### User Story 2 — Stage Selection (Priority: P2)
After fighter selection, players choose a stage (background) from a carousel with full-screen preview.

**Acceptance Scenarios**:
1. **Given** the stage select screen, **When** it loads, **Then** available stages are shown with preview images
2. **Given** a stage is highlighted, **When** confirmed, **Then** the scene transitions to FightScene with the selected stage

## Requirements (As Implemented)

### Functional Requirements
- **FR-001**: 6×4 portrait grid populated from fighter registry — `CharacterSelectScene.ts`
- **FR-002**: Dual cursor navigation (P1: WASD, P2: arrows) — `CharacterSelectScene.ts`
- **FR-003**: Profile pic display on cursor hover — `CharacterSelectScene.ts`
- **FR-004**: Fighter name and tagline display — `CharacterSelectScene.ts`
- **FR-005**: Confirmation lock-in per player — `CharacterSelectScene.ts`
- **FR-006**: Stage carousel with full-screen preview — `StageSelectScene.ts`
- **FR-007**: Data passthrough via scene init (fighter IDs, stage ID) — scene transitions

## Implementation Notes
- Primary modules: `src/game/scenes/CharacterSelectScene.ts`, `src/game/scenes/StageSelectScene.ts`
- Uses profile pics from pack manifests for portraits
- Scene data flow: ModeSelectScene → CharacterSelectScene → StageSelectScene → FightScene
