# Feature Specification: Story Mode

**Status**: Delivered
**Reverse-Engineered**: 2026-04-19
**Source**: `src/game/state/StoryModeState.ts`, `src/game/scenes/StorySelectScene.ts`, `src/game/scenes/DifficultySelectScene.ts`, `src/game/scenes/StoryModeScene.ts`

## User Scenarios & Testing

### User Story 1 — Story Mode Progression (Priority: P1)
A single player selects a fighter, chooses a difficulty, and fights through a sequence of AI opponents. Each fight has pre-fight dialogue and victory text. The sequence scales with difficulty (3–10 fights) and ends with a boss fight.

**Why this priority**: Single-player content is essential for solo play and demo scenarios.
**Independent Test**: Start story mode, complete fights, verify progression through fight sequence.

**Acceptance Scenarios**:
1. **Given** story mode selected, **When** player picks a fighter and difficulty, **Then** a fight sequence is generated
2. **Given** difficulty "Easy", **When** story generates, **Then** 3 fights are created with a medium-difficulty boss
3. **Given** difficulty "Nightmare", **When** story generates, **Then** 10 fights with a nightmare boss
4. **Given** a fight is won, **When** the story advances, **Then** the next opponent is shown with pre-fight dialogue
5. **Given** the player loses, **When** continues remain, **Then** the player can retry the same fight

### User Story 2 — AI Opponent (Priority: P1)
CPU opponents use a behavior-based AI that adapts to difficulty level. AI selects from approach, retreat, pressure, defensive, and anti-air patterns.

**Acceptance Scenarios**:
1. **Given** an Easy AI opponent, **When** fighting, **Then** the AI reacts slower and attacks less frequently
2. **Given** a Nightmare AI opponent, **When** fighting, **Then** the AI uses optimal combos and punishes mistakes

## Requirements (As Implemented)

### Functional Requirements
- **FR-001**: Story fight sequence generation based on difficulty — `StoryModeState.ts`
- **FR-002**: Fight count scales: Easy=3, Medium=5, Hard=7, Nightmare=10 — `StoryModeState.ts`
- **FR-003**: Pre-fight dialogue and victory text per opponent — `StoryModeScene.ts`
- **FR-004**: Continue system with limited retries — `StoryModeState.ts`
- **FR-005**: Win/loss tracking and story completion state — `StoryModeState.ts`
- **FR-006**: AI with 4 difficulty tiers and 5 behavior patterns — `FightingAI.ts`
- **FR-007**: Difficulty selection UI (Easy/Medium/Hard/Nightmare) — `DifficultySelectScene.ts`
- **FR-008**: Story character select with bio and motivation display — `StorySelectScene.ts`

### Key Entities
- **StoryProgress**: playerFighterId, difficulty, currentFightIndex, wins, losses, continuesRemaining
- **StoryFight**: opponentId, stageId, difficulty, preFightText, victoryText, isBoss
- **AIDifficulty**: easy | medium | hard | nightmare

## Known Issues & Technical Debt
- **[KNOWN ISSUE]**: Story dialogue is hardcoded inline in `StoryModeState.ts` — should be data-driven
- **[KNOWN ISSUE]**: AI balance has not been systematically tuned across difficulty levels

## Implementation Notes
- Scene flow: StorySelectScene → DifficultySelectScene → StoryModeScene ↔ FightScene
- AI generates InputFrames that feed into the same simulation as player inputs
- Boss fights use higher difficulty than the selected story difficulty
