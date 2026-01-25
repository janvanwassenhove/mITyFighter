# Spec-Kit: The Contract for mITyFighter Development

> **This document is the source of truth.** All code changes MUST follow this contract.

## Purpose

The Spec-Kit ensures consistent, high-quality development by establishing clear rules for:
- Documentation-first workflow
- Registry synchronization
- Test coverage
- Validation procedures

## The Contract

### Before ANY Code Change

1. **Update relevant documentation first**
   - Modify `docs/ASSETS.md` when adding/changing fighters or backgrounds
   - Modify `docs/ANIMATIONS.md` when adding/changing actions
   - Modify `docs/INPUT.md` when adding/changing controls
   - Modify `docs/ARCHITECTURE.md` when adding/changing modules
   - Modify `docs/DESIGN_KIT.md` when adding/changing visual/UI elements

2. **Keep registries in sync**
   - `src/game/assets/fighterRegistry.ts` must match actual sprite folders
   - `src/game/assets/backgroundRegistry.ts` must match actual background files
   - Action mappings must reference existing PNG files

3. **Add/update tests**
   - New registry entries require validation tests
   - New input bindings require InputFrame tests
   - New asset conventions require key generation tests

4. **Run validation scripts**
   ```bash
   npm run validate:assets   # Check sprite dimensions and registry consistency
   npm run lint              # ESLint + Prettier
   npm run test              # Vitest
   npm run build             # TypeScript compilation
   ```

### GitHub Copilot Integration Rules

When Copilot assists with changes, it MUST:

1. **Check this spec-kit first** before proposing code changes
2. **Update docs/** before modifying source files
3. **Propose registry updates** when adding assets
4. **Include test updates** in the same change set
5. **Verify validation passes** before marking complete

### File Header Convention

Key source files include this header comment:
```typescript
/**
 * @fileoverview [Description]
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 */
```

## Quick Reference

| Task | Required Doc Updates | Required Code Updates |
|------|---------------------|----------------------|
| Add fighter | ASSETS.md, EXTENSIBILITY.md | fighterRegistry.ts |
| Add background | ASSETS.md, EXTENSIBILITY.md | backgroundRegistry.ts |
| Add action | ANIMATIONS.md | ActionId type, registry |
| Change controls | INPUT.md | InputBindings.ts |
| Add module | ARCHITECTURE.md | Relevant source files |
| Add UI element | DESIGN_KIT.md | Relevant scene/UI files |
| Change visuals | DESIGN_KIT.md | Relevant render files |

## Validation Checklist

- [ ] Documentation updated
- [ ] Registries synchronized
- [ ] Tests added/updated
- [ ] `npm run validate:assets` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes

## CI Enforcement

The GitHub Actions workflow (`ci.yml`) enforces:
1. Lint check
2. Type check
3. Unit tests
4. Asset validation
5. Production build

PRs cannot merge if any gate fails.
