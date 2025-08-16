# Ocean Adventure 🌊

A 3D browser-based underwater platform game where players dive into an immersive oceanic world, collecting glowing stars and navigating to luminous gates to complete challenging levels.

[![CI/CD Pipeline](https://github.com/commjoen/3dgame/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/commjoen/3dgame/actions)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Performance](https://img.shields.io/badge/Performance-60%20FPS-green.svg)](https://github.com/commjoen/3dgame/wiki/Performance)
[![Mobile Friendly](https://img.shields.io/badge/Mobile-Compatible-orange.svg)](https://github.com/commjoen/3dgame/wiki/Mobile-Support)

## 🎮 Game Overview

**Ocean Adventure** is a captivating 3D platformer that transports players into a vibrant underwater world. Experience the freedom of swimming through diverse oceanic environments, from shallow coral gardens to mysterious deep-sea caverns.

### 🎯 Gameplay Features
- **Immersive 3D Swimming**: Realistic underwater physics with fluid movement mechanics
- **Collectible Stars**: Gather glowing star objects scattered throughout each level
- **Dynamic Environments**: Explore coral reefs, deep ocean trenches, and underwater caves
- **Progressive Difficulty**: Levels increase in complexity with advanced navigation challenges
- **Mobile Optimized**: Full touch control support for smartphones and tablets
- **Cross-Platform**: Runs seamlessly on desktop browsers and mobile devices

### 🌟 Key Highlights
- **WebGL-Powered Graphics**: Stunning 3D visuals with underwater lighting effects
- **Responsive Design**: Adaptive interface for all screen sizes
- **Accessibility Features**: Inclusive design for players of all abilities
- **Performance Optimized**: Smooth 60 FPS gameplay on desktop, 30+ FPS on mobile
- **Open Source**: Community-driven development with comprehensive documentation

## 🚀 Quick Start

### Play Now
Visit [Ocean Adventure Game](https://commjoen.github.io/3dgame) to play directly in your browser!

### System Requirements
- **Desktop**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS 13+ Safari, Android Chrome 80+
- **Hardware**: WebGL 2.0 support, 2GB+ RAM recommended

## 🛠️ Development

### Prerequisites
- Node.js 16+ 
- npm 7+
- Modern web browser with WebGL support

### Installation
```bash
# Clone the repository
git clone https://github.com/commjoen/3dgame.git
cd 3dgame

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the game in action!

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run all tests
npm run lint         # Run code linter
npm run preview      # Preview production build
```

## 📖 Documentation

### 📋 Project Documentation
- **[Copilot Plan](COPILOT_PLAN.md)** - Comprehensive development roadmap and milestones
- **[Game Design](docs/GAME_DESIGN.md)** - Detailed game mechanics and design decisions
- **[Architecture](docs/ARCHITECTURE.md)** - System design and technical implementation
- **[Setup Guide](docs/SETUP.md)** - Development environment setup instructions
- **[Contributing](docs/CONTRIBUTING.md)** - Guidelines for contributors

### 🎯 Quick Links
- [Installation Guide](docs/SETUP.md#installation)
- [API Documentation](docs/ARCHITECTURE.md#api-design)
- [Performance Guidelines](docs/CONTRIBUTING.md#performance-guidelines)
- [Mobile Development](docs/SETUP.md#mobile-development)

## 🎨 Game Features

### 🏊‍♀️ Swimming Mechanics
- **Fluid Movement**: Natural underwater physics with momentum and drag
- **360° Freedom**: Complete 3D movement in all directions
- **Surface Interaction**: Breach the water surface for different gameplay dynamics
- **Realistic Physics**: Buoyancy effects and underwater currents

### 🌊 Environments
- **Coral Gardens**: Bright, colorful shallow waters perfect for beginners
- **Deep Ocean**: Challenging mid-level environments with limited visibility
- **Underwater Caves**: Complex navigation requiring strategic exploration
- **Abyss Depths**: Advanced levels with minimal lighting and hidden passages

### ⭐ Collectibles & Objectives
- **Glowing Stars**: Primary collectibles with satisfying pickup effects
- **Luminous Gates**: Level completion objectives that activate after collecting all stars
- **Hidden Areas**: Secret locations with bonus content for explorers
- **Achievement System**: Goals and challenges beyond main progression

## 📱 Mobile Support

Ocean Adventure is fully optimized for mobile devices with:

### 📲 Touch Controls
- **Swipe Navigation**: Intuitive swimming direction control
- **Virtual Joystick**: Optional on-screen movement controls
- **Tap Interactions**: Simple touch-based object interaction
- **Gesture Support**: Pinch-to-zoom camera control

### ⚡ Performance Optimization
- **Adaptive Quality**: Automatic graphics adjustment based on device capability
- **Efficient Rendering**: Optimized draw calls and texture usage
- **Battery Conscious**: Frame rate limiting to preserve battery life
- **Memory Management**: Efficient asset loading and garbage collection

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Here's how to get started:

### 🔰 First-Time Contributors
1. Check out issues labeled [`good first issue`](https://github.com/commjoen/3dgame/labels/good%20first%20issue)
2. Read our [Contributing Guidelines](docs/CONTRIBUTING.md)
3. Fork the repository and create a feature branch
4. Make your changes and add tests
5. Submit a pull request with a clear description

### 🚀 Advanced Contributors
- Explore the [Architecture Documentation](docs/ARCHITECTURE.md)
- Check the [Copilot Plan](COPILOT_PLAN.md) for upcoming features
- Review [Performance Guidelines](docs/CONTRIBUTING.md#performance-guidelines)
- Join discussions in [GitHub Issues](https://github.com/commjoen/3dgame/issues)

### 📝 Types of Contributions
- **Bug Fixes**: Report and fix issues
- **Feature Development**: Implement new game mechanics
- **Performance Optimization**: Improve rendering and memory usage
- **Documentation**: Enhance guides and API documentation
- **Testing**: Add unit, integration, and end-to-end tests
- **Mobile Support**: Improve mobile compatibility and controls

## 🏗️ Project Structure

```
3dgame/
├── src/                    # Source code
│   ├── core/              # Core game engine
│   ├── components/        # Game components
│   ├── scenes/            # Game scenes and levels
│   ├── assets/            # Game assets
│   └── utils/             # Utility functions
├── docs/                  # Documentation
├── tests/                 # Test suites
├── .github/workflows/     # CI/CD pipelines
├── public/                # Static assets
└── COPILOT_PLAN.md       # Development roadmap
```

## 🔧 Technical Stack

### 🎨 Frontend Technologies
- **Rendering**: Three.js (WebGL 2.0/1.0)
- **Build Tool**: Vite with TypeScript
- **Physics**: Custom underwater physics simulation
- **Audio**: Web Audio API with 3D spatial sound
- **Testing**: Vitest + Playwright for E2E testing

### 🚀 Performance Features
- **Object Pooling**: Efficient memory management
- **LOD System**: Level-of-detail optimization
- **Frustum Culling**: Render only visible objects
- **Texture Compression**: Optimized asset loading
- **Progressive Loading**: Priority-based resource loading

## 📊 Performance Targets

| Platform | Target FPS | Load Time | Memory Usage |
|----------|-----------|-----------|--------------|
| Desktop  | 60 FPS    | < 3s      | < 200MB      |
| Mobile   | 30+ FPS   | < 5s      | < 100MB      |
| Tablet   | 45+ FPS   | < 4s      | < 150MB      |

## 🐛 Bug Reports & Feature Requests

### 🔍 Reporting Issues
Found a bug? We'd love to fix it! Please:
1. Check [existing issues](https://github.com/commjoen/3dgame/issues) first
2. Use our [bug report template](https://github.com/commjoen/3dgame/issues/new?template=bug_report.md)
3. Include browser/device information and steps to reproduce
4. Add screenshots or screen recordings if applicable

### 💡 Feature Requests
Have a great idea? We'd love to hear it! Please:
1. Check [existing feature requests](https://github.com/commjoen/3dgame/labels/enhancement)
2. Use our [feature request template](https://github.com/commjoen/3dgame/issues/new?template=feature_request.md)
3. Describe the problem it solves and proposed solution
4. Consider the impact on performance and complexity

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

### 🤲 Open Source Commitment
- **Free Forever**: Always free to play and modify
- **Community Driven**: Developed by and for the community
- **Transparent Development**: All decisions made in the open
- **Educational Use**: Perfect for learning 3D web development

## 🙏 Acknowledgments

### 💖 Special Thanks
- **Three.js Community** for the amazing 3D library
- **WebGL Contributors** for making 3D web graphics possible
- **Open Source Community** for tools and inspiration
- **Beta Testers** for early feedback and bug reports

### 🌟 Built With
- [Three.js](https://threejs.org/) - 3D JavaScript library
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Vitest](https://vitest.dev/) - Fast unit testing framework
- [Playwright](https://playwright.dev/) - End-to-end testing

## 📞 Contact & Support

### 💬 Get Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/commjoen/3dgame/issues)
- **GitHub Discussions**: [Community Q&A and ideas](https://github.com/commjoen/3dgame/discussions)
- **Documentation**: [Comprehensive guides and API docs](docs/)

### 🔗 Links
- **Play Game**: [Ocean Adventure](https://commjoen.github.io/3dgame)
- **Source Code**: [GitHub Repository](https://github.com/commjoen/3dgame)
- **Issue Tracker**: [Bug Reports & Features](https://github.com/commjoen/3dgame/issues)
- **Wiki**: [Additional Documentation](https://github.com/commjoen/3dgame/wiki)

---

**Dive into Ocean Adventure and explore the depths of 3D web gaming! 🌊🏊‍♀️⭐**