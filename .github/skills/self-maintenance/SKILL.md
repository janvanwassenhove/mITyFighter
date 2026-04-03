---
name: self-maintenance
description: "Self-maintaining instructions and skills for mITyFighter. Use when: a feature was just added, code was modified, a new module/scene/system was created, registries changed, conventions evolved, or any structural change happened. Ensures agent instructions, skills, and docs stay synchronized with the actual codebase."
---
# Self-Maintenance Protocol

Keeps the agent's knowledge (instructions, skills, docs) synchronized with the evolving codebase.

## When to Use
- After adding a new fighter, background, action, or scene
- After modifying module boundaries or adding new modules
- After changing naming conventions or code style rules
- After adding new validation commands or CI gates
- After modifying the asset pipeline or loading flow
- After any structural change to the project
- Periodically as a hygiene check

## Procedure

### 1. Detect What Changed

Scan the change for impact on these categories:

| Change Type | Affected Files |
|-------------|---------------|
| New fighter/background/action | `docs/ASSETS.md`, `docs/EXTENSIBILITY.md`, `public/data/*.json` |
| New scene | `docs/ARCHITECTURE.md`, `.github/skills/codebase-knowledge/references/scene-flow.md`, `.github/skills/codebase-knowledge/references/architecture-map.md` |
| New module/system | `docs/ARCHITECTURE.md`, `.github/skills/codebase-knowledge/references/architecture-map.md` |
| Combat system change | `.github/skills/fighting-game-mechanics/references/frame-data.md`, `.github/skills/fighting-game-mechanics/references/fighter-states.md` |
| New combo/input | `docs/INPUT.md`, `.github/skills/fighting-game-mechanics/references/combo-system.md` |
| Naming convention change | `.github/copilot-instructions.md`, `.github/skills/codebase-knowledge/references/naming-conventions.md` |
| New validation/CI step | `docs/SPEC_KIT.md`, `docs/QUALITY_GATES.md`, `.github/copilot-instructions.md` |
| UI/visual change | `docs/DESIGN_KIT.md` |
| Asset pipeline change | `.github/skills/codebase-knowledge/references/asset-pipeline.md` |

### 2. Update Documentation (docs/)

Follow the SPEC_KIT task→doc mapping:

| Task | Docs to Update |
|------|---------------|
| Add fighter | `ASSETS.md`, `EXTENSIBILITY.md` |
| Add background | `ASSETS.md`, `EXTENSIBILITY.md` |
| Add action | `ANIMATIONS.md` |
| Change controls | `INPUT.md` |
| Add module | `ARCHITECTURE.md` |
| Add UI element | `DESIGN_KIT.md` |

### 3. Update Skills

If domain knowledge expanded:

- **Fighting mechanics changed** → Update files in `.github/skills/fighting-game-mechanics/references/`
- **Codebase structure changed** → Update files in `.github/skills/codebase-knowledge/references/`
- **New workflow pattern emerged** → Update `.github/skills/doc-first-workflow/` if applicable

### 4. Update Agent Instructions

If the change affects how the agent should behave:

- **New convention** → Update `.github/copilot-instructions.md` and `.github/agents/mity-engineer.agent.md`
- **New validation command** → Update the validation section in both files
- **New module boundary** → Update the architecture section in the agent file

### 5. Verify Consistency

Run a consistency check:
```bash
# Check that all referenced files exist
npm run validate:assets

# Check code compiles
npm run build

# Run tests
npm run test
```

Then manually verify:
- Skill reference files don't mention removed files/modules
- Architecture map matches actual `src/` structure
- Scene flow matches actual scene transitions
- Naming convention examples match actual code

### 6. Staleness Detection

Signs that maintenance is needed:
- A skill references a file path that no longer exists
- The architecture map is missing a module that exists in `src/`
- `docs/ASSETS.md` fighter table doesn't match `public/data/fighters.json`
- A scene exists in code but not in the scene flow reference
- New constants or types are used without convention documentation
