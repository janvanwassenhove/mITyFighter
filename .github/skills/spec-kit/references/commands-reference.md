# Spec-Kit Commands Reference

## Core Commands

### `/speckit.constitution`

**Purpose**: Create or update project governing principles and development guidelines.  
**Output**: `.specify/memory/constitution.md`

**Usage**:
```
/speckit.constitution Create principles focused on code quality, testing standards, 
user experience consistency, and performance requirements
```

**Behavior**:
1. Loads existing constitution (or creates from template)
2. Identifies placeholder tokens `[ALL_CAPS_IDENTIFIER]`
3. Collects/derives values from user input and repo context
4. Drafts updated content replacing all placeholders
5. Performs consistency propagation (checks plan, spec, tasks templates)
6. Produces a Sync Impact Report
7. Validates: no unexplained brackets, correct version, ISO dates
8. Writes back to `.specify/memory/constitution.md`

**Version bumping**:
- MAJOR: Breaking governance/principle removals or redefinitions
- MINOR: New principle/section added or materially expanded
- PATCH: Clarifications, wording, typo fixes

---

### `/speckit.specify`

**Purpose**: Transform a feature description into a structured specification.  
**Output**: `specs/NNN-feature-name/spec.md` + quality checklist

**Usage**:
```
/speckit.specify Build a real-time chat system with message history and user presence
```

**Behavior**:
1. Generates concise short name (2-4 words) from description
2. Creates feature directory: `specs/NNN-short-name/`
3. Copies spec template and fills with concrete details
4. Runs quality validation checklist
5. Handles `[NEEDS CLARIFICATION]` markers (max 3)
6. Persists feature path to `.specify/feature.json`

**Critical rules**:
- Focus on WHAT and WHY, never HOW
- User stories must be prioritized (P1, P2, P3)
- Each story independently testable
- Max 3 `[NEEDS CLARIFICATION]` markers
- Given/When/Then acceptance criteria
- Measurable, tech-agnostic success criteria

---

### `/speckit.clarify`

**Purpose**: Structured clarification of underspecified areas in the spec.  
**When**: After `/speckit.specify`, before `/speckit.plan`

**Usage**:
```
/speckit.clarify
```

**Behavior**:
1. Reads existing spec.md
2. Identifies areas needing clarification (beyond NEEDS CLARIFICATION markers)
3. Asks sequential, coverage-based questions
4. Records answers in Clarifications section of spec
5. Updates spec with clarified requirements

---

### `/speckit.plan`

**Purpose**: Create a comprehensive technical implementation plan.  
**Output**: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`

**Usage**:
```
/speckit.plan Use TypeScript with Vite, PostgreSQL for storage, REST API
```

**Behavior**:
1. Reads spec.md and constitution
2. Analyzes requirements and maps to technical decisions
3. Runs Constitution Check gates
4. Generates implementation plan with:
   - Technical context (language, deps, storage, testing, platform)
   - Project structure (documentation + source code)
   - Phased implementation approach
   - Complexity tracking (justified violations only)
5. Creates supporting documents:
   - `research.md` — Technology decisions with rationale
   - `data-model.md` — Data schemas and relationships
   - `contracts/` — API specifications
   - `quickstart.md` — Validation scenarios

---

### `/speckit.tasks`

**Purpose**: Generate actionable task breakdown from the plan.  
**Output**: `specs/NNN-feature-name/tasks.md`

**Usage**:
```
/speckit.tasks
```

**Behavior**:
1. Reads plan.md (required) + spec.md, research.md, data-model.md, contracts/
2. Derives tasks from contracts, entities, scenarios
3. Organizes by user story for traceability
4. Marks parallelizable tasks with `[P]`
5. Includes checkpoints between phases
6. Documents dependencies and execution order

**Task format**: `[ID] [P?] [Story] Description`
- `T001`, `T002` — sequential IDs
- `[P]` — can run in parallel
- `[US1]`, `[US2]` — user story label

---

### `/speckit.implement`

**Purpose**: Execute all tasks to build the feature.  
**When**: After tasks are generated and reviewed

**Usage**:
```
/speckit.implement
```

**Behavior**:
1. Validates prerequisites (constitution, spec, plan, tasks all exist)
2. Parses task breakdown from tasks.md
3. Executes tasks in dependency order
4. Follows TDD approach (if specified)
5. Handles parallelization markers
6. Provides progress updates

---

### `/speckit.taskstoissues`

**Purpose**: Convert task list into GitHub Issues for tracking.  
**When**: After tasks are generated

**Usage**:
```
/speckit.taskstoissues
```

---

## Optional Commands

### `/speckit.analyze`

**Purpose**: Cross-artifact consistency and coverage analysis.  
**When**: After `/speckit.tasks`, before `/speckit.implement`

**What it checks**:
- Spec requirements mapped to plan sections
- Plan sections mapped to tasks
- No orphaned requirements (spec items without tasks)
- No phantom tasks (tasks without spec backing)
- Constitutional compliance

---

### `/speckit.checklist`

**Purpose**: Generate quality checklists for requirements validation.  
**When**: Any time for quality gates

**What it generates**:
- Requirements completeness checks
- Clarity and consistency validation
- "Unit tests for English" — structured quality verification

---

## CLI Commands

### `specify init`

```bash
# New project
specify init <PROJECT_NAME>

# Existing directory
specify init . --ai copilot
specify init --here --ai copilot

# Force (non-empty directory)
specify init . --force --ai copilot

# With agent skills instead of slash commands
specify init . --ai copilot --ai-skills

# Skip tool checks
specify init . --ai copilot --ignore-agent-tools
```

### `specify check`

Verify installed tools and configuration.

### `specify version`

Show installed version.

### `specify extension`

```bash
specify extension search          # Browse available
specify extension add <name>      # Install
specify extension remove <name>   # Uninstall
```

### `specify preset`

```bash
specify preset search             # Browse available
specify preset add <name>         # Install
specify preset remove <name>      # Uninstall
```

### `specify integration list`

Show all available AI agent integrations.
