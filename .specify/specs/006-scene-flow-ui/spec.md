# Feature Specification: Scene Flow & UI

**Status**: Delivered
**Reverse-Engineered**: 2026-04-19
**Source**: `src/game/scenes/`, `src/game/ui/`, `src/game/config/themes.ts`

## User Scenarios & Testing

### User Story 1 — Full Menu Flow (Priority: P1)
The game presents a complete menu flow: Title → Mode Select → Character Select → Stage Select → Fight, with ESC providing consistent back-navigation at every step.

**Why this priority**: Players need to navigate the game and reach gameplay.
**Independent Test**: Navigate through all menu screens and back, verify transitions work correctly.

**Acceptance Scenarios**:
1. **Given** the title screen, **When** player presses start, **Then** mode select appears
2. **Given** mode select, **When** "2P" chosen, **Then** character select appears for both players
3. **Given** any menu scene, **When** ESC pressed, **Then** navigation returns to the previous scene
4. **Given** the fight scene, **When** ESC pressed, **Then** a pause menu appears (Resume/Quit)

### User Story 2 — Theme System (Priority: P3)
The game supports switchable visual themes (Classic and Devoxx France 2026) affecting colors, fonts, and UI styling. Theme preference persists in localStorage.

**Acceptance Scenarios**:
1. **Given** the settings screen, **When** theme is changed to "Devoxx FR 2026", **Then** all UI elements update to the new color palette
2. **Given** a theme was selected, **When** the game restarts, **Then** the previously selected theme is applied

### User Story 3 — Announcer & Health Bar HUD (Priority: P1)
During fights, an MK-style HUD shows dual health bars with animated drain, round indicators, player names, and big-text announcements ("FIGHT!", "KO!", "WINS!").

**Acceptance Scenarios**:
1. **Given** a fight starts, **When** the countdown ends, **Then** "FIGHT!" appears with announcer audio
2. **Given** a fighter takes damage, **When** health decreases, **Then** the health bar smoothly animates to the new value
3. **Given** a KO occurs, **When** triggered, **Then** "KO!" displays and the round ends

## Requirements (As Implemented)

### Functional Requirements
- **FR-001**: 13 scenes with defined transition graph — `GameApp.ts`
- **FR-002**: ESC key provides consistent back-navigation — all scenes
- **FR-003**: Mobile back button (◀ BACK) in top-left — all menu scenes
- **FR-004**: Two themes: Classic and Devoxx France 2026 — `themes.ts`
- **FR-005**: Theme persistence in localStorage — `themes.ts`
- **FR-006**: Dual health bars with animated drain — `HealthBarUI.ts`
- **FR-007**: Round win indicators — `HealthBarUI.ts`
- **FR-008**: Announcer text with scale animation + audio — `AnnouncerUI.ts`
- **FR-009**: Loading progress bar during asset preload — `PreloadScene.ts`
- **FR-010**: Debug overlay (F1) showing tick count, FPS, positions — `DebugOverlay.ts`
- **FR-011**: Settings scene with controls config, theme picker, layout picker — `SettingsScene.ts`
- **FR-012**: About/credits scene — `AboutScene.ts`

## Implementation Notes
- 13 Phaser scenes orchestrated by `GameApp.ts`
- Theme colors consumed via `getActiveTheme()` — no hardcoded hex values in scenes
- Scene data passed via Phaser `scene.start(key, data)` init pattern
