# mITyFighter

A production-grade 2D pixel fighting game built with TypeScript, Phaser 3, and Vite.

## 🎮 Features

- **6 Playable Fighters**: Homeless 1-3, Kunoichi, Ninja Monk, Ninja Peasant
- **2-Player Local**: Shared keyboard with anti-ghosting key zones
- **Pixel-Perfect Rendering**: Crisp pixel art at any resolution
- **Multiplayer-Ready Architecture**: Deterministic simulation with fixed timestep
- **Extensible Design**: Add new fighters/backgrounds with minimal code changes

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 🎹 Controls

### Player 1 (Left Side)
| Action | Key |
|--------|-----|
| Move | A / D |
| Jump | W |
| Attack 1 | F |
| Attack 2 | G |
| Special | H |
| Block | R |
| Cycle Character | Q / E |

### Player 2 (Right Side - Numpad)
| Action | Key |
|--------|-----|
| Move | ← / → |
| Jump | ↑ |
| Attack 1 | Numpad 1 |
| Attack 2 | Numpad 2 |
| Special | Numpad 3 |
| Block | Numpad 0 |
| Cycle Character | U / O |

### Global
| Action | Key |
|--------|-----|
| Toggle Debug | F1 |
| Cycle Background | Z / C |

> **No Numpad?** Set `useNumpad: false` in `src/game/config/gameConfig.ts` to use J/K/L/I/U/O/P/Y instead.

## 📁 Project Structure

```
mITyFighter/
├── docs/                    # Spec-Kit documentation
│   ├── SPEC_KIT.md         # Development contract
│   ├── ASSETS.md           # Asset conventions
│   ├── ANIMATIONS.md       # Animation system
│   ├── INPUT.md            # Input system
│   ├── NETPLAY_ROADMAP.md  # Future multiplayer
│   ├── EXTENSIBILITY.md    # Adding content
│   ├── ARCHITECTURE.md     # Code structure
│   └── QUALITY_GATES.md    # Quality standards
├── src/
│   ├── main.ts             # Entry point
│   └── game/
│       ├── GameApp.ts      # Application orchestrator
│       ├── config/         # Configuration
│       ├── sim/            # Deterministic simulation
│       ├── assets/         # Asset registries
│       ├── scenes/         # Phaser scenes
│       ├── render/         # Rendering components
│       ├── input/          # Input handling
│       └── utils/          # Utilities
├── sprites/                # Fighter sprite sheets
├── tools/                  # Build tools
└── tests/                  # Unit tests
```

## 🌐 Play Online

The game is hosted on GitHub Pages: **[Play mITyFighter](https://YOUR_USERNAME.github.io/mITyFighter/)**

> Replace `YOUR_USERNAME` with the actual GitHub username/organization once deployed.

## 📚 Documentation

**Read the Spec-Kit before contributing:**

- [SPEC_KIT.md](docs/SPEC_KIT.md) - Development contract (START HERE)
- [EXTENSIBILITY.md](docs/EXTENSIBILITY.md) - How to add fighters/backgrounds
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Code structure
- [QUALITY_GATES.md](docs/QUALITY_GATES.md) - Quality standards

## 🛠️ Development

### Scripts

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # Check code style
npm run lint:fix      # Fix code style
npm run test          # Run tests
npm run validate:assets  # Validate sprites
npm run validate:all  # All checks
```

### Adding a New Fighter

1. Add sprite sheets to `sprites/<FighterName>/`
2. Update `src/game/assets/fighterRegistry.ts`
3. Update `docs/ASSETS.md`
4. Run `npm run validate:assets`

See [EXTENSIBILITY.md](docs/EXTENSIBILITY.md) for details.

## 🏗️ Architecture

```
Input → InputManager → InputFrame (bitmask)
                            ↓
                    FixedTimestepLoop (60Hz)
                            ↓
                      Simulation
                            ↓
                       Renderer
```

- **Simulation** (`sim/`): Deterministic game logic, no Phaser dependencies
- **Render** (`render/`): Phaser sprites and visuals
- **Input** (`input/`): Keyboard handling, per-tick capture

This separation enables future rollback netcode.

## 🚀 Deployment

### GitHub Pages (Automatic)

The game automatically deploys to GitHub Pages when you push to the `main` branch.

**Setup:**
1. Go to your repository's **Settings** → **Pages**
2. Under "Build and deployment", select **GitHub Actions** as the source
3. Push to `main` and the game will deploy automatically

**Manual deployment:**
- Go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**

### Local Production Build

```bash
npm run build         # Build to ./dist
npm run preview       # Preview the build locally
```

## 🎯 Roadmap

- [x] Asset system with auto frame detection
- [x] 2-player playground
- [x] Anti-ghosting key zones
- [x] Fixed timestep simulation
- [x] Debug overlay
- [ ] Hitbox/hurtbox system
- [ ] Health bars
- [ ] Round system
- [ ] Local rollback testing
- [ ] Online multiplayer (WebRTC)

## 📝 License

MIT
