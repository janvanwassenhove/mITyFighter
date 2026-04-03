---
description: "Asset and registry conventions for sprite strips, backgrounds, and JSON data files. Use when editing asset loaders, registries, or adding new game content."
applyTo: ["src/game/assets/**", "public/data/**", "public/sprites/**", "public/backgrounds/**"]
---
# Asset Conventions

- Fighter sprites: 128×128 frames, horizontal PNG strip, transparent background
- Frame count auto-detected: `texture.width / 128` — never hardcode
- Animation key format: `fighter:<fighterId>:<actionId>`
- Fighter IDs: `snake_case`, Action IDs: `camelCase`
- Registries load from JSON at runtime (`public/data/fighters.json`, `backgrounds.json`)
- After any asset change: run `npm run validate:assets`
- Update `docs/ASSETS.md` before modifying asset code
