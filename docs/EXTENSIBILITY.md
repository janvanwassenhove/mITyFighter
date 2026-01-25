# Extensibility Guide

> **Spec-Kit Document** - Follow these steps when adding new content.

## Adding a New Fighter

### Step 1: Prepare Assets

1. Create folder: `src/assets/sprites/<FighterId>/`
2. Add sprite strips (128x128 frames, horizontal layout):
   - Required: `Idle.png` (minimum)
   - Recommended: `Walk.png`, `Run.png`, `Jump.png`, `Attack_1.png`
   - Optional: Any other actions from ASSETS.md

### Step 2: Update Documentation

Edit `docs/ASSETS.md`:
- Add row to "Current Fighters" table
- List available actions

### Step 3: Update Registry

Edit `src/game/assets/fighterRegistry.ts`:

```typescript
export const FIGHTER_REGISTRY = {
  // ... existing fighters ...
  
  new_fighter: {
    id: 'new_fighter',
    displayName: 'New Fighter',
    basePath: 'sprites/New_Fighter',
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      // ... add all available actions
    },
  },
} as const;
```

### Step 4: Validate

```bash
npm run validate:assets
```

This checks:
- Sprite files exist
- Dimensions are correct (height=128, width%128=0)
- Registry references valid files

### Step 5: Test

```bash
npm run dev
```

1. Launch playground
2. Cycle to new fighter (Q/E for P1, U/O for P2)
3. Verify all animations play correctly
4. Check debug overlay (F1) shows correct info

### Step 6: Commit

```bash
git add src/assets/sprites/New_Fighter/
git add src/game/assets/fighterRegistry.ts
git add docs/ASSETS.md
git commit -m "feat: add New Fighter"
```

---

## Adding a New Background

### Step 1: Prepare Asset

1. Add image to `src/assets/backgrounds/<backgroundId>.png`
2. Recommended: 1280x720 or larger, PNG or JPG

### Step 2: Update Documentation

Edit `docs/ASSETS.md`:
- Add row to "Current Backgrounds" table

### Step 3: Update Registry

Edit `src/game/assets/backgroundRegistry.ts`:

```typescript
export const BACKGROUND_REGISTRY = {
  // ... existing backgrounds ...
  
  new_bg: {
    id: 'new_bg',
    displayName: 'New Background',
    file: 'new_bg.png',
  },
} as const;
```

### Step 4: Validate

```bash
npm run validate:assets
```

### Step 5: Test

```bash
npm run dev
```

1. Launch playground
2. Cycle backgrounds (Z/C)
3. Verify new background appears

### Step 6: Commit

```bash
git add src/assets/backgrounds/new_bg.png
git add src/game/assets/backgroundRegistry.ts
git add docs/ASSETS.md
git commit -m "feat: add New Background"
```

---

## Adding a New Action

### Step 1: Update Type Definition

Edit `src/game/assets/AssetKeys.ts`:

```typescript
export const ACTION_IDS = [
  // ... existing actions ...
  'new_action',
] as const;
```

### Step 2: Update Documentation

Edit `docs/ASSETS.md`:
- Add row to naming convention table

Edit `docs/ANIMATIONS.md`:
- Add to ActionId type
- Specify frame rate
- Specify looping behavior

### Step 3: Update Frame Rate Config

Edit `src/game/config/constants.ts`:

```typescript
export const ACTION_FRAME_RATES: Record<ActionId, number> = {
  // ... existing ...
  new_action: 12,
};

export const LOOPING_ACTIONS: ActionId[] = [
  // Add if it should loop
];
```

### Step 4: Add to Fighter Registries

For each fighter that has this action, update their registry entry:

```typescript
actions: {
  // ... existing ...
  new_action: 'New_Action.png',
},
```

### Step 5: Validate & Test

```bash
npm run validate:assets
npm run test
npm run dev
```

---

## Adding a New Input Action

### Step 1: Update InputFrame

Edit `src/game/sim/InputFrame.ts`:

```typescript
export const INPUT_FLAGS = {
  // ... existing ...
  NEW_ACTION: 1 << 8,  // Use next available bit
} as const;
```

### Step 2: Update Bindings

Edit `src/game/input/InputBindings.ts`:

```typescript
export const P1_BINDINGS = {
  // ... existing ...
  KeyX: 'newAction',
};
```

### Step 3: Update Documentation

Edit `docs/INPUT.md`:
- Add to binding tables
- Update InputFrame bit layout

### Step 4: Test

```bash
npm run test
npm run dev
```

---

## Checklist Template

Copy this for any extension:

```markdown
## Adding [Feature Name]

- [ ] Assets prepared and placed
- [ ] `docs/ASSETS.md` updated
- [ ] `docs/ANIMATIONS.md` updated (if applicable)
- [ ] `docs/INPUT.md` updated (if applicable)
- [ ] Registry updated
- [ ] `npm run validate:assets` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Manual testing complete
- [ ] Changes committed with descriptive message
```
