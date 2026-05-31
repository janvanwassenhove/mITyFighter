---
name: doc-first-workflow
description: "Documentation-first development workflow for DevoxxFighter. Use when: adding features, modifying code, adding assets, changing registries, or any code change that requires updating docs/ before implementation. Enforces the SPEC_KIT contract."
---
# Documentation-First Workflow

Enforces the DevoxxFighter spec-kit contract: **docs before code, always**.

## When to Use
- Before any code change that touches fighters, backgrounds, actions, UI, controls, or modules
- When uncertain which docs need updating for a given task
- As a checklist to ensure no documentation is missed

## Procedure

### 1. Identify Required Doc Updates

Check the task type against this table:

| Task | Required Doc Updates |
|------|---------------------|
| Add fighter | `docs/ASSETS.md` (fighter table), `docs/EXTENSIBILITY.md` |
| Add background | `docs/ASSETS.md` (background table), `docs/EXTENSIBILITY.md` |
| Add action | `docs/ANIMATIONS.md` (action ID list, frame rate) |
| Change controls | `docs/INPUT.md` (key binding tables) |
| Add module | `docs/ARCHITECTURE.md` (module table) |
| Add UI element | `docs/DESIGN_KIT.md` (component section) |
| Change visuals | `docs/DESIGN_KIT.md` (relevant section) |
| Add scene | `docs/ARCHITECTURE.md` (scene table) |
| Modify spec-kit | `docs/SPEC_KIT.md` itself |

### 2. Update Documentation

Edit the identified docs **before** writing any source code:
- Add table rows for new entries
- Update existing rows if modifying behavior
- Keep formatting consistent with existing entries

### 3. Update Registries

If assets changed, update the JSON data files:
- Fighter: `public/data/fighters.json`
- Background: `public/data/backgrounds.json`
- Audio: `public/data/audio.json`

### 4. Implement Code Changes

Now write the source code, following:
- Naming conventions from `codebase-knowledge` skill
- Combat patterns from `fighting-game-mechanics` skill
- ESLint rules from `.github/copilot-instructions.md`

### 5. Add/Update Tests

- New registry entries → validation tests
- New inputs → InputFrame tests
- New asset conventions → key generation tests
- New combat features → sim tests

### 6. Run Validation

```bash
npm run validate:assets   # Sprite dimensions, registry sync
npm run lint              # ESLint + Prettier
npm run test              # Vitest unit tests
npm run build             # TypeScript compilation
```

All four must pass.

### 7. Self-Maintain

Invoke the `self-maintenance` skill to update agent knowledge if the change introduced new patterns or structural changes.

## File Header Convention

Key source files should include:
```typescript
/**
 * @fileoverview [Description]
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 */
```
