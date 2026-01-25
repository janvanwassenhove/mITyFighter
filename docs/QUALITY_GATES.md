# Quality Gates

> **Spec-Kit Document** - All code must pass these gates before merge.

## Overview

Quality gates ensure consistent, reliable code through automated checks.

## Scripts

### `npm run lint`

ESLint + Prettier check.

```bash
npm run lint        # Check only
npm run lint:fix    # Auto-fix
```

**Configuration**:
- ESLint: `eslint.config.js`
- Prettier: `.prettierrc`

**Rules enforced**:
- Strict TypeScript (`strict: true`)
- No `any` types (`@typescript-eslint/no-explicit-any`)
- Consistent imports
- Proper formatting

### `npm run test`

Vitest unit tests.

```bash
npm run test        # Run once
npm run test:watch  # Watch mode
npm run test:coverage  # With coverage
```

**Test files**:
- `tests/*.test.ts`

**Minimum coverage**: 80% (future target)

### `npm run build`

TypeScript compilation + Vite production build.

```bash
npm run build
```

**Checks**:
- Type errors
- Import resolution
- Bundle generation

### `npm run validate:assets`

Asset validation script.

```bash
npm run validate:assets
```

**Checks**:
- All registered fighters have existing folders
- All action sprites exist
- Sprite dimensions correct (height=128, width%128=0)
- All registered backgrounds exist

**Output**:
```
✓ Fighter: homeless_1
  ✓ idle: Idle.png (128x640, 5 frames)
  ✓ walk: Walk.png (128x768, 6 frames)
  ...
✓ Fighter: kunoichi
  ...
✓ Background: dojo
  ✓ dojo.png exists

All assets valid!
```

**On error**:
```
✗ Fighter: missing_fighter
  ✗ Folder not found: src/assets/sprites/Missing_Fighter/
  
✗ Fighter: homeless_1
  ✗ attack3: Attack_3.png not found
  ✗ invalid: Invalid.png - height 256 != 128
  
Asset validation failed!
Exit code: 1
```

### `npm run dev`

Development server with hot reload.

```bash
npm run dev
```

## CI Pipeline

GitHub Actions workflow: `.github/workflows/ci.yml`

```yaml
Jobs:
  1. Install dependencies
  2. Run lint
  3. Run tests
  4. Validate assets
  5. Build production
```

**Triggers**:
- Push to `main`
- Pull requests to `main`

**Required to pass**: All jobs

## Pre-commit Checklist

Before committing:

```bash
# Quick check
npm run lint && npm run test && npm run validate:assets && npm run build

# Or use the combined script
npm run validate:all
```

## Editor Setup

### VS Code Extensions

- ESLint
- Prettier
- TypeScript

### Settings

`.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Type Safety

### Strict Mode

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Registry Type Safety

```typescript
// Fighter IDs are type-safe
type FighterId = keyof typeof FIGHTER_REGISTRY;

// This errors at compile time:
const invalid: FighterId = 'nonexistent'; // Error!

// This is safe:
const valid: FighterId = 'kunoichi'; // OK
```

## Error Handling

### Logging Levels

```typescript
import { logger } from './utils/logger';

logger.debug('Detailed info');  // Development only
logger.info('General info');    // Normal operation
logger.warn('Warning');         // Recoverable issues
logger.error('Error');          // Failures
```

### Assertions

```typescript
import { assert } from './utils/assert';

// Throws in development, logs in production
assert(value !== null, 'Value must not be null');
```

## Performance Guidelines

### Avoid Per-Frame Allocations

```typescript
// ❌ Bad: Creates object every frame
function update() {
  const position = { x: sprite.x, y: sprite.y };
}

// ✅ Good: Reuse object
const position = { x: 0, y: 0 };
function update() {
  position.x = sprite.x;
  position.y = sprite.y;
}
```

### Object Pooling

For frequently created/destroyed objects (projectiles, effects):
```typescript
// Future: Implement object pools
const projectilePool = new ObjectPool<Projectile>(50);
```

## Documentation Requirements

Every public function/class should have:

```typescript
/**
 * Brief description.
 * 
 * @param paramName - Parameter description
 * @returns Return value description
 * @throws Error conditions
 * 
 * @example
 * ```typescript
 * const result = myFunction('input');
 * ```
 */
```

## Review Checklist

For code reviewers:

- [ ] Types are explicit (no implicit `any`)
- [ ] Error cases handled
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log (use logger)
- [ ] No per-frame allocations in hot paths
- [ ] Registries synchronized with assets
- [ ] All quality gates pass
