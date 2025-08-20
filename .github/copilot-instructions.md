# GitHub Copilot Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

# Ocean Adventure - 3D Underwater Platform Game

Ocean Adventure is a 3D browser-based underwater platform game built with Three.js, Vite, and modern web technologies. Players swim through immersive oceanic environments collecting stars and navigating to gates.

## Working Effectively

### Bootstrap and Build
```bash
# Install Node.js 24+ and npm 10+ first (required)
npm install             # Takes ~30 seconds. NEVER CANCEL.
npm run build          # Takes ~12 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
npm run test           # Takes ~42 seconds. NEVER CANCEL. Set timeout to 90+ seconds.
npm run lint           # Takes ~1.5 seconds
npm run format:check   # Takes ~1 second
```

### Run the Application
```bash
# Development mode (starts in ~235ms)
npm run dev            # Access at http://localhost:3000

# Production preview
npm run build && npm run preview
```

### **CRITICAL VALIDATION SCENARIOS**
After making ANY changes, ALWAYS validate:

1. **Game Load Test**: Navigate to http://localhost:3000 and verify:
   - 3D underwater scene renders correctly
   - Player statistics show (Stars: 0, Level: 1, Depth: X.Xm)
   - Settings gear icon (⚙️) appears in top-right

2. **Player Movement Test**: Press W/A/S/D keys and verify:
   - Depth value changes when moving
   - Audio initializes on first movement
   - Player moves smoothly in 3D space

3. **Controls Modal Test**: Click settings icon and verify:
   - Modal opens showing desktop and mobile controls
   - Close button (×) works correctly

4. **Build Validation**: Run full build and verify no errors:
   ```bash
   npm run build        # Must complete in ~12 seconds
   npm run lint         # Must pass with no errors
   npm run format:check # Must pass - all files formatted
   ```

## Build and Test Timing Expectations

**NEVER CANCEL these operations - all timing is validated:**

- `npm install`: 30 seconds (includes some deprecation warnings - normal)
- `npm run build`: 12 seconds (very fast build system)
- `npm run test`: 42 seconds (170/172 tests pass - 2 GitHub Pages tests may fail in dev)
- `npm run lint`: 1.5 seconds
- `npm run format:check`: 1 second
- `npm run dev`: starts in 235ms

## Project Architecture

### Key Directories
```
3dgame/
├── src/
│   ├── main.js              # Main game entry point - START HERE
│   ├── core/                # Core game engine
│   │   ├── Physics.js       # Physics simulation
│   │   ├── AudioEngine.js   # 3D spatial audio
│   │   └── ParticleSystem.js # Underwater effects
│   └── components/          # Game components
│       ├── Player.js        # Player controller
│       ├── Gate.js          # Level completion gates
│       └── StarGeometry.js  # Collectible stars
├── tests/
│   ├── unit/               # Component unit tests
│   ├── integration/        # Full system tests
│   └── e2e/               # Playwright browser tests
├── docs/                  # Project documentation
└── .github/workflows/     # CI/CD pipeline
```

### Core Technologies
- **Three.js**: 3D graphics and WebGL rendering
- **Vite**: Build system and dev server
- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Node.js 24+**: Runtime requirement

## Code Style and Standards

### JavaScript Guidelines
- Use ES6+ modules and modern syntax
- Follow existing Prettier formatting (run `npm run format`)
- Add JSDoc comments for complex functions
- Use descriptive variable names (e.g., `playerPosition`, not `pos`)

### Three.js Best Practices
- Use object pooling for frequently created objects
- Dispose of geometries and materials when no longer needed
- Optimize scene graph hierarchy
- Use LOD (Level of Detail) for performance

### Testing Requirements
- Add unit tests for new components in `tests/unit/`
- Add integration tests for component interactions
- Test mobile controls when adding touch functionality
- Always run full test suite before committing

## Performance Targets

| Platform | Target FPS | Load Time | Memory Usage |
|----------|-----------|-----------|--------------|
| Desktop  | 60 FPS    | < 3s      | < 200MB      |
| Mobile   | 30+ FPS   | < 5s      | < 100MB      |

## Common Development Tasks

### Adding New Game Components
1. Create component in `src/components/YourComponent.js`
2. Add unit tests in `tests/unit/your-component.test.js`
3. Import and integrate in `src/main.js`
4. Test manually with validation scenarios above
5. Run `npm run build && npm run test` to verify

### Mobile Development
- Use touch events for mobile controls
- Test on virtual joystick system in `src/components/`
- Ensure responsive design adapts to screen size
- Handle device orientation changes gracefully

### GitHub Pages Deployment
- Automatic deployment on main branch push
- Manual validation: `./scripts/validate-github-pages.sh`
- Environment variable: `VITE_BASE_PATH=/3dgame/` for correct paths
- Live URL: https://commjoen.github.io/3dgame/

### Container Deployment
```bash
# Local development
docker-compose up ocean-adventure

# Production deployment
docker run -p 8080:80 ghcr.io/commjoen/3dgame:latest
```

## Troubleshooting

### Build Issues
- **Error: Module not found**: Run `npm install` to install dependencies
- **Build fails**: Check Node.js version >= 24.0.0
- **WebGL errors**: Ensure modern browser with WebGL 2.0 support

### Test Failures
- GitHub Pages tests may fail in development (normal)
- Core game tests (physics, player, components) must pass
- Run `npm run test:unit` to focus on core functionality

### Performance Issues
- Use browser dev tools to monitor FPS
- Check memory usage in Task Manager
- Verify hardware acceleration is enabled

## Repository Context Notes

### Git Workflow
- Main branch: stable deployments
- Feature branches: use descriptive names
- All commits trigger CI/CD pipeline
- PR previews automatically deployed

### CI/CD Pipeline
- Validates code quality (lint, format, types)
- Runs comprehensive test suite
- Builds and deploys to GitHub Pages
- Creates container images for deployment

### Dependencies
- Keep minimal and secure
- Update via Dependabot PRs
- Test thoroughly after dependency updates
- Use npm for package management