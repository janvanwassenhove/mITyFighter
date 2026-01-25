# Animation Conventions

> **Spec-Kit Document** - Update this before modifying animation-related code.

## Action IDs

The canonical set of action identifiers:

```typescript
type ActionId =
  | 'idle' | 'idle2'
  | 'walk' | 'run' | 'jump'
  | 'hurt' | 'dead'
  | 'attack1' | 'attack2' | 'attack3'
  | 'special' | 'cast'
  | 'eating' | 'spine'
  | 'blade' | 'kunai'
  | 'dart' | 'shot' | 'disguise';
```

## Animation Key Format

```
fighter:<fighterId>:<actionId>
```

Examples:
- `fighter:kunoichi:idle`
- `fighter:homeless_1:attack1`
- `fighter:ninja_monk:blade`

## Frame Rates

| Action Category | Frame Rate | Notes |
|-----------------|------------|-------|
| Idle animations | 8 fps | Slow, breathing feel |
| Movement (walk) | 10 fps | Natural pace |
| Movement (run) | 12 fps | Faster pace |
| Combat (attacks) | 15 fps | Snappy response |
| Jump | 12 fps | Match gravity feel |
| Hurt/Dead | 10 fps | Readable impact |
| Special | 12 fps | Varies by effect |

Default: **10 fps** if not specified.

## Looping Behavior

| Action | Loops | Notes |
|--------|-------|-------|
| idle, idle2 | Yes | Continuous |
| walk, run | Yes | Continuous |
| jump | No | Single play |
| hurt | No | Single play, return to idle |
| dead | No | Stays on last frame |
| attack1, attack2, attack3 | No | Return to idle |
| special, cast | No | Return to idle |
| All others | No | Return to idle |

## Completion Handling

When a non-looping animation completes:

1. **If `idle` exists**: Transition to `idle`
2. **If `idle` missing but `idle2` exists**: Use `idle2`
3. **If no idle available**: Stay on current animation's last frame

```typescript
// Priority order for fallback
const IDLE_FALLBACKS = ['idle', 'idle2'] as const;
```

## Creating Animations

Animations are created automatically during asset loading:

```typescript
// For each action in fighter registry:
this.anims.create({
  key: `fighter:${fighterId}:${actionId}`,
  frames: this.anims.generateFrameNumbers(textureKey, {
    start: 0,
    end: frameCount - 1
  }),
  frameRate: getFrameRate(actionId),
  repeat: isLooping(actionId) ? -1 : 0
});
```

## Missing Animation Handling

If an action's sprite strip doesn't exist:

1. **Log warning** (not error) during load
2. **Skip animation creation** for that action
3. **At runtime**: Check `hasAnimation()` before playing
4. **Fallback**: Keep current animation if requested one missing

```typescript
// Safe animation play
if (this.hasAnimation(fighterId, actionId)) {
  sprite.play(animKey);
} else {
  console.warn(`Animation missing: ${animKey}`);
}
```

## Animation Events

Key animation events for game logic:

| Event | Use Case |
|-------|----------|
| `animationcomplete` | Trigger idle transition |
| `animationupdate` | Hit detection frames |
| `animationstart` | Sound effects |

## Frame Data (Future)

For competitive play, frame data will be added:

```typescript
interface FrameData {
  startup: number;      // Frames before active
  active: number;       // Active hitbox frames
  recovery: number;     // Frames after active
  advantage: number;    // Frame advantage on hit
  damage: number;       // Base damage
}
```

This is defined in `SimTypes.ts` for future implementation.

## Debug Information

The debug overlay (F1) displays:
- Current fighter ID
- Current action ID
- Current frame index
- Total frames in animation
- Frame rate
