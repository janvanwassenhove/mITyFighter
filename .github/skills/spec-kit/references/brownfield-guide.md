# Brownfield Bootstrap Guide

## Overview

Brownfield bootstrap is the process of adopting Spec-Driven Development in an **existing codebase** that was built without spec-kit. The goal is to reverse-engineer the codebase into spec-kit artifacts so future work follows the full SDD workflow.

This is NOT about rewriting the codebase — it's about **documenting what exists** so AI agents and developers have a structured understanding of the system.

## Prerequisites

- `specify` CLI installed
- The existing repo cloned locally
- AI agent configured (e.g., Copilot, Claude Code)

## Phase 1: Initialize Spec-Kit

```bash
# In the existing project root
specify init . --ai copilot --force
```

The `--force` flag is needed because the directory already has files. This creates the `.specify/` directory structure without overwriting existing code.

## Phase 2: Codebase Analysis

Before writing any spec-kit artifacts, thoroughly analyze the existing codebase.

### 2.1 Technology Stack Discovery

Scan for:
- **Languages**: File extensions, package managers (package.json, pom.xml, Cargo.toml, go.mod, requirements.txt, etc.)
- **Frameworks**: Dependencies in manifests (React, Spring, Django, Express, ASP.NET, etc.)
- **Build tools**: Webpack, Vite, Maven, Gradle, Make, CMake, etc.
- **Test frameworks**: Jest, Vitest, pytest, JUnit, xUnit, etc.
- **CI/CD**: .github/workflows, .gitlab-ci.yml, Jenkinsfile, etc.
- **Infrastructure**: Dockerfile, docker-compose.yml, terraform/, k8s/, etc.

### 2.2 Architecture Discovery

Map the system structure:
- **Module boundaries**: How is code organized? (by feature, by layer, by domain)
- **Entry points**: main files, index files, app bootstrapping
- **Data flow**: Request → Controller → Service → Repository → Database
- **External integrations**: APIs consumed, message queues, third-party services
- **State management**: Databases, caches, session stores, file storage
- **Communication patterns**: REST, GraphQL, gRPC, WebSocket, message bus

### 2.3 Convention Discovery

Extract patterns from the actual code:
- **Naming conventions**: camelCase, snake_case, PascalCase usage
- **File organization**: How are files named and structured
- **Error handling patterns**: Try/catch, Result types, error boundaries
- **Testing patterns**: Unit vs integration, mocking strategy, test location
- **Configuration**: Environment variables, config files, feature flags

### 2.4 Feature Inventory

List every major capability the system provides. For each:
- What user problem does it solve?
- What are the main user flows?
- Which files/modules implement it?
- What data does it operate on?
- What external dependencies does it have?

## Phase 3: Constitution Creation

Based on the analysis, create a constitution that codifies **existing** practices.

```
/speckit.constitution Create principles based on this existing [language/framework] 
codebase. The project follows these patterns:
- Architecture: [monolith/microservices/modular]
- Testing: [TDD/BDD/integration-focused/minimal]
- Code style: [conventions discovered]
- Build/deploy: [CI/CD patterns]
- Quality gates: [what exists in CI]
Focus on principles that match what the team already does.
```

### Constitution Guidelines for Brownfield

**DO**:
- Codify existing successful patterns as principles
- Include technology-specific constraints already in place
- Reference existing quality gates from CI/CD
- Document the team's actual development workflow
- Include architectural boundaries that already exist

**DON'T**:
- Impose new rules the team doesn't follow
- Add aspirational principles not yet practiced
- Over-constrain with rules that conflict with existing code
- Ignore existing technical debt (acknowledge it)

### Example Constitution Sections for Brownfield

```markdown
## Additional Constraints

### Existing Technical Debt
- [Debt item 1]: Acknowledged, tracked in [system]
- [Debt item 2]: Planned for resolution in [timeframe]

### Migration Path
- New code follows these principles; existing code migrates incrementally
- No big-bang rewrites; new features comply, old features migrate as touched
```

## Phase 4: Retroactive Feature Specifications

For each major feature identified in the inventory, create a retrospective spec.

### Process Per Feature

1. **Create the feature directory**:
   ```bash
   mkdir -p .specify/specs/NNN-feature-name
   ```

2. **Write spec.md** focusing on:
   - What the feature does (user perspective)
   - User stories it satisfies (reconstructed from actual behavior)
   - Acceptance criteria (derived from existing tests or behavior)
   - Known issues or debt (`[KNOWN ISSUE: description]`)
   - Current status: `Delivered`

3. **Optionally create plan.md** documenting:
   - Technology choices made (with rationale if known)
   - Architecture decisions
   - Integration points

### Template for Retroactive Spec

```markdown
# Feature Specification: [Feature Name]

**Status**: Delivered
**Reverse-Engineered**: [DATE]
**Source**: Existing implementation in [files/modules]

## User Scenarios & Testing

### User Story 1 - [Title] (Priority: P1)
[Describe what users can currently do]

**Acceptance Scenarios** (derived from existing behavior):
1. **Given** [current state], **When** [user action], **Then** [observed behavior]

## Requirements (As Implemented)

### Functional Requirements
- **FR-001**: System currently [capability] — implemented in [file/module]
- **FR-002**: System currently [capability]

## Known Issues & Technical Debt
- **[KNOWN ISSUE]**: [Description of known limitation or debt]
- **[KNOWN ISSUE]**: [Description]

## Implementation Notes
- Primary modules: [list of files/directories]
- Data model: [entities and storage]
- External dependencies: [integrations]
```

### Prioritizing Which Features to Spec

Not everything needs a retroactive spec. Prioritize:
1. **Features about to change** — spec them before modifying
2. **Complex features** — most value from documentation
3. **Features with tribal knowledge** — reduce bus factor
4. **Features with technical debt** — document for planned remediation

## Phase 5: Going Forward

Once the bootstrap is complete:

1. **New features** follow the full SDD workflow: specify → clarify → plan → tasks → implement
2. **Modifications to existing features**: 
   - Update (or create) the feature spec first
   - Then plan the change as a new sub-feature or modification
3. **Bug fixes**: Reference the relevant spec, update acceptance criteria if needed
4. **Technical debt**: Create specs for debt remediation as features

## Useful Extensions for Brownfield

| Extension | Purpose |
|-----------|---------|
| **Brownfield Bootstrap** | Auto-discover architecture, adopt SDD incrementally |
| **Repository Index** | Generate index for existing repo overview |
| **Reconcile** | Reconcile implementation drift with spec artifacts |
| **Spec Sync** | Detect and resolve drift between specs and implementation |
| **DocGuard** | Validate and score project documentation |

Install via:
```bash
specify extension add spec-kit-brownfield
specify extension add spec-kit-repoindex
```

## Common Pitfalls

1. **Trying to spec everything at once** — Start with features being actively changed
2. **Making the constitution aspirational** — It should reflect reality, not wishes
3. **Over-specifying existing features** — Keep retroactive specs concise
4. **Ignoring existing tests** — Mine tests for acceptance criteria
5. **Breaking existing workflows** — Spec-kit should enhance, not disrupt
6. **Forgetting to acknowledge tech debt** — Document it in specs, plan remediation

## Brownfield Walkthrough Examples

Reference these community walkthroughs for real-world examples:
- **ASP.NET CMS** (~307k lines): Added Docker + REST API to CarrotCakeCMS-Core
- **Java EE Runtime** (~420k lines, 180 Maven modules): Added Admin Console to Piranha
- **Go + React** (NASA Hermes): Added telemetry dashboard via terminal-only workflow
