# Feature Specification: Input System

**Status**: Delivered
**Reverse-Engineered**: 2026-04-19
**Source**: `src/game/input/`, `src/game/sim/InputFrame.ts`

## User Scenarios & Testing

### User Story 1 — Dual-Player Keyboard Input (Priority: P1)
Two players share a single keyboard with zero ghosting. P1 uses the WASD zone (left side), P2 uses arrows + numpad (right side). An alternative no-numpad layout exists for laptops.

**Why this priority**: Local multiplayer is the primary play mode.
**Independent Test**: Both players press keys simultaneously, verify no input interference.

**Acceptance Scenarios**:
1. **Given** P1 presses WASD keys, **When** simultaneously P2 presses arrow keys, **Then** both players' inputs register without ghosting
2. **Given** numpad is unavailable, **When** no-numpad mode is enabled, **Then** P2 uses YUIOP/JKL zone instead
3. **Given** AZERTY keyboard detected, **When** game loads, **Then** P1 bindings adapt (ZQSD instead of WASD)

### User Story 2 — InputFrame Capture (Priority: P1)
Every simulation tick (60Hz), current key states are sampled into a compact 16-bit InputFrame bitmask per player.

**Acceptance Scenarios**:
1. **Given** P1 holds Left + Attack1, **When** tick samples, **Then** InputFrame has bits 0 and 4 set
2. **Given** no keys pressed, **When** tick samples, **Then** InputFrame is 0x0000

### User Story 3 — Touch Controls (Priority: P3)
Mobile/tablet users get virtual joystick + action buttons rendered on screen.

**Acceptance Scenarios**:
1. **Given** a touch device, **When** the fight scene loads, **Then** virtual controls appear on screen

## Requirements (As Implemented)

### Functional Requirements
- **FR-001**: P1 key zone: WASD + FGHR (left keyboard) — `InputBindings.ts`
- **FR-002**: P2 key zone: Arrows + Numpad 0-3 (right keyboard) — `InputBindings.ts`
- **FR-003**: P2 no-numpad variant: YUIOP + JKL — `InputBindings.ts`
- **FR-004**: AZERTY detection via `navigator.keyboard` API with fallback — `KeyboardLayout.ts`
- **FR-005**: 16-bit InputFrame bitmask with 8 action flags — `InputFrame.ts`
- **FR-006**: Meta actions: cycle fighter (Q/E for P1, U/O for P2), debug (F1) — `InputBindings.ts`
- **FR-007**: Key rebinding UI in Settings scene — `SettingsScene.ts`
- **FR-008**: Touch virtual controls with joystick + buttons — `TouchControls.ts`
- **FR-009**: Input ring buffer for replay/rollback capability — `InputCapture.ts`

## Implementation Notes
- Primary modules: `src/game/input/` (5 files), `src/game/sim/InputFrame.ts`
- InputManager tracks keydown/keyup state and generates InputFrames on demand
- Meta actions (cycle character, debug toggle) are callbacks, not part of the InputFrame
