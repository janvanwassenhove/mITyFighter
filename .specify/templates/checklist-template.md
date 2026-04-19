# Quality Checklist: [FEATURE_NAME]

**Spec**: [link to spec.md]
**Plan**: [link to plan.md]
**Date**: [DATE]

## Requirements Completeness
- [ ] All functional requirements (FR-*) have corresponding tasks
- [ ] All user stories have acceptance scenarios
- [ ] All acceptance scenarios are testable
- [ ] Success criteria are measurable and technology-agnostic
- [ ] No more than 3 `[NEEDS CLARIFICATION]` markers remain

## Constitution Compliance
- [ ] Article I: Documentation updated before code changes
- [ ] Article II: sim/ module free of Phaser dependencies
- [ ] Article III: New content is registry/data-driven
- [ ] Article IV: No `any` types; explicit return types
- [ ] Article V: Pixel-perfect rendering preserved
- [ ] Article VI: Input → Sim → Render separation maintained
- [ ] Article VII: All quality gates pass
- [ ] Article VIII: Naming conventions followed
- [ ] Article IX: Content extensible via documented recipe

## Quality Gates
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run validate:assets` passes
- [ ] `npm run build` passes

## Cross-Artifact Consistency
- [ ] spec.md requirements map to plan.md sections
- [ ] plan.md sections map to tasks.md tasks
- [ ] No orphaned requirements (spec items without tasks)
- [ ] No phantom tasks (tasks without spec backing)

## Implementation Quality
- [ ] Tests written and failing before implementation
- [ ] Each user story independently verifiable
- [ ] No hardcoded values that should be in registries
- [ ] Error handling at system boundaries only
