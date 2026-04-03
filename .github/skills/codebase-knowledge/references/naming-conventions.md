# Naming Conventions

## File Names

| Type | Convention | Example |
|------|-----------|---------|
| Source files | `PascalCase.ts` | `FightScene.ts`, `CombatSystem.ts` |
| Test files | `camelCase.test.ts` | `inputFrame.test.ts`, `assetKeys.test.ts` |
| Config files | `camelCase.ts` | `gameConfig.ts`, `constants.ts` |
| Doc files | `SCREAMING_SNAKE.md` or `UPPER_CASE.md` | `SPEC_KIT.md`, `ASSETS.md` |

## Identifiers

| Type | Convention | Example |
|------|-----------|---------|
| Fighter ID | `snake_case` | `'ninja_monk'`, `'sir_budgetalot'` |
| Action ID | `camelCase` | `'attack1'`, `'idle2'` |
| Background ID | `snake_case` | `'dojo'`, `'dark_alley'` |
| Constants | `SCREAMING_SNAKE_CASE` | `FRAME_WIDTH`, `GAME_HEIGHT` |
| Classes | `PascalCase` | `InputManager`, `CombatSystem` |
| Functions | `camelCase` | `getFighterTextureKey()`, `hasFlag()` |
| Enums | `PascalCase` (name), `SCREAMING_SNAKE_CASE` (values) | `FighterState.IDLE` |
| Type aliases | `PascalCase` | `InputFrame`, `ComboMove` |

## Asset Keys

| Key Type | Format | Example |
|----------|--------|---------|
| Fighter texture | `fighter:<fighterId>:<actionId>` | `fighter:ninja_monk:idle` |
| Background texture | `bg:<backgroundId>` | `bg:dojo` |
| Audio | `audio:<audioId>` | `audio:hit_light` |

## Import Order (enforced by ESLint)

```typescript
// 1. External packages
import Phaser from 'phaser';

// 2. Type imports
import type { FighterId } from '../assets/fighterRegistry';

// 3. Internal modules (alphabetical)
import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH } from '../config/constants';
```

Blank line between each group.

## JSDoc Requirements

All exported functions must have:
- Description
- `@returns` tag

```typescript
/**
 * Get texture key for a fighter action.
 * @returns Phaser texture key string
 */
export function getFighterTextureKey(id: string, action: string): string { ... }
```
