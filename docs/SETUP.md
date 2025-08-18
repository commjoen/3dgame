# Setup Guide - Ocean Adventure

## Prerequisites

Before setting up the Ocean Adventure development environment, ensure you have the following installed:

### Required Software
- **Node.js** (v24.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v10.0.0 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Modern Web Browser** with WebGL 2.0 support:
  - Chrome 80+
  - Firefox 75+
  - Safari 13+
  - Edge 80+

### Recommended Development Tools
- **Visual Studio Code** - [Download](https://code.visualstudio.com/)
- **VS Code Extensions**:
  - ES6 String HTML
  - JavaScript (ES6) Code Snippets
  - Live Server
  - WebGL GLSL Editor
  - Three.js Snippets

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/commjoen/3dgame.git
cd 3dgame
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Verify Installation
```bash
npm run test
```

### 4. Alternative Setup with Docker
If you prefer using Docker, you can get started quickly:

```bash
# Using Docker Compose (recommended)
docker-compose up ocean-adventure

# Or build and run manually
docker build -t ocean-adventure .
docker run -p 8080:80 ocean-adventure

# Access the game at http://localhost:8080
```

**Docker Development Setup:**
```bash
# Run with development profile for live reload
docker-compose --profile development up ocean-adventure-dev

# Access development server at http://localhost:3000
```

## Development Environment

### Project Structure
```
3dgame/
├── src/                    # Source code
│   ├── core/              # Core game engine
│   ├── components/        # Game components
│   ├── scenes/            # Game scenes and levels
│   ├── assets/            # Game assets (models, textures, audio)
│   ├── shaders/           # GLSL shader files
│   └── utils/             # Utility functions
├── public/                # Static public files
│   ├── index.html         # Main HTML file
│   ├── favicon.ico        # Site icon
│   └── manifest.json      # Web app manifest
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── docs/                  # Documentation
├── .github/workflows/     # GitHub Actions workflows
├── package.json           # Project dependencies
├── vite.config.js         # Build configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project overview
```

### 3. Start Development Server
```bash
npm run dev
```

This will start the Vite development server at `http://localhost:3000` with hot reloading enabled.

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```

## Development Scripts

### Available Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run all tests
npm run test:unit    # Run unit tests only
npm run test:e2e     # Run end-to-end tests
npm run test:watch   # Run tests in watch mode

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier

# Documentation
npm run docs:serve   # Serve documentation locally
npm run docs:build   # Build documentation
```

## Browser Development

### Chrome DevTools Setup
1. Open Developer Tools (F12)
2. Go to **Application** tab
3. Check **Service Workers** for PWA features
4. Use **Performance** tab for profiling
5. Monitor **Memory** tab for memory leaks

### WebGL Debugging
1. Install **WebGL Inspector** browser extension
2. Use **Spector.js** for frame capture
3. Enable WebGL debugging in Chrome:
   ```
   chrome://flags/#enable-webgl-developer-extensions
   ```

### Mobile Development
1. Enable **Remote Debugging**:
   - Chrome: `chrome://inspect`
   - Safari: Develop → [Device Name]
2. Use **Responsive Design Mode** for testing
3. Test on actual devices for touch interactions

## Configuration Files

### Vite Configuration (`vite.config.js`)
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    host: true, // Allow external connections
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'vendor': ['stats.js', 'dat.gui']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three']
  }
})
```

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "outDir": "./dist/types"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Environment Variables

Create a `.env` file in the project root:
```bash
# Development settings
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug

# Game configuration
VITE_GAME_VERSION=1.0.0
VITE_MAX_TEXTURE_SIZE=2048
VITE_ENABLE_ANALYTICS=false

# Performance settings
VITE_TARGET_FPS=60
VITE_MOBILE_TARGET_FPS=30
```

## Asset Pipeline

### 3D Models
- **Format**: GLTF 2.0 (.glb preferred)
- **Tools**: Blender, Maya, 3ds Max
- **Optimization**: Use Draco compression

### Textures
- **Formats**: WebP (preferred), PNG, JPG
- **Sizes**: Power of 2 (512x512, 1024x1024, etc.)
- **Compression**: Use texture compression tools

### Audio
- **Formats**: OGG Vorbis (preferred), MP3 (fallback)
- **Quality**: 44.1kHz, 16-bit
- **Length**: Keep files under 30 seconds for loops

### Asset Optimization Tools
```bash
# Install optimization tools
npm install -g gltf-pipeline
npm install -g imagemin-cli

# Optimize GLTF models
gltf-pipeline -i model.gltf -o model-optimized.glb -d

# Optimize images
imagemin src/assets/textures/*.png --out-dir=src/assets/textures/optimized
```

## Performance Monitoring

### Built-in Performance Tools
```javascript
// Add to main.js for development
import Stats from 'stats.js'

if (import.meta.env.DEV) {
  const stats = new Stats()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb
  document.body.appendChild(stats.dom)
  
  function animate() {
    stats.begin()
    // Your game loop here
    stats.end()
    requestAnimationFrame(animate)
  }
  animate()
}
```

### Memory Monitoring
```javascript
// Monitor memory usage
function monitorMemory() {
  if (performance.memory) {
    console.log({
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    })
  }
}

setInterval(monitorMemory, 5000) // Check every 5 seconds
```

## Debugging

### Common Issues and Solutions

#### WebGL Context Lost
```javascript
// Handle WebGL context loss
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault()
  console.log('WebGL context lost')
  // Pause game, show message to user
})

canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored')
  // Reinitialize WebGL resources
})
```

#### Performance Issues
1. **Check draw calls**: Use WebGL Inspector
2. **Monitor memory**: Use Chrome DevTools Memory tab
3. **Profile code**: Use Performance tab
4. **Test on target devices**: Real mobile device testing

#### Asset Loading Issues
```javascript
// Debug asset loading
const assetLoader = new AssetLoader()
assetLoader.onProgress = (progress) => {
  console.log(`Loading progress: ${progress}%`)
}
assetLoader.onError = (error) => {
  console.error('Asset loading error:', error)
}
```

## Testing Setup

### Unit Testing
```bash
# Install testing dependencies
npm install --save-dev vitest jsdom @vitest/ui

# Run tests
npm run test
```

### E2E Testing
```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run E2E tests
npm run test:e2e
```

### Mobile Testing
1. **Use Browser DevTools** mobile simulation
2. **Test on real devices** via USB debugging
3. **Use cloud testing services** like BrowserStack

## Deployment

### GitHub Pages Deployment
The project automatically deploys to GitHub Pages when changes are pushed to the main branch using modern GitHub deployment actions.

**Deployment Features:**
- ✅ **Automatic deployment** on main branch pushes
- ✅ **Modern GitHub Actions** for reliable deployment
- ✅ **Proper base path handling** for GitHub Pages (`/3dgame/`)
- ✅ **Fast deployment** with optimized artifact upload
- ✅ **Error handling** and deployment status reporting

```bash
# Manual build for GitHub Pages (optional - automated in CI)
VITE_BASE_PATH=/3dgame/ npm run build
```

**Deployment URL:** https://commjoen.github.io/3dgame/

### Container Deployment

**Multi-Architecture Support:**
The project builds Docker containers for both `linux/amd64` and `linux/arm64` architectures automatically.

**Using Pre-built Images:**
```bash
# Pull and run the latest stable version (supports AMD64 and ARM64)
docker pull ghcr.io/commjoen/3dgame:latest
docker run -d -p 80:80 --name ocean-adventure ghcr.io/commjoen/3dgame:latest

# Access the game at http://localhost
```

**Available Image Tags:**
- `latest`: Latest stable version from main branch
- `main`: Latest build from main branch  
- `pr-{number}`: Preview builds for pull requests
- `{branch}-{sha}`: Specific commit builds

**Image Features:**
- ✅ **Multi-platform** support (AMD64/ARM64)
- ✅ **Optimized** multi-stage builds
- ✅ **Security headers** configured in nginx
- ✅ **Health checks** for container monitoring
- ✅ **Proper caching** for static assets
- ✅ **PWA support** with service worker handling

### Kubernetes Deployment
For production Kubernetes deployments:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ocean-adventure
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ocean-adventure
  template:
    metadata:
      labels:
        app: ocean-adventure
    spec:
      containers:
      - name: ocean-adventure
        image: ghcr.io/commjoen/3dgame:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: ocean-adventure-service
spec:
  selector:
    app: ocean-adventure
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

### Custom Domain Setup
1. Add `CNAME` file to `public/` directory
2. Configure DNS settings
3. Enable HTTPS in GitHub Pages settings

## Getting Help

### Documentation
- [Three.js Documentation](https://threejs.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [WebGL Fundamentals](https://webglfundamentals.org/)

### Community Resources
- [Three.js Forum](https://discourse.threejs.org/)
- [WebGL Slack Community](https://webgl.slack.com/)
- [Game Development Stack Overflow](https://stackoverflow.com/questions/tagged/game-development)

### Project-Specific Help
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Open an issue on GitHub for bug reports
- Join project discussions in GitHub Discussions

## Next Steps

1. **Explore the codebase**: Start with `src/main.js`
2. **Run the game**: Use `npm run dev` and open the browser
3. **Make a small change**: Try modifying the player movement speed
4. **Run tests**: Ensure your changes don't break existing functionality
5. **Read the architecture docs**: Understand the system design

Happy coding! 🌊🏊‍♀️⭐