---
name: codebase-knowledge
description: "DevoxxFighter codebase map and conventions. Use when: navigating project structure, finding where code lives, understanding module boundaries, checking naming conventions, locating registries, understanding scene flow, checking asset pipeline, or onboarding to the codebase. Covers TypeScript/Phaser 3/Vite/Vitest project layout."
---
# Codebase Knowledge

Complete map of the DevoxxFighter project structure, module responsibilities, and conventions.

## When to Use
- Finding where to implement a feature
- Understanding module boundaries (especially sim/ vs render/)
- Checking naming conventions for files, types, IDs
- Locating registries, configs, or data files
- Understanding the scene flow
- Checking asset loading pipeline
- Understanding the test structure

## Procedure

### 1. Locate the Right Module

Read [architecture map](./references/architecture-map.md) for the full module breakdown with file→purpose mappings.

### 2. Check Naming Conventions

Read [naming conventions](./references/naming-conventions.md) for all naming rules.

### 3. Understand Asset Pipeline

Read [asset pipeline](./references/asset-pipeline.md) for how fighters, backgrounds, and audio are loaded.

### 4. Check Scene Flow

Read [scene flow](./references/scene-flow.md) for the complete scene graph.

### 5. Validate Your Change

After implementing, run:
```bash
npm run validate:assets   # Asset integrity
npm run lint              # ESLint + Prettier
npm run test              # Vitest
npm run build             # TypeScript compilation
```
