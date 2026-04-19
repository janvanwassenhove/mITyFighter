# Data Model: Story Mode

**Feature**: 004-story-mode
**Date**: 2026-04-19 (retroactive)

---

## StoryProgress

Tracks the player's current position in a story run.

```typescript
interface StoryProgress {
  playerFighterId: string;      // Which character the player chose
  difficulty: AIDifficulty;     // easy | medium | hard | nightmare
  currentFightIndex: number;    // 0-based index into StoryFight[]
  wins: number;                 // Total fights won
  losses: number;               // Total fights lost (includes retries)
  isComplete: boolean;          // True when all fights finished
  continuesRemaining: number;   // Starts at MAX_CONTINUES (3)
}
```

**Lifecycle**:
- Created by `createStoryProgress(fighterId, difficulty)`
- Updated by `advanceStory(progress)` on win
- Updated by `handleDefeat(progress)` on loss
- Terminal when `isComplete = true` or `continuesRemaining = 0`

**Source**: `src/game/state/StoryModeState.ts`

---

## StoryFight

A single fight in the story sequence.

```typescript
interface StoryFight {
  opponentId: string;           // Fighter ID to fight against
  stageId: string;              // Background ID for this fight
  difficulty: AIDifficulty;     // AI difficulty for THIS specific fight
  preFightText: string;         // Dialogue shown before fight
  victoryText: string;          // Dialogue shown after winning
  isBoss: boolean;              // True for the final fight
}
```

**Generation**: Created by `generateStoryFights(playerFighterId, difficulty)` which produces an array of 6 StoryFight objects.

**Source**: `src/game/state/StoryModeState.ts`

---

## AIDifficulty & DifficultyConfig

```typescript
type AIDifficulty = 'easy' | 'medium' | 'hard' | 'nightmare';

interface DifficultyConfig {
  reactionFrames: number;        // Ticks before AI reacts (lower = faster)
  optimalDecisionChance: number; // 0–1, probability of smart choice
  blockChance: number;           // 0–1, probability to block incoming attacks
  attackCooldown: number;        // Minimum ticks between attacks
  comboChance: number;           // 0–1, probability to attempt a combo
  aggression: number;            // 0–1, offensive vs defensive bias
}
```

### Difficulty Scaling Table

| Parameter | Easy | Medium | Hard | Nightmare |
|-----------|:----:|:------:|:----:|:---------:|
| reactionFrames | 30 | 18 | 10 | 5 |
| optimalDecisionChance | 0.3 | 0.5 | 0.75 | 0.95 |
| blockChance | 0.2 | 0.5 | 0.75 | 0.9 |
| attackCooldown | 60 | 40 | 25 | 15 |
| comboChance | 0.1 | 0.3 | 0.5 | 0.8 |
| aggression | 0.3 | 0.5 | 0.7 | 0.85 |

**Source**: `src/game/sim/FightingAI.ts`

---

## AIContext

Per-tick context snapshot passed to AI for decision-making.

```typescript
interface AIContext {
  distance: number;              // Pixel distance to opponent
  opponentAttacking: boolean;    // Opponent in an attack state
  opponentJumping: boolean;      // Opponent airborne
  opponentCrouching: boolean;    // Opponent crouching
  selfHealthPercent: number;     // 0–1, own health ratio
  opponentHealthPercent: number; // 0–1, opponent health ratio
  grounded: boolean;             // Self on ground
  facing: number;                // -1 (left) or 1 (right)
  opponentDirection: number;     // -1 or 1, direction toward opponent
}
```

**Source**: `src/game/sim/FightingAI.ts`

---

## AI Behavior States

```typescript
type AIBehavior =
  | 'approach'       // Move toward opponent
  | 'retreat'        // Move away from opponent
  | 'pressure'       // Stay close, attack frequently
  | 'defensive'      // Block, wait for counter-attack opening
  | 'jump_attack'    // Jump toward opponent with aerial attack
  | 'anti_air'       // Counter-attack opponent's jump
  | 'idle';          // Observe, wait
```

### Decision Priority Chain
```
1. opponent jumping + optimal roll?        → anti_air
2. opponent attacking + block roll?        → defensive
3. self health < 30%?                      → retreat
4. opponent health < 30% + self > 50%?     → pressure
5. distance > threshold?                   → approach
6. distance < close range?                 → pressure / jump_attack
7. default                                 → idle
```

---

## AI Combo Sequence

```typescript
interface ComboState {
  active: boolean;
  step: number;       // 1, 2, or 3
  timer: number;      // Ticks remaining before combo expires (starts at 40)
}

// Step → InputFrame mapping:
// Step 1: ATTACK1
// Step 2: Move forward + ATTACK2
// Step 3: SPECIAL (or ATTACK2 fallback)
```

---

## Fight Sequence Generation

```typescript
// Difficulty progression within a 6-fight story:
const PROGRESSION = [
  easy,       // Fight 1
  easy,       // Fight 2
  medium,     // Fight 3
  medium,     // Fight 4
  hard,       // Fight 5
  nightmare,  // Fight 6 (boss) — always nightmare regardless of story difficulty
];

// Higher story difficulty shifts the curve:
// Story "medium" → [medium, medium, hard, hard, nightmare, nightmare]
// Story "hard" → [hard, hard, hard, nightmare, nightmare, nightmare]

const MAX_CONTINUES = 3;
const FINAL_BOSS_ID = 'elder_honkstorm';  // Fallback: random → mirror match
```

---

## Entity Relationships

```
StorySelectScene
    └── picks playerFighterId
        │
        ▼
DifficultySelectScene
    └── picks AIDifficulty
        │
        ▼
generateStoryFights(playerFighterId, difficulty)
    └── StoryFight[6]
        │
        ▼
createStoryProgress(playerFighterId, difficulty)
    └── StoryProgress { currentFightIndex: 0, continuesRemaining: 3 }
        │
        ▼
StoryModeScene ←──────────────────────────────────┐
    │                                              │
    ▼                                              │
FightScene (receives storyProgress + storyFights)  │
    │                                              │
    ├── WIN  → advanceStory(progress) ─────────────┘
    │          (currentFightIndex++, wins++)
    │
    └── LOSE → handleDefeat(progress)
               ├── continuesRemaining > 0 → retry same fight
               └── continuesRemaining = 0 → game over
```
