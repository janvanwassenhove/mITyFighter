# Scene Flow

## Scene Graph

```
BootScene
  │
  ▼
PreloadScene
  │
  ▼
TitleScene ◄──────────────────────────────┐
  │                                        │
  ├──► ModeSelectScene                     │
  │      ├──► CharacterSelectScene         │
  │      │      └──► StageSelectScene      │
  │      │             └──► FightScene ────┘
  │      │
  │      ├──► StorySelectScene
  │      │      └──► DifficultySelectScene
  │      │             └──► StoryModeScene
  │      │                    └──► FightScene ────┘
  │      │
  │      └──► PlaygroundScene
  │
  ├──► SettingsScene ──────────────────────┘
  │
  └──► AboutScene ─────────────────────────┘
```

## Scene Responsibilities

| Scene | Key Actions |
|-------|-------------|
| **BootScene** | Load JSON data (fighters, backgrounds, audio), show loading indicator |
| **PreloadScene** | Load all sprite strips, backgrounds, and audio via Phaser loader; create animations |
| **TitleScene** | Display title, menu options (Play, Settings, About) |
| **ModeSelectScene** | Choose: 1P vs CPU, 2P Local, Story Mode |
| **CharacterSelectScene** | Grid-based fighter selection for P1/P2, preview animations |
| **StageSelectScene** | Background selection with preview |
| **DifficultySelectScene** | Easy / Normal / Hard for story mode |
| **StorySelectScene** | Character selection for story mode |
| **StoryModeScene** | Story progression, sequential fights |
| **FightScene** | Main gameplay loop: sim tick → render → input capture |
| **PlaygroundScene** | 2P sandbox, fighter cycling (Q/E, U/O), debug overlay |
| **SettingsScene** | Configure controls, numpad toggle, volume |
| **AboutScene** | Credits, version info |

## Scene Data Passing

Scenes pass data via Phaser's scene data mechanism:
```typescript
this.scene.start('FightScene', {
  player1: { fighterId: 'ninja_monk' },
  player2: { fighterId: 'kunoichi' },
  backgroundId: 'dojo',
});
```

## Adding a New Scene

1. Create `src/game/scenes/NewScene.ts` (PascalCase)
2. Register in `src/game/config/gameConfig.ts` scene array
3. Add transitions from/to existing scenes
4. Update `docs/ARCHITECTURE.md` scene table
5. Update this reference file
