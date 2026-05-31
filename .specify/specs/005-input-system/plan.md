# Implementation Plan: Input System

**Branch**: N/A (retroactive) | **Date**: 2026-04-19 | **Spec**: [spec.md](spec.md)

## Summary
A dual-player input system using split keyboard zones for ghost-free local multiplayer, 16-bit bitmask InputFrames for deterministic simulation, AZERTY auto-detection for French keyboards, and an input ring buffer for future rollback netplay.

## Technical Context
**Language/Version**: TypeScript ^5.3 (strict mode)
**Primary Dependencies**: Phaser 3 ^3.70 (keyboard events), navigator.keyboard API (layout detection)
**Testing**: Vitest ^1.0
**Target Platform**: Browser (ES2020), touch devices (mobile/tablet)
**Performance Goals**: Zero-allocation input capture at 60Hz
**Constraints**: No keyboard ghosting between players; sim/ layer uses InputFrame only

## Constitution Check (Retroactive)

### Deterministic Simulation Gate (Article II) ✅
- [x] InputFrame is framework-agnostic (16-bit number)
- [x] InputFrame.ts lives in sim/ with zero Phaser imports
- [x] Input sampled at fixed tick boundaries, not per-render-frame

### Separation of Concerns Gate (Article VI) ✅
- [x] InputManager (input layer) produces InputFrames
- [x] Simulation consumes InputFrames — no key event knowledge
- [x] Renderer has no input dependencies

## Architecture

### Module Layout
```
src/game/input/
├── InputBindings.ts      # Key-to-action maps for P1, P2, meta actions
├── InputManager.ts       # Tracks keydown/keyup → captures InputFrames
├── InputCapture.ts       # Ring buffer for input history
├── KeyboardLayout.ts     # AZERTY auto-detection
└── TouchControls.ts      # Virtual joystick + buttons for mobile

src/game/sim/
└── InputFrame.ts         # 16-bit bitmask type + bitwise utilities
```

### Input Flow
```
Keyboard Event (keydown/keyup)
    │
    ▼
InputManager.handleKeyDown(code)
    │ Maps via InputBindings → player + action
    ▼
Per-Player Key State Map (KeyCode → pressed boolean)
    │
    ▼ (at each sim tick, not per event)
InputManager.captureFrame(playerId): InputFrame
    │ Reads key state → sets bitmask flags
    ▼
InputFrame (16-bit number)
    │
    ├──► FixedTimestepLoop (consumed by sim)
    └──► InputCapture ring buffer (stored for rollback)
```

### Key Binding Architecture
```typescript
// Three binding sets per player
P1_BINDINGS: { KeyW: UP, KeyA: LEFT, KeyD: RIGHT, KeyS: DOWN, KeyF: ATTACK1, ... }
P2_NUMPAD:   { ArrowUp: UP, ArrowLeft: LEFT, Numpad1: ATTACK1, ... }
P2_NO_NUMPAD: { KeyI: UP, KeyJ: LEFT, KeyU: ATTACK1, ... }

// Meta bindings (not in InputFrame — trigger callbacks)
META_BINDINGS: { F1: toggleDebug, KeyQ: cycleP1Left, KeyE: cycleP1Right, ... }
```

## Key Technical Decisions

See [research.md](research.md) for full ADRs:
- **ADR-012**: Split keyboard zones (anti-ghosting)
- **ADR-013**: Bitmask input over structured objects
- **ADR-014**: AZERTY auto-detection via navigator.keyboard
- **ADR-015**: Input ring buffer for rollback
