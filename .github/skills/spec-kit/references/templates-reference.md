# Spec-Kit Templates Reference

## Constitution Template

**Location**: `.specify/templates/constitution-template.md`  
**Output**: `.specify/memory/constitution.md`

```markdown
# [PROJECT_NAME] Constitution

## Core Principles

### [PRINCIPLE_1_NAME]
[PRINCIPLE_1_DESCRIPTION]

### [PRINCIPLE_2_NAME]
[PRINCIPLE_2_DESCRIPTION]

### [PRINCIPLE_3_NAME]
[PRINCIPLE_3_DESCRIPTION]

### [PRINCIPLE_4_NAME]
[PRINCIPLE_4_DESCRIPTION]

### [PRINCIPLE_5_NAME]
[PRINCIPLE_5_DESCRIPTION]

## [SECTION_2_NAME]
<!-- Additional Constraints, Security Requirements, Performance Standards -->
[SECTION_2_CONTENT]

## [SECTION_3_NAME]
<!-- Development Workflow, Review Process, Quality Gates -->
[SECTION_3_CONTENT]

## Governance
[GOVERNANCE_RULES]
<!-- Constitution supersedes all other practices; Amendments require documentation -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
```

### Key Rules
- Principles are numbered with Roman numerals (I, II, III, ...)
- User can request more or fewer principles than template shows
- Version follows semver: MAJOR (breaking governance), MINOR (new principles), PATCH (clarifications)
- Governance section must include amendment procedure and compliance expectations
- After update, produce a **Sync Impact Report** checking templates for consistency

---

## Spec Template

**Location**: `.specify/templates/spec-template.md`  
**Output**: `specs/NNN-feature-name/spec.md`

```markdown
# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - [Brief Title] (Priority: P1)
[User journey in plain language]

**Why this priority**: [Value explanation]
**Independent Test**: [How to test independently]

**Acceptance Scenarios**:
1. **Given** [state], **When** [action], **Then** [outcome]
2. **Given** [state], **When** [action], **Then** [outcome]

### User Story 2 - [Brief Title] (Priority: P2)
...

### Edge Cases
- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST [capability]
- **FR-002**: System MUST [capability]
- **FR-006**: System MUST [NEEDS CLARIFICATION: specific question]

### Key Entities *(if data involved)*
- **[Entity 1]**: [What it represents, key attributes]
- **[Entity 2]**: [Relationships to other entities]

## Success Criteria *(mandatory)*
- **SC-001**: [Measurable metric - technology-agnostic]
- **SC-002**: [Measurable metric]

## Assumptions
- [Assumption about target users]
- [Assumption about scope boundaries]
```

### Key Rules
- User stories MUST be prioritized (P1, P2, P3)
- Each story MUST be independently testable (standalone MVP slice)
- Focus on WHAT and WHY, never HOW
- Max 3 `[NEEDS CLARIFICATION]` markers
- Success criteria must be measurable AND technology-agnostic
- Remove inapplicable sections entirely (not "N/A")

---

## Plan Template

**Location**: `.specify/templates/plan-template.md`  
**Output**: `specs/NNN-feature-name/plan.md`

```markdown
# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

## Summary
[Primary requirement + technical approach]

## Technical Context
**Language/Version**: [e.g., Python 3.11]
**Primary Dependencies**: [e.g., FastAPI]
**Storage**: [e.g., PostgreSQL or N/A]
**Testing**: [e.g., pytest]
**Target Platform**: [e.g., Linux server]
**Project Type**: [e.g., library/cli/web-service]
**Performance Goals**: [domain-specific]
**Constraints**: [domain-specific]
**Scale/Scope**: [domain-specific]

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
[Gates determined from constitution file]

## Project Structure

### Documentation (this feature)
specs/[###-feature]/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md

### Source Code (repository root)
[Project-specific structure]

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|-----------|--------------------------------------|
```

### Key Rules
- Technical context filled with actual choices (not placeholders)
- Constitution Check gates must pass before proceeding
- Complexity tracking only if Constitution gates have justified violations
- Keep high-level; detailed algorithms go in implementation-details files
- Research.md documents technology decisions with rationale

---

## Tasks Template

**Location**: `.specify/templates/tasks-template.md`  
**Output**: `specs/NNN-feature-name/tasks.md`

```markdown
# Tasks: [FEATURE NAME]

**Prerequisites**: plan.md (required), spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)
- [ ] T001 Create project structure
- [ ] T002 Initialize project with dependencies
- [ ] T003 [P] Configure linting and formatting

## Phase 2: Foundational (Blocking Prerequisites)
⚠️ CRITICAL: No user story work until this completes
- [ ] T004 Setup database schema
- [ ] T005 [P] Implement auth framework
**Checkpoint**: Foundation ready

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP
### Tests (if requested) ⚠️
- [ ] T010 [P] [US1] Contract test
- [ ] T011 [P] [US1] Integration test
### Implementation
- [ ] T012 [P] [US1] Create models
- [ ] T014 [US1] Implement service (depends on T012)
**Checkpoint**: US1 independently functional

## Phase 4: User Story 2 - [Title] (Priority: P2)
...

## Phase N: Polish & Cross-Cutting
- [ ] TXXX [P] Documentation
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

## Dependencies & Execution Order
- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phase 3+)
- User stories can proceed in parallel after Foundational

## Implementation Strategy
### MVP First: Setup → Foundational → US1 → STOP & VALIDATE
### Incremental: Each story adds value without breaking previous
```

### Key Rules
- Tasks organized by user story for traceability
- `[P]` = parallelizable (different files, no deps)
- Tests MUST be written and FAIL before implementation (if requested)
- Models before services, services before endpoints
- Commit after each task or logical group
- Each checkpoint = story independently verifiable
