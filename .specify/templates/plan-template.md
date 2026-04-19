# Implementation Plan: [FEATURE_NAME]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link to spec.md]

## Summary
[Primary requirement + technical approach in 2–3 sentences]

## Technical Context
**Language/Version**: TypeScript ^5.3 (strict mode)
**Primary Dependencies**: Phaser 3 ^3.70
**Bundler**: Vite ^5.0
**Testing**: Vitest ^1.0
**Target Platform**: Browser (ES2020)
**Project Type**: 2D fighting game
**Performance Goals**: 60 FPS render, 60Hz simulation tick
**Constraints**: Pixel-perfect rendering, deterministic sim (no Phaser deps in sim/)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Documentation-First Gate (Article I)
- [ ] Relevant docs/ files updated before implementation?
- [ ] Registry updates identified?

### Deterministic Simulation Gate (Article II)
- [ ] Does this feature touch sim/? If yes: no Phaser imports, deterministic output.
- [ ] Fixed timestep preserved?

### Registry-Driven Gate (Article III)
- [ ] New content loaded from data files, not hardcoded?
- [ ] Registries populated dynamically?

### Strict TypeScript Gate (Article IV)
- [ ] No `any` types?
- [ ] Explicit return types on all functions?

### Pixel-Perfect Gate (Article V)
- [ ] Integer scaling only?
- [ ] No antialiasing or sub-pixel positioning?

### Separation of Concerns Gate (Article VI)
- [ ] Input → Simulation → Render layers respected?
- [ ] No cross-layer dependencies?

### Quality Gates Gate (Article VII)
- [ ] lint, test, validate:assets, build all pass?

### Convention Gate (Article VIII)
- [ ] Naming conventions followed (snake_case IDs, PascalCase files, etc.)?

### Extensibility Gate (Article IX)
- [ ] New content addable via data files + EXTENSIBILITY.md recipe?

## Project Structure

### Documentation (this feature)
```
.specify/specs/[###-feature]/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (affected files)
```
[List affected source directories and files]
```

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|-----------|--------------------------------------|
| (none expected) | — | — |
