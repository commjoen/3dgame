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
import { AudioEngine } from './core/AudioEngine.js'
import { Player } from './components/Player.js'
import { Gate } from './components/Gate.js'
import { StarGeometry } from './components/StarGeometry.js'

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
    this.audioEngine = null
    this.player = null
    this.gate = null
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
    const steps = [
      { name: 'Canvas Setup', fn: () => this.setupCanvas() },
      { name: 'WebGL Renderer', fn: () => this.setupRenderer() },
      { name: '3D Scene', fn: () => this.setupScene() },
      { name: 'Camera', fn: () => this.setupCamera() },
      { name: 'Lighting', fn: () => this.setupLights() },
      { name: 'Physics Engine', fn: () => this.initializePhysics() },
      { name: 'Particle System', fn: () => this.initializeParticleSystem() },
      { name: 'Audio Engine', fn: () => this.initializeAudio() },
      { name: 'Environment', fn: () => this.createUnderwaterEnvironment() },
      { name: 'Player', fn: () => this.createPlayer() },
      { name: 'Sample Stars', fn: () => this.createSampleStars() },
      { name: 'Gate', fn: () => this.createGate() },
      { name: 'Event Listeners', fn: () => this.setupEventListeners() },
      {
        name: 'UI Initialization',
        fn: () => {
          this.hideLoading()
          this.showUI()
        },
      },
      { name: 'Game Loop', fn: () => this.startGameLoop() },
    ]

    try {
      console.log('🎮 Ocean Adventure - Starting initialization...')

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        console.log(`[${i + 1}/${steps.length}] Initializing ${step.name}...`)

        try {
          await step.fn()
          console.log(`✅ ${step.name} initialized successfully`)
        } catch (stepError) {
          console.error(`❌ Failed to initialize ${step.name}:`, stepError)
          throw new Error(
            `Initialization failed at step "${step.name}": ${stepError.message}`
          )
        }
      }

      this.isLoaded = true
      console.log('🎉 Ocean Adventure - Ready to play!')
    } catch (error) {
      console.error('❌ Failed to initialize game:', error)
      this.showError('Failed to initialize game: ' + error.message)
    }
  }

  setupCanvas() {
    console.log('🎮 Setting up canvas...')
    this.canvas = document.getElementById(CONFIG.canvasId)
    if (!this.canvas) {
      throw new Error('Game canvas not found')
    }
    console.log('✅ Canvas found and configured')
  }

  setupRenderer() {
    console.log('🎨 Setting up WebGL renderer...')
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

      // Enable shadows with mobile-optimized settings
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = this.isMobile
        ? THREE.BasicShadowMap // Faster shadow type for mobile
        : THREE.PCFSoftShadowMap // Better quality for desktop

      // Enhanced WebGL settings for modern lighting
      this.renderer.outputColorSpace = THREE.SRGBColorSpace
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping
      this.renderer.toneMappingExposure = 1.0

      // Validate WebGL context
      const gl = this.renderer.getContext()
      if (!gl) {
        throw new Error('Failed to get WebGL context')
      }

      // Add error handling for WebGL
      gl.getExtension('WEBGL_lose_context')

      console.log('✅ WebGL renderer configured successfully')
    } catch (error) {
      console.error('❌ Failed to setup WebGL renderer:', error)
      throw new Error(`WebGL initialization failed: ${error.message}`)
    }
  }

  setupScene() {
    console.log('🌊 Setting up 3D scene...')
    this.scene = new THREE.Scene()
    console.log('✅ 3D scene created successfully')
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

  /**
   * Initialize audio engine
   */
  initializeAudio() {
    this.audioEngine = new AudioEngine()
    // Note: Audio will be initialized on first user interaction due to browser policies
    console.log('🔊 Audio engine created (will initialize on user interaction)')
  }

  /**
   * Try to initialize audio on first user interaction
   */
  async tryInitializeAudio() {
    if (this.audioEngine && !this.audioEngine.isInitialized) {
      try {
        await this.audioEngine.initialize()
        this.audioEngine.startAmbientSound()
        console.log('🌊 Audio initialized and ambient sound started')
      } catch (error) {
        console.warn('Audio initialization failed:', error)
      }
    }
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
    // Enhanced underwater ambient lighting (adjusted for modern lighting model)
    const ambientLight = new THREE.AmbientLight(0x336699, 0.3) // Reduced from 0.6
    this.scene.add(ambientLight)

    // Primary directional light simulating filtered sunlight from above (adjusted intensity)
    const directionalLight = new THREE.DirectionalLight(0x87ceeb, 2.5) // Increased from 1.2
    directionalLight.position.set(0, 50, 10)

    // Enable shadows with optimized settings for mobile compatibility
    if (this.renderer.shadowMap.enabled) {
      directionalLight.castShadow = true
      // Use smaller shadow map sizes on mobile for better performance
      const shadowMapSize = this.isMobile ? 512 : 1024
      directionalLight.shadow.mapSize.width = shadowMapSize
      directionalLight.shadow.mapSize.height = shadowMapSize
      directionalLight.shadow.camera.near = 0.5
      directionalLight.shadow.camera.far = 500
      directionalLight.shadow.camera.left = -50
      directionalLight.shadow.camera.right = 50
      directionalLight.shadow.camera.top = 50
      directionalLight.shadow.camera.bottom = -50
      // Use less expensive shadow map type on mobile
      if (this.isMobile) {
        directionalLight.shadow.bias = -0.0005
      }
    }

    this.scene.add(directionalLight)

    // Add volumetric underwater lighting with point lights for better WebGL effects
    this.addUnderwaterVolumetricLights()

    // Add subtle rim lighting to enhance object definition (adjusted intensity)
    const rimLight = new THREE.DirectionalLight(0x4a9eff, 0.8) // Increased from 0.4
    rimLight.position.set(-20, 10, -20)
    this.scene.add(rimLight)
  }

  addUnderwaterVolumetricLights() {
    // Create multiple point lights for underwater caustics effect
    const lightColors = [0x4a9eff, 0x87ceeb, 0x6495ed, 0x00bfff]
    const lightCount = this.isMobile ? 3 : 5 // Fewer lights on mobile

    for (let i = 0; i < lightCount; i++) {
      const pointLight = new THREE.PointLight(
        lightColors[i % lightColors.length],
        this.isMobile ? 2.0 : 3.0, // Adjusted for modern lighting model
        30, // Distance
        2 // Decay
      )

      // Position lights in a scattered pattern above the scene
      const angle = (i / lightCount) * Math.PI * 2
      const radius = 15 + Math.random() * 10
      pointLight.position.set(
        Math.cos(angle) * radius,
        8 + Math.random() * 5, // Varying heights
        Math.sin(angle) * radius
      )

      // Store animation properties
      pointLight.userData = {
        originalPosition: pointLight.position.clone(),
        animationOffset: Math.random() * Math.PI * 2,
        animationSpeed: 0.5 + Math.random() * 0.5,
        animationRadius: 2 + Math.random() * 3,
      }

      this.scene.add(pointLight)

      // Store reference for animation
      if (!this.volumetricLights) {
        this.volumetricLights = []
      }
      this.volumetricLights.push(pointLight)
    }
  }

  createUnderwaterEnvironment() {
    // Create water surface at Y=5 (matches depth meter calculation)
    const waterSurfaceGeometry = new THREE.PlaneGeometry(200, 200)
    const waterSurfaceMaterial = new THREE.MeshPhongMaterial({
      color: 0x006994,
      transparent: true,
      opacity: 0.6,
      shininess: 100,
      specular: 0x87ceeb,
      side: THREE.DoubleSide,
    })
    const waterSurface = new THREE.Mesh(
      waterSurfaceGeometry,
      waterSurfaceMaterial
    )
    waterSurface.rotation.x = -Math.PI / 2
    waterSurface.position.y = 5 // Water surface level used by depth meter
    waterSurface.receiveShadow = true
    this.scene.add(waterSurface)

    // Create ocean floor with enhanced material
    const floorGeometry = new THREE.PlaneGeometry(100, 100)
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b4513,
      shininess: 30,
      specular: 0x222222,
    })
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

    // Add coral/rocks with enhanced materials and lighting
    for (let i = 0; i < 10; i++) {
      const radius = 0.5 + Math.random() * 1.5
      const geometry = new THREE.SphereGeometry(radius)

      // Use MeshPhongMaterial for better lighting on all platforms
      const hue = Math.random() * 0.3
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 0.7, 0.5),
        shininess: 60 + Math.random() * 40,
        specular: new THREE.Color().setHSL(hue, 0.3, 0.8),
        // Add slight transparency for underwater effect
        transparent: true,
        opacity: 0.9,
      })

      const coral = new THREE.Mesh(geometry, material)

      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        -4 + Math.random() * 2,
        (Math.random() - 0.5) * 80
      )
      coral.position.copy(position)
      coral.castShadow = true
      coral.receiveShadow = true
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

  /**
   * Create the level completion gate
   */
  createGate() {
    // Position gate at the back of the level
    const gatePosition = new THREE.Vector3(0, 2, -20)
    this.gate = new Gate(this.scene, this.physicsEngine, gatePosition)
    console.log('🚪 Gate created')
  }

  createSampleStars() {
    this.stars = []

    // Create star geometry variants for visual variety
    const starVariants = StarGeometry.createVariants()

    // Create actual star-shaped collectibles with enhanced materials
    for (let i = 0; i < 5; i++) {
      // Use a random star variant for variety
      const variant = starVariants[i % starVariants.length]
      const starGeometry = variant.geometry.clone()
      const starMaterial = variant.material.clone()

      const star = new THREE.Mesh(starGeometry, starMaterial)
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 8 - 2,
        (Math.random() - 0.5) * 20
      )
      star.position.copy(position)
      star.castShadow = true

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

      // Add enhanced rotation animation and floating effect
      star.userData = {
        rotationSpeed: 0.02 + Math.random() * 0.02,
        floatSpeed: 0.01 + Math.random() * 0.01,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: position.y,
        physicsBody: starPhysicsBody,
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
      }

      this.stars.push({ mesh: star, physicsBody: starPhysicsBody })
      this.scene.add(star)
    }
  }

  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), {
      passive: true,
    })

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
    // Initialize audio on first user interaction
    this.tryInitializeAudio()

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

      // Initialize audio on first touch
      this.tryInitializeAudio()

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
      const openSettings = event => {
        if (event) {
          event.preventDefault()
          event.stopPropagation()
        }
        settingsModal.classList.remove('hidden')
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden'
        
        // Update sliders with current audio values
        this.updateAudioSliders()
      }

      // Close settings
      const closeModal = event => {
        if (event) {
          event.preventDefault()
          event.stopPropagation()
        }
        settingsModal.classList.add('hidden')
        // Restore body scrolling
        document.body.style.overflow = ''
      }

      // Simple event handling - click events work on both desktop and mobile
      settingsButton.addEventListener('click', openSettings)
      closeSettings.addEventListener('click', closeModal)

      // Close on background click - simplified and more reliable detection
      settingsModal.addEventListener('click', event => {
        // Check if the click target is the modal background itself (not a child element)
        if (event.target === settingsModal) {
          closeModal(event)
        }
      })

      // Close on escape key
      document.addEventListener('keydown', event => {
        if (
          event.key === 'Escape' &&
          !settingsModal.classList.contains('hidden')
        ) {
          closeModal()
        }
      })
    }

    // Setup audio controls
    this.setupAudioControls()
  }

  setupAudioControls() {
    const masterVolumeSlider = document.getElementById('masterVolumeSlider')
    const musicVolumeSlider = document.getElementById('musicVolumeSlider')
    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider')
    
    const masterVolumeValue = document.getElementById('masterVolumeValue')
    const musicVolumeValue = document.getElementById('musicVolumeValue')
    const sfxVolumeValue = document.getElementById('sfxVolumeValue')

    if (masterVolumeSlider && this.audioEngine) {
      masterVolumeSlider.addEventListener('input', event => {
        const volume = parseInt(event.target.value) / 100
        this.audioEngine.setMasterVolume(volume)
        if (masterVolumeValue) {
          masterVolumeValue.textContent = `${event.target.value}%`
        }
      })
    }

    if (musicVolumeSlider && this.audioEngine) {
      musicVolumeSlider.addEventListener('input', event => {
        const volume = parseInt(event.target.value) / 100
        this.audioEngine.setMusicVolume(volume)
        if (musicVolumeValue) {
          musicVolumeValue.textContent = `${event.target.value}%`
        }
      })
    }

    if (sfxVolumeSlider && this.audioEngine) {
      sfxVolumeSlider.addEventListener('input', event => {
        const volume = parseInt(event.target.value) / 100
        this.audioEngine.setSfxVolume(volume)
        if (sfxVolumeValue) {
          sfxVolumeValue.textContent = `${event.target.value}%`
        }
      })
    }
  }

  updateAudioSliders() {
    if (!this.audioEngine) return

    const state = this.audioEngine.getState()
    
    const masterVolumeSlider = document.getElementById('masterVolumeSlider')
    const musicVolumeSlider = document.getElementById('musicVolumeSlider')
    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider')
    
    const masterVolumeValue = document.getElementById('masterVolumeValue')
    const musicVolumeValue = document.getElementById('musicVolumeValue')
    const sfxVolumeValue = document.getElementById('sfxVolumeValue')

    if (masterVolumeSlider) {
      const value = Math.round(state.masterVolume * 100)
      masterVolumeSlider.value = value
      if (masterVolumeValue) masterVolumeValue.textContent = `${value}%`
    }

    if (musicVolumeSlider) {
      const value = Math.round(state.musicVolume * 100)
      musicVolumeSlider.value = value
      if (musicVolumeValue) musicVolumeValue.textContent = `${value}%`
    }

    if (sfxVolumeSlider) {
      const value = Math.round(state.sfxVolume * 100)
      sfxVolumeSlider.value = value
      if (sfxVolumeValue) sfxVolumeValue.textContent = `${value}%`
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

    // Update player with input and check for movement sounds
    const previousPosition = this.player.getPosition().clone()
    this.player.handleInput(this.inputState)
    this.player.update()

    // Play swimming sounds when player is moving
    if (this.audioEngine && this.audioEngine.isInitialized) {
      const currentPosition = this.player.getPosition()
      const movementDistance = previousPosition.distanceTo(currentPosition)

      // Play swimming sound if moving fast enough
      if (movementDistance > 0.01) {
        // Only play swimming sound occasionally to avoid spam
        if (Math.random() < 0.05) {
          // 5% chance per frame when moving
          this.audioEngine.playSound('swimming', currentPosition)
        }
      }
    }

    // Update particle system
    this.particleSystem.update(deltaTime)

    // Update gate animations
    if (this.gate) {
      this.gate.update(deltaTime)
    }

    // Update audio system
    if (this.audioEngine && this.audioEngine.isInitialized) {
      const playerPos = this.player.getPosition()
      const forward = this.camera.getWorldDirection(new THREE.Vector3())
      const up = this.camera.up
      this.audioEngine.updateListenerPosition(playerPos, forward, up)
    }

    // Update camera
    this.updateCamera()

    // Update UI (including depth meter)
    this.updateUI()

    // Animate stars with enhanced floating and rotation effects
    this.stars.forEach(starData => {
      const star = starData.mesh
      const userData = star.userData

      // Enhanced rotation animation using the custom rotation axis
      if (userData.rotationAxis) {
        star.rotateOnAxis(userData.rotationAxis, userData.rotationSpeed)
      } else {
        // Fallback rotation
        star.rotation.y += userData.rotationSpeed
        star.rotation.x += userData.rotationSpeed * 0.5
      }

      // Floating animation
      const time = Date.now() * 0.001
      const floatY =
        userData.originalY +
        Math.sin(time * userData.floatSpeed + userData.floatOffset) * 0.3
      star.position.y = floatY

      // Pulsing emissive effect with more dynamic variation
      const pulseFactor = 0.3 + Math.sin(time * 2 + userData.floatOffset) * 0.1
      star.material.emissiveIntensity = pulseFactor
    })

    // Animate volumetric lights for underwater caustics effect
    if (this.volumetricLights) {
      const time = Date.now() * 0.001
      this.volumetricLights.forEach(light => {
        const userData = light.userData
        const animationTime =
          time * userData.animationSpeed + userData.animationOffset

        // Create gentle swaying motion
        const offsetX = Math.sin(animationTime) * userData.animationRadius
        const offsetZ = Math.cos(animationTime * 1.3) * userData.animationRadius
        const offsetY = Math.sin(animationTime * 0.7) * 1

        light.position.x = userData.originalPosition.x + offsetX
        light.position.y = userData.originalPosition.y + offsetY
        light.position.z = userData.originalPosition.z + offsetZ

        // Subtle intensity variation for flickering water caustics
        const intensityVariation = 0.8 + Math.sin(animationTime * 3) * 0.2
        light.intensity = (this.isMobile ? 0.6 : 0.8) * intensityVariation
      })
    }

    // Check star collection using collision detection
    this.checkStarCollection()

    // Check gate collision
    this.checkGateCollision()
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

          // Play collection sound
          if (this.audioEngine) {
            this.audioEngine.playSound('starCollect', starData.mesh.position)
          }

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

          // Check if all stars collected - activate gate
          if (this.stars.length === 0) {
            this.activateGate()
          }
        }
      }
    }
  }

  /**
   * Activate the gate when all stars are collected
   */
  activateGate() {
    if (this.gate && !this.gate.getIsActivated()) {
      this.gate.activate()

      // Play gate activation sound
      if (this.audioEngine) {
        this.audioEngine.playSound('gateActivate', this.gate.getPosition())
      }

      console.log('🚪 Gate activated! Swim through to complete level!')
    }
  }

  /**
   * Check for gate collision and level completion
   */
  checkGateCollision() {
    if (!this.gate || !this.gate.getIsActivated()) {
      return
    }

    // Get player collisions from physics engine
    const playerCollisions = this.physicsEngine.collisionSystem.checkCollisions(
      this.player.physicsBody
    )

    for (const collision of playerCollisions) {
      if (collision.type === 'gate' && collision.gate) {
        const levelCompleted = collision.gate.onPlayerEnter()
        if (levelCompleted) {
          this.levelComplete()
          break
        }
      }
    }
  }

  levelComplete() {
    console.log('🎉 Level Complete!')

    // Play level completion sound
    if (this.audioEngine) {
      this.audioEngine.playSound('levelComplete')
    }

    this.levelNumber++

    // Reset gate for next level
    if (this.gate) {
      this.gate.reset()
    }

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
      // Water surface is at Y=5, so depth = surface level - current Y position
      const waterSurface = 5.0
      const depth = Math.max(0, waterSurface - playerPosition.y)
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

  showError(message) {
    const loadingElement = document.getElementById(CONFIG.loadingId)
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="color: #ff4444; text-align: center;">
          <h3>⚠️ Error Loading Game</h3>
          <p>${message}</p>
          <p style="margin-top: 20px; font-size: 14px; color: #ccc;">
            Please check the browser console for more details and try refreshing the page.
          </p>
        </div>
      `
      loadingElement.classList.remove('hidden')
    }
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }
}

// Initialize the game when the page loads
window.addEventListener(
  'DOMContentLoaded',
  async () => {
    try {
      console.log('🌊 Ocean Adventure - Starting initialization...')
      const game = new OceanAdventure()
      await game.initialize()
    } catch (error) {
      console.error('❌ Critical error during game initialization:', error)
      // Show error in loading div if game initialization fails
      const loadingElement = document.getElementById('loading')
      if (loadingElement) {
        loadingElement.innerHTML = `
          <div style="color: #ff4444; text-align: center;">
            <h3>⚠️ Critical Error</h3>
            <p>Failed to initialize Ocean Adventure: ${error.message}</p>
            <p style="margin-top: 20px; font-size: 14px; color: #ccc;">
              Please check the browser console for more details and try refreshing the page.
            </p>
          </div>
        `
      }
    }
  },
  { passive: true }
)

// Handle WebGL context loss
window.addEventListener(
  'webglcontextlost',
  event => {
    event.preventDefault()
    console.warn('WebGL context lost')
  },
  { passive: false }
)

window.addEventListener(
  'webglcontextrestored',
  () => {
    console.log('WebGL context restored')
    // Reinitialize game here if needed
  },
  { passive: true }
)

// Performance optimization: Pause game when page is hidden
document.addEventListener(
  'visibilitychange',
  () => {
    if (document.hidden) {
      // Page is hidden, reduce performance
      console.log('Game paused due to page visibility')
    } else {
      // Page is visible, resume normal performance
      console.log('Game resumed')
    }
  },
  { passive: true }
)
