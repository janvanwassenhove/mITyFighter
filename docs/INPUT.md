# Input System

> **Spec-Kit Document** - Update this before modifying input-related code.

## Design Goals

1. **Zero ghosting** between players on shared keyboard
2. **Multiplayer-ready** input capture from day 1
3. **Deterministic** input processing for netplay
4. **Configurable** bindings without code changes

## Key Zones

To prevent keyboard ghosting, players use completely separate keyboard regions:

### Player 1: LEFT Side
```
┌───┬───┬───┬───┬───┬───┬───┐
│ Q │ W │ E │ R │ T │ Y │   │
├───┼───┼───┼───┼───┼───┼───┤
│ A │ S │ D │ F │ G │ H │   │
└───┴───┴───┴───┴───┴───┴───┘
```

### Player 2: RIGHT Side (with Numpad)
```
┌───┬───┬───┐    ┌───┬───┬───┬───┐
│ ↑ │   │   │    │ 7 │ 8 │ 9 │   │
├───┼───┼───┤    ├───┼───┼───┼───┤
│ ← │ ↓ │ → │    │ 4 │ 5 │ 6 │   │
└───┴───┴───┘    ├───┼───┼───┼───┤
                 │ 1 │ 2 │ 3 │   │
                 ├───┴───┼───┼───┤
                 │   0   │ . │   │
                 └───────┴───┴───┘
```

### Player 2: RIGHT Side (Laptop/No Numpad)
```
┌───┬───┬───┬───┬───┬───┬───┐
│   │   │   │   │ Y │ U │ I │ O │ P │
├───┼───┼───┼───┼───┼───┼───┼───┼───┤
│   │   │   │   │   │ J │ K │ L │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┘
```

## Default Key Bindings

### Player 1 (Always)

| Action | Key | Key Code |
|--------|-----|----------|
| Move Left | A | KeyA |
| Move Right | D | KeyD |
| Jump | W | KeyW |
| Crouch | S | KeyS |
| Attack 1 | F | KeyF |
| Attack 2 | G | KeyG |
| Special | H | KeyH |
| Block | R | KeyR |
| Cycle Fighter ← | Q | KeyQ |
| Cycle Fighter → | E | KeyE |

### Player 2 (Numpad Mode - Default)

| Action | Key | Key Code |
|--------|-----|----------|
| Move Left | ← | ArrowLeft |
| Move Right | → | ArrowRight |
| Jump | ↑ | ArrowUp |
| Crouch | ↓ | ArrowDown |
| Attack 1 | Numpad 1 | Numpad1 |
| Attack 2 | Numpad 2 | Numpad2 |
| Special | Numpad 3 | Numpad3 |
| Block | Numpad 0 | Numpad0 |
| Cycle Fighter ← | U | KeyU |
| Cycle Fighter → | O | KeyO |

### Player 2 (No-Numpad Mode)

| Action | Key | Key Code |
|--------|-----|----------|
| Move Left | J | KeyJ |
| Move Right | L | KeyL |
| Jump | I | KeyI |
| Crouch | K | KeyK |
| Attack 1 | U | KeyU |
| Attack 2 | O | KeyO |
| Special | P | KeyP |
| Block | Y | KeyY |
| Cycle Fighter ← | 8 | Digit8 |
| Cycle Fighter → | 9 | Digit9 |

## Configuration

```typescript
// In gameConfig.ts
export const INPUT_CONFIG = {
  useNumpad: true,  // Set false for laptops
} as const;
```

## Global Controls

| Action | Key | Notes |
|--------|-----|-------|
| Toggle Debug | F1 | Shows overlay |
| Cycle Background | Z/C | Z = prev, C = next |
| Pause/Menu | Escape | Opens pause menu in fight, goes back in menus |

## Navigation Controls

### ESC Key Behavior

Pressing ESC provides consistent back/menu navigation throughout the game:

| Scene | ESC Action |
|-------|------------|
| TitleScene | No action (start screen) |
| ModeSelectScene | Return to TitleScene |
| CharacterSelectScene | Return to ModeSelectScene |
| StageSelectScene | Return to CharacterSelectScene |
| FightScene | Open pause menu (Resume/Quit options) |
| StorySelectScene | Return to ModeSelectScene |
| DifficultySelectScene | Return to StorySelectScene |
| StoryModeScene | Return to ModeSelectScene |

### Mobile Back Button

On touch devices, a back button (◀ BACK) appears in the top-left corner of each scene for navigation. In FightScene, a pause button (⏸) is shown instead, which opens the pause menu.

## InputFrame Format

For netplay compatibility, inputs are captured as a compact bitmask:

```typescript
/**
 * 16-bit input frame per player
 * 
 * Bit layout:
 * [0]  Left
 * [1]  Right
 * [2]  Up (Jump)
 * [3]  Down (Crouch)
 * [4]  Attack1
 * [5]  Attack2
 * [6]  Special
 * [7]  Block
 * [8-15] Reserved for future use
 */
type InputFrame = number;

// Bit flags
const INPUT = {
  LEFT:     0b00000001,
  RIGHT:    0b00000010,
  UP:       0b00000100,
  DOWN:     0b00001000,
  ATTACK1:  0b00010000,
  ATTACK2:  0b00100000,
  SPECIAL:  0b01000000,
  BLOCK:    0b10000000,
} as const;
```

## Input Capture Flow

```
┌─────────────────┐
│ Keyboard Event  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ InputManager    │ Maps key to player + action
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Per-Player      │ Maintains current input state
│ Input State     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fixed Tick      │ Samples state → InputFrame
│ (60 Hz)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ InputFrame      │ Compact bitmask for netplay
│ Buffer          │
└─────────────────┘
```

## Fixed Timestep Integration

Inputs are sampled at fixed tick rate (60 Hz default):

```typescript
// Each fixed tick:
const p1Input = inputManager.captureFrame(PlayerId.P1);
const p2Input = inputManager.captureFrame(PlayerId.P2);

// Store for rollback
inputBuffer.push({ tick, p1Input, p2Input });

// Apply to simulation
simulation.step(p1Input, p2Input);
```

## Input Recording/Replay

For netplay rollback and replays:

```typescript
interface InputRecord {
  tick: number;
  inputs: [InputFrame, InputFrame]; // P1, P2
}

// Record
const recording: InputRecord[] = [];

// Replay
for (const record of recording) {
  simulation.step(record.inputs[0], record.inputs[1]);
}
```

## Ghosting Prevention

Keyboard ghosting occurs when multiple keys pressed simultaneously don't all register. Our solution:

1. **Physical separation**: P1 and P2 use opposite sides of keyboard
2. **Minimal simultaneous keys**: Most actions need 1-2 keys max
3. **No overlapping bindings**: Each key belongs to exactly one player

## Touch Controls (Mobile/Tablet)

On touch-enabled devices (tablets, phones), virtual controls are displayed automatically.

### Detection

Touch controls are shown when:
- Device supports touch (`'ontouchstart' in window` or `navigator.maxTouchPoints > 0`)
- AND (mobile user agent detected OR screen width ≤ 1366px)

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│                        Game View                             │
│                                                              │
│                                                              │
│                                                              │
├────────────────────────┬─────────────────────────────────────┤
│   Virtual Joystick     │              Action Buttons         │
│   ┌───────┐            │                      ┌───┐ ┌───┐   │
│   │   ○   │            │                      │ A │ │ B │   │
│   │  ╱│╲  │            │                      └───┘ └───┘   │
│   └───────┘            │                      ┌───┐ ┌───┐   │
│                        │                      │ S │ │ K │   │
│                        │                      └───┘ └───┘   │
└────────────────────────┴─────────────────────────────────────┘
```

### Player Zones

| Player | Joystick Position | Buttons Position |
|--------|-------------------|------------------|
| P1 | Bottom-left | Bottom-right |
| P2 (2P mode only) | Bottom-right | Bottom-left |

### Button Mapping

| Button | Color | Action | Input Flag |
|--------|-------|--------|------------|
| A | Red | Attack 1 (Punch) | `ATTACK1` |
| B | Cyan | Attack 2 (Kick) | `ATTACK2` |
| S | Yellow | Special | `SPECIAL` |
| K | Green | Block | `BLOCK` |

### Virtual Joystick

- **8-way directional** input based on joystick angle
- **Deadzone**: 20% of joystick radius (prevents accidental input)
- **Directions**: Maps to `LEFT`, `RIGHT`, `UP`, `DOWN` flags
- **Diagonal support**: Can output two directions simultaneously

### Implementation Details

```typescript
// Touch controls are managed by TouchControlsManager
const touchManager = new TouchControlsManager();
touchManager.init(scene, [PlayerId.P1]); // P1 only for 1P mode
touchManager.init(scene, [PlayerId.P1, PlayerId.P2]); // Both for 2P

// Input callback integration
touchManager.setAllInputCallbacks((player, action, active) => {
  inputManager.setActionActive(player, action, active);
});
```

### Scaling

Touch controls scale based on screen size:
- **Scale factor**: `clamp(0.6, minDimension / 720, 1.2)`
- Smaller screens get proportionally smaller controls
- Larger tablets maintain comfortable button sizes

### Files

| File | Purpose |
|------|---------|
| `src/game/input/TouchControls.ts` | Virtual joystick and button implementation |
| `src/game/input/InputManager.ts` | Integrates touch with keyboard input |
| `src/game/scenes/FightScene.ts` | Touch support during fights |
