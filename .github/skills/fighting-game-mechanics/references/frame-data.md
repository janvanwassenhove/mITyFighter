# Frame Data Reference

## Anatomy of an Attack

Every attack has three phases measured in **simulation ticks** (60Hz):

```
|--- startup ---|--- active ---|--- recovery ---|
     ^                ^               ^
     Cannot hit       Hitbox live     Vulnerable
     Can be blocked   Deals damage    Cannot act
```

**Total frames** = startup + active + recovery

## Frame Advantage

- **On hit**: attacker recovers before defender exits hitstun = positive frame advantage
- **On block**: attacker recovers vs defender exits blockstun
- **Positive** = attacker can act first (pressure / combo)
- **Negative** = defender can act first (punish window)
- **Zero** = neutral, both can act simultaneously

### Formula
```
Frame advantage (on hit)  = hitstun - recovery
Frame advantage (on block) = blockstun - recovery
```

## DevoxxFighter Attack Data

Current attack properties are defined in `ATTACK_DATA` inside `src/game/sim/FighterState.ts`:

| Attack | Startup | Active | Recovery | Damage | Knockback | Hitstun |
|--------|---------|--------|----------|--------|-----------|---------|
| ATTACK1 (light) | Fast (3-5) | Short (2-3) | Short (8-12) | Low (5-8) | Low | Short |
| ATTACK2 (heavy) | Slow (8-12) | Medium (3-5) | Long (15-20) | High (12-18) | High | Long |
| SPECIAL | Medium (6-10) | Variable | Medium (12-16) | Medium-High | Variable | Medium |
| UPPERCUT | Medium (5-8) | Short (3-4) | Long (18-22) | Medium (10-14) | Upward | Medium |
| SLIDE | Fast (4-6) | Long (4-6) | Medium (14-18) | Low-Med (6-10) | Forward | Short |

*Exact values: always check `ATTACK_DATA` in source — these are general guidelines.*

## Balance Guidelines

### Light Attacks (ATTACK1)
- Purpose: fast poke, combo starter
- Should be safe on block (near 0 or slight minus)
- Low damage encourages combo follow-ups

### Heavy Attacks (ATTACK2)
- Purpose: punish, combo ender
- Should be punishable on block (negative frames)
- High damage as reward for landing a read

### Specials
- Purpose: unique character identity
- Can have projectile, invincibility, or armor properties
- Variable risk/reward based on character design

### Anti-air (UPPERCUT)
- Purpose: counter airborne opponents
- Should have upper-body invincibility or fast startup
- Very punishable on whiff/block (long recovery)

### Low (SLIDE)
- Purpose: hit crouching opponents, approach tool
- Must be blocked low (if crouch-blocking is implemented)
- Moderate risk — committal movement

## Damage Scaling

For combo sequences, apply scaling to prevent infinites:
- Hit 1: 100%
- Hit 2: 80%
- Hit 3: 60%
- Hit 4+: 50% (floor)

## Hitstun Decay

Each successive hit in a combo reduces hitstun:
- Prevents infinite combos
- Forces combo routes to have natural endpoints
- Gravity pulls airborne fighters down faster in extended combos

## Implementation Location

- Attack data: `src/game/sim/FighterState.ts` → `ATTACK_DATA`
- Damage application: `src/game/sim/CombatSystem.ts` → `applyHit()`
- Hitbox check: `src/game/sim/CombatSystem.ts` → `getHitbox()` / `getHurtbox()`
