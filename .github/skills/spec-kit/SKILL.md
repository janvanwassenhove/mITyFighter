---
name: spec-kit
description: "Spec-Kit / Spec-Driven Development (SDD) expert knowledge. Use when: setting up spec-kit in a project, creating constitutions, writing specifications, generating plans, breaking down tasks, implementing features via SDD, reverse-engineering existing repos (brownfield bootstrap), guiding users through the full SDD lifecycle, or answering questions about spec-kit concepts, extensions, and presets."
---
# Spec-Kit / Spec-Driven Development (SDD)

Deep expertise in GitHub's Spec-Kit toolkit and the Spec-Driven Development methodology.

## When to Use

- Setting up spec-kit in any project (greenfield or brownfield)
- Walking a user through the SDD workflow
- Creating or updating a project constitution
- Writing feature specifications
- Generating implementation plans
- Breaking down plans into tasks
- Executing implementation via SDD
- Reverse-engineering an existing codebase to bootstrap spec-kit artifacts
- Advising on extensions, presets, and customization
- Answering conceptual questions about SDD philosophy

## What is Spec-Driven Development?

SDD **inverts the traditional power structure**: specifications don't serve code — code serves specifications. The specification becomes the primary artifact; code becomes its expression in a particular language/framework.

### Core Principles

1. **Specifications as Lingua Franca**: Specs are the source of truth; code is generated output
2. **Executable Specifications**: Specs must be precise, complete, and unambiguous enough to generate working systems
3. **Continuous Refinement**: Consistency validation happens continuously, not as a one-time gate
4. **Research-Driven Context**: Research agents gather technical context throughout the process
5. **Bidirectional Feedback**: Production reality informs specification evolution
6. **Branching for Exploration**: Multiple implementation approaches from the same specification

### Development Phases

| Phase | Focus | Key Activities |
|-------|-------|----------------|
| **Greenfield** (0-to-1) | Generate from scratch | High-level requirements → specs → plans → build |
| **Creative Exploration** | Parallel implementations | Multiple tech stacks, UX experiments |
| **Brownfield** (Iterative) | Existing codebase | Add features iteratively, modernize, adapt |

## The SDD Workflow

### Step 0: Install Specify CLI

```bash
# Persistent (recommended)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z

# One-time
uvx --from git+https://github.com/github/spec-kit.git@vX.Y.Z specify init <PROJECT>

# Initialize in current directory for Copilot
specify init . --ai copilot
```

### Step 1: Constitution (`/speckit.constitution`)

Create governing principles that guide ALL subsequent development. The constitution is stored at `.specify/memory/constitution.md`.

**What it defines**:
- Core principles (library-first, test-first, simplicity, etc.)
- Additional constraints (tech stack, compliance, security)
- Development workflow and quality gates
- Governance rules and amendment process
- Version tracking (semver)

**Key rules**:
- Constitution is **immutable** once ratified (amendments follow formal process)
- All generated artifacts must comply with constitutional principles
- Plan templates contain "Constitution Check" gates

### Step 2: Specification (`/speckit.specify`)

Transform a feature description into a structured specification.

**Focus on WHAT and WHY, never HOW** (no tech stack at this point).

**Output** (`specs/NNN-feature-name/spec.md`):
- User Scenarios & Testing (prioritized user stories with acceptance criteria)
- Functional Requirements (FR-001, FR-002, ...)
- Success Criteria (measurable, technology-agnostic)
- Key Entities (if data involved)
- Assumptions
- Quality checklist

**Critical rules**:
- User stories must be independently testable (each = viable MVP slice)
- Max 3 `[NEEDS CLARIFICATION]` markers
- Acceptance criteria use Given/When/Then format
- Success criteria must be measurable and tech-agnostic

### Step 3: Clarification (`/speckit.clarify`)

Structured questioning to resolve ambiguities before planning. Run this BEFORE `/speckit.plan`.

- Sequential, coverage-based questioning
- Records answers in a Clarifications section of the spec
- Can be skipped for spikes/prototypes (state explicitly)

### Step 4: Plan (`/speckit.plan`)

Create a technical implementation plan from the spec.

**Now you specify the tech stack** (language, framework, database, etc.).

**Output** (in `specs/NNN-feature-name/`):
- `plan.md` — Implementation plan with Constitution Check gates
- `research.md` — Technology research and decisions
- `data-model.md` — Data models and schemas
- `contracts/` — API specifications
- `quickstart.md` — Key validation scenarios

**Constitution Check gates**:
- Simplicity Gate (Article VII)
- Anti-Abstraction Gate (Article VIII)
- Integration-First Gate (Article IX)

### Step 5: Tasks (`/speckit.tasks`)

Generate an actionable task list from the plan.

**Output** (`specs/NNN-feature-name/tasks.md`):
- Phased breakdown: Setup → Foundational → User Stories → Polish
- `[P]` markers for parallelizable tasks
- `[US1]`, `[US2]` story labels for traceability
- Exact file paths per task
- Checkpoints between phases
- Dependency graph and execution order

### Step 6: Implementation (`/speckit.implement`)

Execute all tasks to build the feature.

- Validates prerequisites (constitution, spec, plan, tasks)
- Follows task order and dependencies
- TDD approach when specified
- Progress tracking and error handling

### Step 7: Analysis (`/speckit.analyze`)

Cross-artifact consistency and coverage analysis. Run after tasks, before implement.

### Step 8: Checklist (`/speckit.checklist`)

Generate quality checklists that validate requirements completeness and consistency.

## Project Directory Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project principles
├── scripts/                     # Automation scripts
├── specs/
│   └── NNN-feature-name/
│       ├── spec.md              # Feature specification
│       ├── plan.md              # Implementation plan
│       ├── research.md          # Technical research
│       ├── data-model.md        # Data models
│       ├── contracts/           # API specifications
│       ├── quickstart.md        # Validation scenarios
│       ├── tasks.md             # Task breakdown
│       └── checklists/          # Quality checklists
├── templates/
│   ├── constitution-template.md
│   ├── spec-template.md
│   ├── plan-template.md
│   ├── tasks-template.md
│   ├── checklist-template.md
│   └── overrides/               # Project-local template overrides
├── extensions/                  # Installed extensions
├── presets/                     # Installed presets
├── extensions.yml               # Extension hook configuration
├── feature.json                 # Current active feature path
└── init-options.json            # Project init configuration
```

## Brownfield Bootstrap (Reverse Engineering)

For existing codebases without spec-kit, follow this procedure:

### Phase 1: Discovery

1. **Analyze the codebase structure**:
   - Language(s), frameworks, build tools
   - Module/package organization
   - Entry points and main flows
   - Test framework and coverage

2. **Map the architecture**:
   - Service boundaries and communication patterns
   - Data models and storage
   - External dependencies and integrations
   - Configuration and deployment

3. **Identify existing "features"**:
   - Each major capability = one feature spec retroactively
   - User-facing flows and journeys
   - API endpoints grouped by domain

### Phase 2: Constitution Creation

Run `/speckit.constitution` with context derived from the existing codebase:

```
/speckit.constitution Create principles based on the existing codebase patterns:
[language/framework], [testing approach], [architecture style],
[deployment model], [observed conventions]
```

The constitution should codify what the team **already practices** — not impose new rules.

**Key areas to derive from existing code**:
- Naming conventions (extract from actual code)
- Testing philosophy (what's tested, how, coverage level)
- Architecture patterns (monolith, microservices, modular monolith)
- Code organization principles (feature-based, layer-based)
- Quality gates already in CI/CD

### Phase 3: Retroactive Feature Specs

For each major feature already delivered:

1. Create `specs/NNN-feature-name/spec.md` describing WHAT it does (not HOW)
2. Focus on user stories and acceptance criteria that the feature satisfies
3. Mark status as `Delivered` (not Draft)
4. Document known gaps or technical debt as `[KNOWN ISSUE]`

### Phase 4: Going Forward

New features now follow the full SDD workflow:
1. Spec → Clarify → Plan → Tasks → Implement
2. Constitution guides all new work
3. Existing feature specs serve as reference

**See**: `references/brownfield-guide.md` for detailed procedures.

## Template Quick Reference

See `references/templates-reference.md` for the full template structures:
- Constitution template: Principles, Governance, Versioning
- Spec template: User Stories, Requirements, Success Criteria, Assumptions
- Plan template: Technical Context, Constitution Check, Project Structure, Complexity Tracking
- Tasks template: Phased breakdown, Parallel markers, Dependencies

## Extensions & Presets

See `references/extensions-presets.md` for the full ecosystem:
- **Extensions**: Add new capabilities (commands, workflows)
- **Presets**: Customize existing workflows (templates, terminology)
- Resolution priority: Project-Local > Presets > Extensions > Core

## Commands Quick Reference

| Command | Purpose | When |
|---------|---------|------|
| `/speckit.constitution` | Project principles | First, or when principles change |
| `/speckit.specify` | Feature specification | Start of each feature |
| `/speckit.clarify` | Resolve ambiguities | After specify, before plan |
| `/speckit.plan` | Technical implementation plan | After spec is clear |
| `/speckit.tasks` | Actionable task breakdown | After plan is approved |
| `/speckit.implement` | Execute all tasks | After tasks are ready |
| `/speckit.analyze` | Cross-artifact consistency | After tasks, before implement |
| `/speckit.checklist` | Quality validation | Any time for quality gates |
| `/speckit.taskstoissues` | Convert tasks to GitHub issues | After tasks, for tracking |
