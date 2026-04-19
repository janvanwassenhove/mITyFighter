# Netplay Roadmap

> **Spec-Kit Document** - Architecture decisions for future online multiplayer.

## Vision

DevoxxFighter aims to support competitive online play with:
- Low-latency gameplay (rollback netcode)
- Tournament-viable stability
- Cross-platform play (browser, PWA, iPad)

## Current Foundation (Phase 1)

What we're building NOW to enable netplay LATER:

### ✅ Deterministic Simulation

```
sim/
  FixedTimestepLoop.ts  - Consistent tick rate
  InputFrame.ts         - Compact input representation
  SimTypes.ts           - Simulation state types
```

**Why it matters**: Both players must compute identical game states from identical inputs. Any randomness or frame-rate dependency breaks netplay.

### ✅ Fixed Timestep Loop

```typescript
const TICK_RATE = 60;  // 60 ticks per second
const TICK_DURATION = 1000 / TICK_RATE;  // ~16.67ms

// Accumulator pattern
let accumulator = 0;
function update(delta: number) {
  accumulator += delta;
  while (accumulator >= TICK_DURATION) {
    simulation.step(currentInputs);
    accumulator -= TICK_DURATION;
  }
}
```

### ✅ Input Frame Capture

Every fixed tick, inputs are captured as a compact bitmask:

```typescript
type InputFrame = number;  // 16-bit per player

// Captured at fixed tick boundaries
const frame = inputManager.captureFrame(playerId);
```

### ✅ Render vs Simulation Separation

```
sim/     - Pure logic, no Phaser dependencies
render/  - Phaser rendering, interpolation
```

**Why it matters**: Simulation can run headless for prediction/rollback.

### ✅ State Serialization Seam

```typescript
interface SimulationState {
  tick: number;
  players: PlayerState[];
  // Future: projectiles, effects, etc.
}

// Seam for future implementation
interface ISimulation {
  getState(): SimulationState;
  setState(state: SimulationState): void;
  step(inputs: [InputFrame, InputFrame]): void;
}
```

## Future Implementation

### Phase 2: Local Rollback Testing

- Implement full state serialization
- Add artificial latency simulation
- Test rollback with input delay

### Phase 3: Netcode Foundation

Two approaches considered:

#### Option A: Lockstep (Simpler)

```
P1 Input ─────►┌─────────┐
               │ Server  │──► Broadcast inputs
P2 Input ─────►└─────────┘
                    │
                    ▼
              Both clients
              simulate same
              tick together
```

**Pros**: Simpler, guaranteed sync
**Cons**: Latency = slowest player

#### Option B: Rollback (Recommended)

```
         ┌──────────────────────────────────┐
         │         Local Timeline           │
         ├──────────────────────────────────┤
Tick:    │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │
         ├───┼───┼───┼───┼───┼───┼───┼───┤
Local:   │ ✓ │ ✓ │ ✓ │ ✓ │ ✓ │ P │ P │ P │
Remote:  │ ✓ │ ✓ │ ✓ │ ? │ ? │ ? │ ? │ ? │
         └───┴───┴───┴───┴───┴───┴───┴───┘
                       │
                       ▼
              Remote input arrives
              for tick 4
                       │
                       ▼
         ┌──────────────────────────────────┐
         │    Rollback to tick 4            │
         │    Re-simulate 4,5,6,7,8         │
         │    with correct inputs           │
         └──────────────────────────────────┘
```

**Pros**: Responsive feel, handles latency well
**Cons**: Complex, requires fast re-simulation

### Phase 4: Server Infrastructure

Options:
1. **Peer-to-peer with WebRTC**: Direct connection, lowest latency
2. **Relay server**: Easier NAT traversal, slightly higher latency
3. **Authoritative server**: Best for anti-cheat, highest latency

Recommended: Start with P2P WebRTC, add relay fallback.

## Technical Requirements

### For Rollback to Work

1. **Fast state copy**: Serialize/deserialize < 1ms
2. **Deterministic RNG**: Seeded, reproducible
3. **No floating point drift**: Use fixed-point or careful rounding
4. **Input history**: Store N frames of inputs for replay
5. **State history**: Store N frames of state for rollback

### Estimated State Size

```typescript
// Per player (~50 bytes)
interface PlayerState {
  position: { x: number, y: number };    // 16 bytes
  velocity: { x: number, y: number };    // 16 bytes
  action: ActionId;                       // 1 byte
  actionFrame: number;                    // 2 bytes
  health: number;                         // 2 bytes
  facing: Direction;                      // 1 byte
  // ... more fields
}

// Per frame: ~100-200 bytes
// History (7 frames): ~1.4 KB
// Very manageable for fast copies
```

## Implementation Checklist

### Now (Phase 1) ✅

- [x] Fixed timestep loop
- [x] InputFrame bitmask format
- [x] Simulation/render separation
- [x] Input capture per fixed tick
- [ ] State serialization interface (seam only)

### Phase 2 (Local Rollback)

- [ ] Full PlayerState serialization
- [ ] State snapshot ring buffer
- [ ] Input prediction (repeat last input)
- [ ] Rollback + re-simulate logic
- [ ] Artificial latency testing mode

### Phase 3 (Network)

- [ ] WebRTC data channel setup
- [ ] Input transmission protocol
- [ ] Ping measurement
- [ ] Input delay calculation
- [ ] Synchronization handshake

### Phase 4 (Production)

- [ ] Relay server fallback
- [ ] Matchmaking service
- [ ] Replay saving/sharing
- [ ] Spectator mode
- [ ] Anti-cheat measures

## Resources

- [GGPO](https://www.ggpo.net/) - Industry standard rollback
- [Rollback Netcode Explained](https://ki.infil.net/w02-netcode.html)
- [GDC: Overwatch Netcode](https://www.youtube.com/watch?v=W3aieHjyNvw)
- [Fighting Game Netcode](https://gamesdonequick.com/resources/rollback)
