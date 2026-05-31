# Tasks: [FEATURE_NAME]

**Prerequisites**: plan.md (required), spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)
- [ ] T001 [SETUP_TASK_1]
- [ ] T002 [P] [SETUP_TASK_2]

## Phase 2: Documentation & Registry (Article I compliance)
⚠️ CRITICAL: Documentation updates before implementation code
- [ ] T003 Update relevant docs/ files
- [ ] T004 [P] Update registries if adding content
**Checkpoint**: Documentation current

## Phase 3: User Story 1 — [Title] (Priority: P1) 🎯 MVP
### Tests ⚠️
- [ ] T010 [P] [US1] Write unit test (must fail first)
### Implementation
- [ ] T011 [US1] Implement feature code
- [ ] T012 [US1] Verify test passes
**Checkpoint**: US1 independently functional

## Phase 4: User Story 2 — [Title] (Priority: P2)
### Tests ⚠️
- [ ] T020 [P] [US2] Write unit test
### Implementation
- [ ] T021 [US2] Implement feature code
**Checkpoint**: US2 independently functional

## Phase N: Polish & Validation
- [ ] TXXX [P] Run `npm run lint`
- [ ] TXXX [P] Run `npm run test`
- [ ] TXXX [P] Run `npm run validate:assets`
- [ ] TXXX Run `npm run build`
- [ ] TXXX Run quickstart.md validation scenarios

## Dependencies & Execution Order
- Setup (Phase 1) → Documentation (Phase 2) → User Stories (Phase 3+)
- User stories can proceed in parallel after Documentation phase

## Implementation Strategy
### MVP First: Setup → Docs → US1 → STOP & VALIDATE
### Incremental: Each story adds value without breaking previous
