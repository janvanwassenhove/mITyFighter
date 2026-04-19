# DevoxxFighter Constitution

## Preamble

DevoxxFighter is a pixel-art 2D fighting game built for Devoxx France 2026. This constitution codifies the existing development practices, architectural decisions, and quality standards that govern all project work. It was reverse-engineered from the live codebase during brownfield bootstrap.

---

## Core Principles

### Article I — Documentation-First Development
All code changes MUST be preceded by documentation updates. The `docs/` folder is the source of truth for conventions, and `docs/SPEC_KIT.md` is the development contract. No code lands without its corresponding doc update.

### Article II — Deterministic Simulation
The `src/game/sim/` module MUST remain free of Phaser dependencies and produce identical outputs from identical inputs. This is the foundation for future netplay/rollback and headless execution. The simulation runs at a fixed 60 ticks/second using an accumulator pattern.

### Article III — Registry-Driven Assets
All game content (fighters, backgrounds, audio) is loaded dynamically from JSON registries and pack manifests — never hardcoded. Frame counts are auto-detected from texture width. Adding content means adding data files and registry entries, not modifying engine code.

### Article IV — Strict TypeScript
The project uses TypeScript strict mode with zero tolerance for `any` types (ESLint-enforced). All functions require explicit return types. Unused variables and parameters are errors. Type safety is non-negotiable.

### Article V — Pixel-Perfect Rendering
All sprites use 128×128 pixel frames in horizontal strips. Rendering uses `pixelArt: true`, `antialias: false`, `roundPixels: true`. Integer scaling only. No smoothing, no sub-pixel positioning. The retro pixel-art aesthetic is a core identity element.

### Article VI — Separation of Concerns
Three layers — **input**, **simulation**, and **rendering** — remain strictly separated. Input captures key events into bitmask InputFrames. Simulation processes InputFrames deterministically. Rendering reads simulation state but never modifies it. No layer reaches into another's responsibilities.

### Article VII — Test Before Merge
All code must pass four quality gates before merge: `npm run lint` (ESLint + Prettier), `npm run test` (Vitest), `npm run validate:assets` (sprite dimensions and registry sync), and `npm run build` (TypeScript compilation + Vite bundle). CI enforces this on every PR.

### Article VIII — Convention Over Configuration
Naming conventions are strict and documented: fighter IDs use `snake_case`, action IDs use `camelCase`, constants use `SCREAMING_SNAKE_CASE`, classes use `PascalCase`, source files use `PascalCase.ts`, test files use `camelCase.test.ts`. These are not suggestions — they are rules.

### Article IX — Extensibility by Design
Adding a new fighter, background, or action follows a documented recipe in `docs/EXTENSIBILITY.md`. The pack system (`public/packs/`) with `manifest.json` files enables content addition without code changes. The architecture is designed for content creators, not just developers.

---

## Additional Constraints

### Technology Stack (Locked)
| Component | Technology | Version |
|-----------|-----------|---------|
| Language | TypeScript | ^5.3 (strict mode) |
| Framework | Phaser 3 | ^3.70 |
| Bundler | Vite | ^5.0 |
| Test Runner | Vitest | ^1.0 |
| Linter | ESLint | ^8.55 (flat config) |
| Formatter | Prettier | ^3.1 |
| Target | ES2020 / Browser | Modern browsers |

### Canvas Specifications
- Resolution: 1280×720 (16:9)
- Ground Y: 620px (GAME_HEIGHT - GROUND_OFFSET)
- Sprite display scale: 2× (128px frames → 256px rendered)
- Scale mode: `Phaser.Scale.FIT` with `CENTER_BOTH`

### Input Architecture
- Player 1: WASD zone (left keyboard)
- Player 2: Arrow keys + Numpad (right keyboard), or no-numpad laptop variant
- 16-bit bitmask InputFrame per player per tick
- Zero keyboard ghosting between player zones

### Simulation Contract
- 60 Hz fixed timestep (16.67ms per tick)
- Integer-based positions (no float accumulation drift)
- Headless-capable (no DOM, no Phaser dependencies in `sim/`)
- State serializable for future rollback netcode

### Existing Technical Debt
- **Asset docs outdated**: `docs/ASSETS.md` references old sprite path conventions (`src/assets/sprites/`) while the actual system uses `public/packs/` with manifests
- **Limited test coverage**: Only 5 test suites; scene logic and rendering are untested
- **No integration tests**: All tests are unit-level; no end-to-end fight simulation tests
- **Hardcoded story text**: Story dialogue is inline in `StoryModeState.ts`, not data-driven
- **AI behavior tuning**: `FightingAI.ts` has difficulty levels but balance is unverified

---

## Development Workflow

### Feature Development
1. Read `docs/SPEC_KIT.md` contract
2. Update relevant `docs/` files
3. Update registries if adding content
4. Implement code changes
5. Add/update tests
6. Run all quality gates
7. Commit with conventional prefix (`feat:`, `fix:`, `docs:`, etc.)

### Content Addition (Fighters/Backgrounds)
1. Prepare assets in `public/packs/<fighterId>/` or `public/backgrounds/`
2. Create/update `manifest.json`
3. Update `public/data/packs.json` or `public/data/backgrounds.json`
4. Update `docs/ASSETS.md`
5. Run `npm run validate:assets`
6. Test in-game via PlaygroundScene

### Quality Gates (CI-Enforced)
| Gate | Command | Blocks Merge |
|------|---------|:---:|
| Lint | `npm run lint` | ✅ |
| Type Check | `npm run typecheck` | ✅ |
| Unit Tests | `npm run test` | ✅ |
| Asset Validation | `npm run validate:assets` | ✅ |
| Production Build | `npm run build` | ✅ |

### CI Matrix
- Node.js 18.x and 20.x
- Runs on push to `main` and all PRs to `main`
- GitHub Pages deployment on merge to `main` or `DevoxxFighter` branch

---

## Governance

### Amendment Process
1. Propose amendment with rationale in a PR
2. Update this constitution file
3. Document the change in version history
4. All existing code continues to comply; new code must comply immediately

### Compliance
- This constitution supersedes all other practices
- AI agents (Copilot, Claude) MUST read and follow this constitution
- Violations in PRs block merge via CI gates where enforceable

### Migration Path
- New code follows all principles immediately
- Existing code migrates incrementally as files are touched
- No big-bang rewrites — evolve through feature work

---

**Version**: 1.0.0 | **Ratified**: 2026-04-19 | **Last Amended**: 2026-04-19
