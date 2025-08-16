# Contributing to Ocean Adventure

Welcome to the Ocean Adventure project! We're excited to have you contribute to this 3D browser-based underwater platformer. This guide will help you get started with contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)
- [Performance Guidelines](#performance-guidelines)

## Code of Conduct

This project adheres to a welcoming and inclusive environment. By participating, you are expected to:

- **Be respectful** and considerate in all interactions
- **Be collaborative** and help others learn and grow
- **Be patient** with newcomers and different skill levels
- **Be constructive** when providing feedback or criticism
- **Focus on the project goals** and maintain productive discussions

## Getting Started

### Prerequisites
Before contributing, ensure you have:
- Node.js 16+ installed
- Basic knowledge of JavaScript/TypeScript
- Understanding of 3D graphics concepts (helpful but not required)
- Familiarity with Git and GitHub workflows

### Setup Development Environment
1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/3dgame.git
   cd 3dgame
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser

### Understanding the Codebase
- Read the [Architecture Overview](ARCHITECTURE.md)
- Explore the `src/` directory structure
- Run the game and familiarize yourself with the mechanics
- Check out existing issues labeled `good first issue`

## Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `bugfix/description` - Bug fixes  
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `performance/description` - Performance improvements

### Commit Message Format
Follow the conventional commit format:
```
type(scope): brief description

Detailed explanation of changes (if needed)

Closes #issue_number
```

Examples:
```
feat(player): add underwater swimming physics
fix(audio): resolve 3D audio positioning bug
docs(setup): update installation instructions
```

### Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `perf` - Performance improvements
- `chore` - Maintenance tasks

## Coding Standards

### JavaScript/TypeScript Style
We follow a consistent coding style enforced by ESLint and Prettier:

```javascript
// Use descriptive variable names
const underwaterCurrentStrength = 0.5
const starCollectionSound = 'audio/star-collect.ogg'

// Prefer const/let over var
const gameConfig = {
  targetFPS: 60,
  maxParticles: 1000
}

// Use async/await for asynchronous operations
async function loadGameAssets() {
  try {
    const textures = await textureLoader.loadAsync('textures/ocean.jpg')
    return textures
  } catch (error) {
    console.error('Failed to load textures:', error)
    throw error
  }
}

// Document complex functions
/**
 * Calculates underwater physics for player movement
 * @param {Vector3} velocity - Current player velocity
 * @param {number} depth - Current depth below surface
 * @param {number} deltaTime - Time since last frame
 * @returns {Vector3} Updated velocity after physics
 */
function applyUnderwaterPhysics(velocity, depth, deltaTime) {
  // Implementation here
}
```

### File Structure Guidelines
```
src/
├── core/                   # Core engine systems
│   ├── Engine.js          # Main game engine
│   ├── Renderer.js        # Rendering system
│   └── Physics.js         # Physics system
├── components/             # Reusable game components
│   ├── Player.js          # Player controller
│   ├── Collectible.js     # Star collectibles
│   └── Environment.js     # Environment objects
├── scenes/                 # Game scenes and levels
│   ├── GameScene.js       # Main game scene
│   ├── MenuScene.js       # Menu interface
│   └── levels/            # Individual level data
├── utils/                  # Utility functions
│   ├── MathUtils.js       # Mathematical utilities
│   ├── AssetLoader.js     # Asset loading utilities
│   └── PerformanceUtils.js # Performance monitoring
└── assets/                 # Game assets
    ├── models/            # 3D models
    ├── textures/          # Texture files
    └── audio/             # Audio files
```

### Performance Guidelines

#### Memory Management
```javascript
// Use object pooling for frequently created objects
class ParticlePool {
  constructor(size = 1000) {
    this.pool = []
    this.active = []
    
    // Pre-allocate particles
    for (let i = 0; i < size; i++) {
      this.pool.push(new Particle())
    }
  }
  
  acquire() {
    return this.pool.pop() || new Particle()
  }
  
  release(particle) {
    particle.reset()
    this.pool.push(particle)
  }
}

// Dispose of Three.js resources properly
function disposeObject(object) {
  if (object.geometry) object.geometry.dispose()
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach(material => material.dispose())
    } else {
      object.material.dispose()
    }
  }
  if (object.texture) object.texture.dispose()
}
```

#### Rendering Optimization
```javascript
// Use efficient update patterns
class GameObjectManager {
  update(deltaTime) {
    // Batch similar operations
    this.updatePositions(deltaTime)
    this.updateAnimations(deltaTime)
    this.cullInvisibleObjects()
  }
  
  cullInvisibleObjects() {
    // Only render objects visible to camera
    this.objects.forEach(obj => {
      obj.visible = this.frustum.intersectsObject(obj)
    })
  }
}

// Limit expensive operations
let frameCount = 0
function expensiveOperation() {
  if (frameCount % 60 === 0) { // Only run once per second at 60fps
    // Expensive calculations here
  }
  frameCount++
}
```

## Testing Guidelines

### Unit Tests
Write unit tests for all new functionality:

```javascript
// tests/unit/Player.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { Player } from '../../src/components/Player.js'

describe('Player', () => {
  let player
  
  beforeEach(() => {
    player = new Player()
  })
  
  it('should initialize with default position', () => {
    expect(player.position.x).toBe(0)
    expect(player.position.y).toBe(0)
    expect(player.position.z).toBe(0)
  })
  
  it('should apply swimming physics correctly', () => {
    const initialVelocity = player.velocity.clone()
    player.applySwimmingForce({ x: 1, y: 0, z: 0 })
    
    expect(player.velocity.x).toBeGreaterThan(initialVelocity.x)
  })
})
```

### Integration Tests
Test component interactions:

```javascript
// tests/integration/GameScene.test.js
import { describe, it, expect } from 'vitest'
import { GameScene } from '../../src/scenes/GameScene.js'

describe('GameScene Integration', () => {
  it('should handle star collection correctly', async () => {
    const scene = new GameScene()
    await scene.initialize()
    
    const initialStarCount = scene.collectibles.stars.length
    scene.player.position.copy(scene.collectibles.stars[0].position)
    scene.update(0.016) // Simulate one frame
    
    expect(scene.collectibles.stars.length).toBe(initialStarCount - 1)
    expect(scene.ui.starCount).toBe(1)
  })
})
```

### End-to-End Tests
Test complete user workflows:

```javascript
// tests/e2e/gameplay.spec.js
import { test, expect } from '@playwright/test'

test('complete level by collecting all stars', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  // Wait for game to load
  await page.waitForSelector('.game-canvas')
  
  // Start the game
  await page.click('button:has-text("Start Game")')
  
  // Simulate collecting stars (simplified)
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowUp') // Move forward
    await page.waitForTimeout(1000)
  }
  
  // Check if level completion screen appears
  await expect(page.locator('.level-complete')).toBeVisible()
})
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Pull Request Process

### Before Submitting
1. **Run all tests**: Ensure `npm test` passes
2. **Check code style**: Run `npm run lint` and `npm run format`
3. **Test on mobile**: Verify mobile compatibility
4. **Update documentation**: If you changed APIs or added features
5. **Performance check**: Ensure no significant performance regression

### Pull Request Template
When creating a pull request, use this template:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] Mobile testing completed

## Performance Impact
- [ ] No performance impact
- [ ] Performance improvement
- [ ] Potential performance regression (explained below)

## Screenshots (if applicable)
Add screenshots to show visual changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

### Review Process
1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Testing verification** on multiple browsers/devices
4. **Performance review** for significant changes
5. **Documentation review** if docs were updated

## Issue Reporting

### Bug Reports
Use the bug report template:

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
- Device: [e.g. iPhone X, Desktop]

**Additional Context**
Any other context about the problem.
```

### Feature Requests
Include:
- **Problem description**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other possible approaches
- **Impact assessment**: Performance/complexity considerations

## Documentation

### Code Documentation
- Use JSDoc for function documentation
- Include examples for complex APIs
- Document performance characteristics
- Explain design decisions in comments

### README Updates
- Keep installation instructions current
- Update feature lists
- Maintain compatibility information
- Include relevant screenshots

### API Documentation
- Document all public APIs
- Include parameter types and return values
- Provide usage examples
- Note any breaking changes

## Performance Guidelines

### Target Performance
- **Desktop**: 60 FPS at 1920x1080
- **Mobile**: 30+ FPS at device resolution
- **Loading**: < 3 seconds initial load
- **Memory**: < 100MB peak usage on mobile

### Performance Testing
```bash
# Build and test performance
npm run build
npm run perf:test

# Profile memory usage
npm run perf:memory

# Analyze bundle size
npm run analyze
```

### Optimization Checklist
- [ ] Use object pooling for frequently created objects
- [ ] Implement LOD (Level of Detail) for 3D models
- [ ] Optimize texture sizes and formats
- [ ] Minimize draw calls through batching
- [ ] Use efficient data structures
- [ ] Profile and optimize hot code paths

## Questions and Support

### Getting Help
- **Documentation**: Check existing docs first
- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bug reports and feature requests
- **Code Review**: Ask questions in pull request comments

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General project discussion
- **Pull Request Comments**: Code-specific discussions

Thank you for contributing to Ocean Adventure! Your efforts help make this underwater world more immersive and enjoyable for everyone. 🌊⭐