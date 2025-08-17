/**
 * Ocean Adventure - Main Game Entry Point
 *
 * This is a placeholder implementation showing the basic structure
 * for the 3D underwater platform game. The actual game engine
 * implementation will be developed following the Copilot plan.
 */

import * as THREE from 'three'
import { PhysicsEngine } from './core/Physics.js'
import { ParticleSystem } from './core/ParticleSystem.js'
import { Player } from './components/Player.js'

// Game configuration
const CONFIG = {
  targetFPS: 60,
  mobileFPS: 30,
  canvasId: 'gameCanvas',
  loadingId: 'loading',
  uiId: 'ui',
}

class OceanAdventure {
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.canvas = null
    this.isLoaded = false
    this.isMobile = this.detectMobile()

    // Core systems
    this.physicsEngine = null
    this.particleSystem = null
    this.player = null
    this.environmentObjects = []

    // Game state
    this.starCount = 0
    this.levelNumber = 1

    // Input state
    this.inputState = {
      keys: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
      },
      joystick: { x: 0, y: 0 },
      mobileButtons: { swimUp: false, swimDown: false },
    }

    // Timing
    this.lastTime = 0

    console.log('🌊 Ocean Adventure - Initializing...')
  }

  async initialize() {
    try {
      this.setupCanvas()
      this.setupRenderer()
      this.setupScene()
      this.setupCamera()
      this.setupLights()

      // Initialize core systems
      this.initializePhysics()
      this.initializeParticleSystem()

      // Create game objects
      this.createUnderwaterEnvironment()
      this.createPlayer()
      this.createSampleStars()

      this.setupEventListeners()

      // Hide loading screen and show UI
      this.hideLoading()
      this.showUI()

      // Start game loop
      this.startGameLoop()

      this.isLoaded = true
      console.log('🎮 Ocean Adventure - Ready to play!')
    } catch (error) {
      console.error('❌ Failed to initialize game:', error)
    }
  }

  setupCanvas() {
    this.canvas = document.getElementById(CONFIG.canvasId)
    if (!this.canvas) {
      throw new Error('Game canvas not found')
    }
  }

  setupRenderer() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: !this.isMobile, // Disable antialiasing on mobile for performance
        alpha: false,
        powerPreference: this.isMobile ? 'low-power' : 'high-performance',
        failIfMajorPerformanceCaveat: false, // Allow fallback rendering
        preserveDrawingBuffer: false, // Better performance
        premultipliedAlpha: false,
        stencil: false, // Reduce memory usage
      })

      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.setClearColor(0x001122, 1) // Deep ocean blue

      // Enable shadows for better visual quality (but not on mobile)
      if (!this.isMobile) {
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
      }

      // Validate WebGL context
      const gl = this.renderer.getContext()
      if (!gl) {
        throw new Error('Failed to get WebGL context')
      }

      // Add error handling for WebGL
      gl.getExtension('WEBGL_lose_context')

      console.log('✅ WebGL Renderer initialized successfully')
    } catch (error) {
      console.error('❌ Failed to setup renderer:', error)
      throw error
    }
  }

  setupScene() {
    this.scene = new THREE.Scene()
  }

  /**
   * Initialize physics engine
   */
  initializePhysics() {
    this.physicsEngine = new PhysicsEngine()
    console.log('⚡ Physics engine initialized')
  }

  /**
   * Initialize particle system
   */
  initializeParticleSystem() {
    this.particleSystem = new ParticleSystem(this.scene, 500) // Reduced for mobile performance
    console.log('✨ Particle system initialized')
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    )

    // Position camera behind and above the player
    this.camera.position.set(0, 5, 10)
    this.camera.lookAt(0, 0, 0)
  }

  setupLights() {
    // Ambient light for underwater ambience
    const ambientLight = new THREE.AmbientLight(0x404080, 0.4)
    this.scene.add(ambientLight)

    // Directional light simulating filtered sunlight
    const directionalLight = new THREE.DirectionalLight(0x87ceeb, 0.8)
    directionalLight.position.set(0, 50, 0)

    // Only enable shadows on desktop for better compatibility
    if (!this.isMobile && this.renderer.shadowMap.enabled) {
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 1024 // Reduced for better compatibility
      directionalLight.shadow.mapSize.height = 1024
      directionalLight.shadow.camera.near = 0.5
      directionalLight.shadow.camera.far = 500
      directionalLight.shadow.camera.left = -50
      directionalLight.shadow.camera.right = 50
      directionalLight.shadow.camera.top = 50
      directionalLight.shadow.camera.bottom = -50
    }

    this.scene.add(directionalLight)
  }

  createUnderwaterEnvironment() {
    // Create ocean floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100)
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -5
    floor.receiveShadow = true
    this.scene.add(floor)

    // Create physics body for floor
    const floorPhysicsBody = this.physicsEngine.createBoxBody(
      new THREE.Vector3(0, -5, 0),
      new THREE.Vector3(100, 0.1, 100),
      true // Static
    )
    floorPhysicsBody.type = 'environment'
    this.physicsEngine.addRigidBody(floorPhysicsBody)

    // Add coral/rocks with collision detection
    for (let i = 0; i < 10; i++) {
      const radius = 0.5 + Math.random() * 1.5
      const geometry = new THREE.SphereGeometry(radius)
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.3, 0.7, 0.5),
      })
      const coral = new THREE.Mesh(geometry, material)

      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        -4 + Math.random() * 2,
        (Math.random() - 0.5) * 80
      )
      coral.position.copy(position)
      coral.castShadow = true
      this.scene.add(coral)

      // Add physics body for collision
      const coralPhysicsBody = this.physicsEngine.createSphereBody(
        position,
        radius * 1.2, // Slightly larger for collision detection
        true // Static
      )
      coralPhysicsBody.type = 'environment'
      coralPhysicsBody.mesh = coral // Reference to visual representation
      this.physicsEngine.addRigidBody(coralPhysicsBody)
      this.environmentObjects.push({
        mesh: coral,
        physicsBody: coralPhysicsBody,
      })
    }
  }

  createPlayer() {
    // Create enhanced player with physics
    this.player = new Player(this.scene, this.physicsEngine)
    console.log('🏊 Player created with physics')
  }

  createSampleStars() {
    this.stars = []

    // Create glowing star collectibles with physics
    for (let i = 0; i < 5; i++) {
      const starGeometry = new THREE.SphereGeometry(0.3)
      const starMaterial = new THREE.MeshLambertMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
      })

      const star = new THREE.Mesh(starGeometry, starMaterial)
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 8 - 2,
        (Math.random() - 0.5) * 20
      )
      star.position.copy(position)

      // Add physics body for collision detection
      const starPhysicsBody = this.physicsEngine.createSphereBody(
        position,
        0.5, // Slightly larger for easier collection
        true // Static - stars don't move
      )
      starPhysicsBody.type = 'collectible'
      starPhysicsBody.mesh = star
      starPhysicsBody.collected = false
      this.physicsEngine.addRigidBody(starPhysicsBody)

      // Add simple rotation animation
      star.userData = {
        rotationSpeed: 0.02 + Math.random() * 0.02,
        physicsBody: starPhysicsBody,
      }

      this.stars.push({ mesh: star, physicsBody: starPhysicsBody })
      this.scene.add(star)
    }
  }

  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize())

    // Enhanced input handling
    window.addEventListener('keydown', event => this.onKeyDown(event))
    window.addEventListener('keyup', event => this.onKeyUp(event))

    // Touch controls for mobile
    if (this.isMobile) {
      this.setupTouchControls()
    }

    // Settings modal functionality
    this.setupSettingsModal()
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.inputState.keys.forward = true
        break
      case 'ArrowDown':
      case 'KeyS':
        this.inputState.keys.backward = true
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.inputState.keys.left = true
        break
      case 'ArrowRight':
      case 'KeyD':
        this.inputState.keys.right = true
        break
      case 'Space':
        this.inputState.keys.up = true
        event.preventDefault()
        break
      case 'ShiftLeft':
        this.inputState.keys.down = true
        break
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.inputState.keys.forward = false
        break
      case 'ArrowDown':
      case 'KeyS':
        this.inputState.keys.backward = false
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.inputState.keys.left = false
        break
      case 'ArrowRight':
      case 'KeyD':
        this.inputState.keys.right = false
        break
      case 'Space':
        this.inputState.keys.up = false
        break
      case 'ShiftLeft':
        this.inputState.keys.down = false
        break
    }
  }

  setupTouchControls() {
    // Setup virtual joystick
    this.setupVirtualJoystick()

    // Setup mobile action buttons
    this.setupMobileButtons()

    // Touch control state for general canvas interactions
    this.touchState = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isActive: false,
    }

    // General canvas touch events (for swipe gestures)
    this.canvas.addEventListener('touchstart', event => {
      event.preventDefault()
      if (event.touches.length > 0) {
        const touch = event.touches[0]
        this.touchState.startX = touch.clientX
        this.touchState.startY = touch.clientY
        this.touchState.currentX = touch.clientX
        this.touchState.currentY = touch.clientY
        this.touchState.isActive = true
      }
    })

    this.canvas.addEventListener('touchmove', event => {
      event.preventDefault()
      if (event.touches.length > 0 && this.touchState.isActive) {
        const touch = event.touches[0]
        this.touchState.currentX = touch.clientX
        this.touchState.currentY = touch.clientY

        // Calculate movement delta for swipe gestures
        const deltaX = this.touchState.currentX - this.touchState.startX
        const deltaY = this.touchState.currentY - this.touchState.startY

        // Apply gentle swipe-based movement (subtle effect)
        const moveSpeed = 0.05
        const sensitivity = 3

        if (Math.abs(deltaX) > 20) {
          this.player.position.x += (deltaX / sensitivity) * moveSpeed * 0.01
        }

        if (Math.abs(deltaY) > 20) {
          this.player.position.z += (deltaY / sensitivity) * moveSpeed * 0.01
        }

        this.updateCamera()
      }
    })

    this.canvas.addEventListener('touchend', event => {
      event.preventDefault()
      this.touchState.isActive = false
    })

    this.canvas.addEventListener('touchcancel', event => {
      event.preventDefault()
      this.touchState.isActive = false
    })
  }

  setupVirtualJoystick() {
    const joystick = document.getElementById('virtualJoystick')
    const knob = document.getElementById('joystickKnob')

    if (!joystick || !knob) {
      return
    }

    const joystickState = {
      isActive: false,
      centerX: 0,
      centerY: 0,
      currentX: 0,
      currentY: 0,
    }

    joystick.addEventListener('touchstart', event => {
      event.preventDefault()
      event.stopPropagation()

      if (event.touches.length > 0) {
        const touch = event.touches[0]
        const rect = joystick.getBoundingClientRect()

        joystickState.isActive = true
        joystickState.centerX = rect.left + rect.width / 2
        joystickState.centerY = rect.top + rect.height / 2
        joystickState.currentX = touch.clientX
        joystickState.currentY = touch.clientY

        // Visual feedback - highlight joystick when active
        joystick.style.borderColor = 'rgba(255, 255, 255, 0.6)'
        joystick.style.background = 'rgba(0, 17, 34, 0.7)'

        this.updateJoystickKnob(knob, joystickState, rect)
      }
    })

    joystick.addEventListener('touchmove', event => {
      event.preventDefault()
      event.stopPropagation()

      if (event.touches.length > 0 && joystickState.isActive) {
        const touch = event.touches[0]
        const rect = joystick.getBoundingClientRect()

        joystickState.currentX = touch.clientX
        joystickState.currentY = touch.clientY

        // Calculate movement vector
        const deltaX = joystickState.currentX - joystickState.centerX
        const deltaY = joystickState.currentY - joystickState.centerY
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const maxDistance = rect.width / 2 - 20

        // Normalize and apply movement
        if (distance > 5) {
          const normalizedX = deltaX / maxDistance
          const normalizedY = deltaY / maxDistance

          // Update input state with improved sensitivity for mobile
          this.inputState.joystick.x = Math.max(
            -1,
            Math.min(1, normalizedX * 1.2)
          )
          this.inputState.joystick.y = Math.max(
            -1,
            Math.min(1, normalizedY * 1.2)
          )
        } else {
          this.inputState.joystick.x = 0
          this.inputState.joystick.y = 0
        }

        this.updateJoystickKnob(knob, joystickState, rect)
      }
    })

    joystick.addEventListener('touchend', event => {
      event.preventDefault()
      event.stopPropagation()

      joystickState.isActive = false
      this.inputState.joystick.x = 0
      this.inputState.joystick.y = 0

      // Reset visual feedback
      joystick.style.borderColor = 'rgba(255, 255, 255, 0.3)'
      joystick.style.background = 'rgba(0, 17, 34, 0.5)'
      knob.style.transform = 'translate(-50%, -50%)'
    })

    joystick.addEventListener('touchcancel', event => {
      event.preventDefault()
      event.stopPropagation()

      joystickState.isActive = false
      this.inputState.joystick.x = 0
      this.inputState.joystick.y = 0

      // Reset visual feedback
      joystick.style.borderColor = 'rgba(255, 255, 255, 0.3)'
      joystick.style.background = 'rgba(0, 17, 34, 0.5)'
      knob.style.transform = 'translate(-50%, -50%)'
    })
  }

  updateJoystickKnob(knob, joystickState, rect) {
    const deltaX = joystickState.currentX - joystickState.centerX
    const deltaY = joystickState.currentY - joystickState.centerY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const maxDistance = rect.width / 2 - 20

    if (distance <= maxDistance) {
      knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`
    } else {
      const angle = Math.atan2(deltaY, deltaX)
      const x = Math.cos(angle) * maxDistance
      const y = Math.sin(angle) * maxDistance
      knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
    }
  }

  setupMobileButtons() {
    const swimUpBtn = document.getElementById('swimUpBtn')
    const swimDownBtn = document.getElementById('swimDownBtn')

    if (swimUpBtn) {
      // Add more responsive event handling
      swimUpBtn.addEventListener('touchstart', event => {
        event.preventDefault()
        event.stopPropagation()
        this.inputState.mobileButtons.swimUp = true
        swimUpBtn.style.background = 'rgba(255, 255, 255, 0.4)'
      })

      swimUpBtn.addEventListener('touchend', event => {
        event.preventDefault()
        event.stopPropagation()
        this.inputState.mobileButtons.swimUp = false
        swimUpBtn.style.background = 'rgba(0, 17, 34, 0.6)'
      })

      swimUpBtn.addEventListener('touchcancel', event => {
        event.preventDefault()
        event.stopPropagation()
        this.inputState.mobileButtons.swimUp = false
        swimUpBtn.style.background = 'rgba(0, 17, 34, 0.6)'
      })
    }

    if (swimDownBtn) {
      // Add more responsive event handling
      swimDownBtn.addEventListener('touchstart', event => {
        event.preventDefault()
        event.stopPropagation()
        this.inputState.mobileButtons.swimDown = true
        swimDownBtn.style.background = 'rgba(255, 255, 255, 0.4)'
      })

      swimDownBtn.addEventListener('touchend', event => {
        event.preventDefault()
        event.stopPropagation()
        this.inputState.mobileButtons.swimDown = false
        swimDownBtn.style.background = 'rgba(0, 17, 34, 0.6)'
      })

      swimDownBtn.addEventListener('touchcancel', event => {
        event.preventDefault()
        event.stopPropagation()
        this.inputState.mobileButtons.swimDown = false
        swimDownBtn.style.background = 'rgba(0, 17, 34, 0.6)'
      })
    }
  }

  setupSettingsModal() {
    const settingsButton = document.getElementById('settingsButton')
    const settingsModal = document.getElementById('settingsModal')
    const closeSettings = document.getElementById('closeSettings')

    if (settingsButton && settingsModal && closeSettings) {
      // Open settings
      settingsButton.addEventListener('click', () => {
        settingsModal.classList.remove('hidden')
      })

      // Close settings
      closeSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden')
      })

      // Close on background click
      settingsModal.addEventListener('click', event => {
        if (event.target === settingsModal) {
          settingsModal.classList.add('hidden')
        }
      })

      // Close on escape key
      document.addEventListener('keydown', event => {
        if (
          event.key === 'Escape' &&
          !settingsModal.classList.contains('hidden')
        ) {
          settingsModal.classList.add('hidden')
        }
      })
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  updateCamera() {
    // Enhanced camera follow logic
    const playerPosition = this.player.getPosition()
    const offset = new THREE.Vector3(0, 5, 10)
    const targetPosition = playerPosition.clone().add(offset)

    this.camera.position.lerp(targetPosition, 0.1)
    this.camera.lookAt(playerPosition)
  }

  startGameLoop() {
    const animate = currentTime => {
      requestAnimationFrame(animate)

      // Calculate delta time
      const deltaTime =
        this.lastTime > 0 ? (currentTime - this.lastTime) / 1000 : 0.016
      this.lastTime = currentTime

      this.update(deltaTime)
      this.render()
    }
    animate(0)
  }

  update(deltaTime) {
    if (!this.isLoaded) {
      return
    }

    // Clamp delta time to prevent large jumps
    deltaTime = Math.min(deltaTime, 0.033) // Max 30fps equivalent

    // Update physics engine
    this.physicsEngine.update(deltaTime)

    // Update player with input
    this.player.handleInput(this.inputState)
    this.player.update()

    // Update particle system
    this.particleSystem.update(deltaTime)

    // Update camera
    this.updateCamera()

    // Update UI (including depth meter)
    this.updateUI()

    // Animate stars
    this.stars.forEach(starData => {
      const star = starData.mesh
      star.rotation.y += star.userData.rotationSpeed
      star.rotation.x += star.userData.rotationSpeed * 0.5
    })

    // Check star collection using collision detection
    this.checkStarCollection()
  }

  checkStarCollection() {
    // Get player collisions from physics engine
    const playerCollisions = this.physicsEngine.collisionSystem.checkCollisions(
      this.player.physicsBody
    )

    for (const collision of playerCollisions) {
      if (collision.type === 'collectible' && !collision.collected) {
        // Collect star
        collision.collected = true

        // Find and remove the star from scene and physics
        const starData = this.stars.find(s => s.physicsBody === collision)
        if (starData) {
          // Remove from scene
          this.scene.remove(starData.mesh)

          // Remove from physics
          this.physicsEngine.removeRigidBody(starData.physicsBody)

          // Remove from stars array
          const index = this.stars.indexOf(starData)
          if (index !== -1) {
            this.stars.splice(index, 1)
          }

          // Update game state
          this.starCount++
          this.updateUI()

          // Create collection effect
          this.particleSystem.createBurst(starData.mesh.position, {
            count: 15,
            life: 1.5,
            velocity: new THREE.Vector3(0, 2, 0),
            velocityVariation: new THREE.Vector3(3, 3, 3),
            color: new THREE.Color(0xffd700),
            size: { min: 3, max: 8 },
          })

          console.log(`⭐ Star collected! Total: ${this.starCount}`)

          // Check if level is complete
          if (this.stars.length === 0) {
            this.levelComplete()
          }
        }
      }
    }
  }

  levelComplete() {
    console.log('🎉 Level Complete!')
    this.levelNumber++
    // Reset level with new stars
    this.createSampleStars()
    this.updateUI()
  }

  updateUI() {
    document.getElementById('starCount').textContent = this.starCount
    document.getElementById('levelNumber').textContent = this.levelNumber

    // Update depth meter based on player Y position
    if (this.player) {
      const playerPosition = this.player.getPosition()
      const depth = Math.max(0, -playerPosition.y) // Negative Y means deeper
      document.getElementById('depthMeter').textContent = depth.toFixed(1)
    }
  }

  render() {
    try {
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    } catch (error) {
      // Silently handle WebGL render errors to prevent spam
      if (this.webglErrorCount < 5) {
        console.warn('WebGL render error:', error)
        this.webglErrorCount = (this.webglErrorCount || 0) + 1
      }
    }
  }

  hideLoading() {
    const loadingElement = document.getElementById(CONFIG.loadingId)
    if (loadingElement) {
      loadingElement.classList.add('hidden')
    }
  }

  showUI() {
    const uiElement = document.getElementById(CONFIG.uiId)
    if (uiElement) {
      uiElement.classList.remove('hidden')
    }
    this.updateUI()
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', async () => {
  const game = new OceanAdventure()
  await game.initialize()
})

// Handle WebGL context loss
window.addEventListener('webglcontextlost', event => {
  event.preventDefault()
  console.warn('WebGL context lost')
})

window.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored')
  // Reinitialize game here if needed
})
