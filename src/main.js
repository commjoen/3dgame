/**
 * Ocean Adventure - Main Game Entry Point
 *
 * This is a placeholder implementation showing the basic structure
 * for the 3D underwater platform game. The actual game engine
 * implementation will be developed following the Copilot plan.
 */

import * as THREE from 'three'
import striptags from 'striptags'
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
    this.teslaMode = false // Tesla mode: show mobile controls on large screens

    // Core systems
    this.physicsEngine = null
    this.particleSystem = null
    this.audioEngine = null
    this.player = null
    this.gate = null
    this.environmentObjects = []
    this.seaCreatures = []

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
        // Camera controls for desktop users
        cameraUp: false,
        cameraDown: false,
        cameraLeft: false,
        cameraRight: false,
      },
      joystick: { x: 0, y: 0 },
      cameraJoystick: { x: 0, y: 0 }, // New camera joystick input
      mobileButtons: { swimUp: false, swimDown: false },
    }

    // Camera rotation state for independent camera control
    this.cameraRotation = {
      horizontal: 0, // Horizontal rotation (yaw)
      vertical: 0, // Vertical rotation (pitch)
      sensitivity: 0.005, // Will be updated based on device/mode
    }

    // Set initial camera sensitivity
    this.updateCameraSensitivity()

    // Camera smoothing state for adaptive movement
    this.previousMovementDirection = null

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
      { name: 'Sea Creatures', fn: () => this.createSeaCreatures() },
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
      this.renderer.setClearColor(0x001830, 1) // Darker, more contrasting ocean blue

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
      2000 // Far clipping plane to see sky elements
    )

    // Position camera to view deep underwater level while still seeing water surface
    this.camera.position.set(0, 5, 15) // Adjusted for deeper level - closer to water surface
    this.camera.lookAt(0, -5, 0) // Look down towards the deeper player area
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

    // Create background skybox with gradient and clouds
    this.createSkybox()
  }

  /**
   * Create a simple skybox with gradient and cloud effects
   */
  createSkybox() {
    const skyGeometry = new THREE.SphereGeometry(1500, 32, 32) // Much larger sphere

    // Use high contrast visible material
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87ceeb, // Light sky blue
      side: THREE.BackSide,
      transparent: false,
      fog: false,
    })

    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial)
    skyMesh.position.set(0, 0, 0) // Ensure centered
    this.scene.add(skyMesh)

    // Add some simple cloud sprites
    this.createClouds()

    console.log('☁️ Skybox created')
  }

  /**
   * Create simple cloud sprites
   */
  createClouds() {
    this.clouds = []

    // Create multiple cloud clusters for realistic appearance
    for (let i = 0; i < 12; i++) {
      // Create cloud cluster with multiple spheres
      const cloudGroup = new THREE.Group()

      // Create 3-5 spheres per cloud for fluffy appearance
      const sphereCount = 3 + Math.floor(Math.random() * 3)
      for (let j = 0; j < sphereCount; j++) {
        const sphereSize = 8 + Math.random() * 12
        const cloudGeometry = new THREE.SphereGeometry(sphereSize, 16, 16)
        const cloudMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8 + Math.random() * 0.2, // Vary opacity for depth
          fog: false, // Ensure clouds are not affected by underwater fog
        })

        const cloudSphere = new THREE.Mesh(cloudGeometry, cloudMaterial)

        // Position spheres within the cloud cluster
        cloudSphere.position.set(
          (Math.random() - 0.5) * 25,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 25
        )

        cloudGroup.add(cloudSphere)
      }

      // Position cloud clusters far away in the sky for realistic appearance
      const angle = (i / 12) * Math.PI * 2
      const radius = 300 + Math.random() * 200 // Distant horizon: 300-500 units
      cloudGroup.position.set(
        Math.cos(angle) * radius,
        60 + Math.random() * 40, // Lowered clouds: Y=60-100 units above water surface for better visibility
        Math.sin(angle) * radius
      )

      // Scale appropriately for distant sky appearance
      const scale = 3.0 + Math.random() * 2.0 // Larger scale for distant clouds
      cloudGroup.scale.setScalar(scale)

      // Store animation data
      cloudGroup.userData = {
        originalPosition: cloudGroup.position.clone(),
        speed: 0.01 + Math.random() * 0.01,
        offset: Math.random() * Math.PI * 2,
      }

      this.clouds.push(cloudGroup)
      this.scene.add(cloudGroup)
    }

    console.log(`☁️ Created ${this.clouds.length} distant sky cloud clusters`)
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

  /**
   * Create sun or moon based on level number
   */
  createCelestialBody() {
    const isEvenLevel = this.levelNumber % 2 === 0

    if (isEvenLevel) {
      // Create sun
      const sunGeometry = new THREE.SphereGeometry(8, 32, 32) // Larger and more visible
      const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: false,
      })
      this.celestialBody = new THREE.Mesh(sunGeometry, sunMaterial)

      // Position sun closer for better visibility
      this.celestialBody.position.set(50, 40, -40)

      // Add sun light
      this.celestialLight = new THREE.DirectionalLight(0xffffff, 1.5)
      this.celestialLight.position.copy(this.celestialBody.position)
      this.celestialLight.target.position.set(0, 5, 0) // Point at water surface

      console.log('☀️ Sun created for even level', this.levelNumber)
    } else {
      // Create moon
      const moonGeometry = new THREE.SphereGeometry(6, 32, 32) // Larger and more visible
      const moonMaterial = new THREE.MeshBasicMaterial({
        color: 0xccccdd,
        transparent: false,
      })
      this.celestialBody = new THREE.Mesh(moonGeometry, moonMaterial)

      // Position moon closer for better visibility
      this.celestialBody.position.set(-45, 35, -35)

      // Add moon light (dimmer)
      this.celestialLight = new THREE.DirectionalLight(0x9999bb, 0.8)
      this.celestialLight.position.copy(this.celestialBody.position)
      this.celestialLight.target.position.set(0, 5, 0) // Point at water surface

      console.log('🌙 Moon created for odd level', this.levelNumber)
    }

    // Store initial position for animation
    this.celestialBody.userData = {
      originalPosition: this.celestialBody.position.clone(),
      isEvenLevel: isEvenLevel,
      animationRadius: 15, // Reduced for closer visibility
      animationSpeed: 0.2,
    }

    this.scene.add(this.celestialBody)
    this.scene.add(this.celestialLight)
    this.scene.add(this.celestialLight.target)
  }

  /**
   * Initialize underwater atmosphere effects (fog, blue tinting)
   */
  initializeUnderwaterAtmosphere() {
    // Initialize fog settings for underwater effect
    this.underwaterFog = {
      enabled: false,
      color: new THREE.Color(0x006699), // Deep blue underwater color
      near: 15, // Increased from 5 to reduce fog thickness
      far: 40,
    }

    // Store original scene background for surface mode
    this.originalSceneBackground = this.scene.background
    this.originalClearColor = this.renderer.getClearColor(new THREE.Color())

    // Track whether player is underwater
    this.isUnderwater = false

    console.log('🌊 Underwater atmosphere system initialized')
  }

  /**
   * Update underwater atmosphere effects based on player position
   */
  updateUnderwaterAtmosphere() {
    // Use player position instead of camera position for underwater detection
    // This prevents issues with camera lerping lag when player reaches surface
    const playerPosition = this.player ? this.player.getPosition() : { y: -10 }
    const waterSurfaceLevel = 5.0
    const wasUnderwater = this.isUnderwater
    this.isUnderwater = playerPosition.y < waterSurfaceLevel

    // If underwater state changed, update atmosphere
    if (this.isUnderwater !== wasUnderwater) {
      if (this.isUnderwater) {
        // Entering underwater - apply blue fog and tinting
        this.scene.fog = new THREE.Fog(
          this.underwaterFog.color,
          this.underwaterFog.near,
          this.underwaterFog.far
        )

        // Change renderer clear color to underwater blue
        this.renderer.setClearColor(0x004466, 1)

        // Add blue tint to skybox when underwater
        if (this.scene.children) {
          this.scene.children.forEach(child => {
            if (
              child.material &&
              child.material.color &&
              child.geometry &&
              child.geometry.type === 'SphereGeometry'
            ) {
              // This is likely the skybox
              child.material.color.setHex(0x004466)
            }
          })
        }

        console.log('🌊 Entered underwater - fog and blue tinting applied')
      } else {
        // Exiting underwater - remove fog effects
        this.scene.fog = null

        // Set proper sky clear color instead of the original dark color
        this.renderer.setClearColor(0x87ceeb, 1) // Light sky blue

        // Restore skybox color
        if (this.scene.children) {
          this.scene.children.forEach(child => {
            if (
              child.material &&
              child.material.color &&
              child.geometry &&
              child.geometry.type === 'SphereGeometry'
            ) {
              // This is likely the skybox
              child.material.color.setHex(0x87ceeb) // Light sky blue
            }
          })
        }

        // Ensure clouds are visible by resetting their material properties
        if (this.clouds) {
          this.clouds.forEach(cloudGroup => {
            cloudGroup.visible = true
            // Restore visibility for all spheres in each cloud group
            cloudGroup.children.forEach(sphere => {
              if (sphere.material) {
                sphere.material.opacity = Math.max(0.8, sphere.material.opacity)
                sphere.material.visible = true
              }
              sphere.visible = true
            })
          })
        }

        console.log('🌊 Exited underwater - fog removed, sky elements restored')
      }
    }

    // Gradual fog density adjustment based on depth underwater
    if (this.isUnderwater && this.scene.fog) {
      const depth = Math.max(0, waterSurfaceLevel - playerPosition.y)
      const maxDepth = 15 // Maximum depth for fog calculations
      const fogIntensity = Math.min(1, depth / maxDepth)

      // Adjust fog far distance based on depth - reduced intensity for less thick fog
      this.scene.fog.far = this.underwaterFog.far * (1 - fogIntensity * 0.3)

      // Make fog more intense at deeper levels - reduced intensity for better visibility
      const deepBlue = new THREE.Color(0x003355)
      this.scene.fog.color.lerpColors(
        this.underwaterFog.color,
        deepBlue,
        fogIntensity * 0.25
      )
    }
  }

  createUnderwaterEnvironment() {
    // Note: Static water surface removed to eliminate z-fighting with animated waves
    // const waterSurface = new THREE.Mesh(
    //   waterSurfaceGeometry,
    //   waterSurfaceMaterial
    // )
    // waterSurface.name = 'waterSurface' // Add name for debugging
    // waterSurface.rotation.x = -Math.PI / 2 // Horizontal surface
    // waterSurface.position.y = 5 // Water surface level used by depth meter
    // waterSurface.receiveShadow = true
    // waterSurface.castShadow = false
    // this.scene.add(waterSurface)

    // console.log('🌊 Water surface created at position:', waterSurface.position)

    // Create visible wave surface with enhanced visibility parameters
    const waveSurfaceGeometry = new THREE.PlaneGeometry(300, 300, 96, 96) // Larger area and higher resolution for better visibility
    const waveSurfaceMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aaff, // Brighter blue for enhanced visibility from depth
      transparent: true, // Enable transparency for better underwater viewing
      opacity: 0.9, // Slightly transparent to see through when very close
      side: THREE.DoubleSide,
      shininess: 150, // Increased shininess for more reflection
      specular: 0xffffff, // White specular highlights for realistic water
      fog: false, // Ensure wave surface is not affected by fog
      wireframe: false, // Solid surface for final implementation
      emissive: 0x0088dd, // Stronger blue emissive glow for underwater visibility
      emissiveIntensity: 0.3, // Add emissive intensity for better glow
    })

    const waveSurface = new THREE.Mesh(waveSurfaceGeometry, waveSurfaceMaterial)
    waveSurface.name = 'waveSurface' // Add name for debugging
    waveSurface.rotation.x = -Math.PI / 2
    waveSurface.position.y = 5.0 // Position at same level as water surface for proper wave effect
    this.scene.add(waveSurface)

    console.log('🌊 Wave surface created at position:', waveSurface.position)

    // Store references for wave animation
    this.waveSurface = waveSurface
    // this.waterSurface = waterSurface // Temporarily disabled

    // Enhanced wave parameters for better visibility at all depths
    this.waveParams = {
      amplitude: 8.0, // Increased amplitude for even more prominent waves
      frequency: 0.15, // Lower frequency for larger, more visible waves
      speed: 3.0, // Faster wave movement for more dynamic surface
    }

    // Store original positions for wave surface animation
    const wavePositions = waveSurface.geometry.attributes.position.array
    this.waveOriginalPositions = new Float32Array(wavePositions.length)
    for (let i = 0; i < wavePositions.length; i++) {
      this.waveOriginalPositions[i] = wavePositions[i]
    }

    // Store original vertex positions for wave surface animation (no longer used for water surface)
    // const positions = waterSurface.geometry.attributes.position.array
    // this.waterOriginalPositions = new Float32Array(positions.length)
    // for (let i = 0; i < positions.length; i++) {
    //   this.waterOriginalPositions[i] = positions[i]
    // }

    // Add foam/whitecap effect for wave crests
    const foamGeometry = new THREE.PlaneGeometry(400, 400, 64, 64)
    const foamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, // White foam
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
      depthWrite: false, // Don't write to depth buffer for proper blending
    })

    const foamSurface = new THREE.Mesh(foamGeometry, foamMaterial)
    foamSurface.rotation.x = -Math.PI / 2
    foamSurface.position.y = 5.2 // Slightly above water surface
    this.scene.add(foamSurface)

    // Store references for animation
    this.foamSurface = foamSurface
    this.foamOriginalPositions = new Float32Array(
      foamGeometry.attributes.position.array
    )

    // Initialize underwater atmosphere system
    this.initializeUnderwaterAtmosphere()

    // Create sun or moon based on level number (even = sun, odd = moon)
    this.createCelestialBody()

    // Create ocean floor with sandy/rocky appearance - positioned deeper for level layout
    const floorGeometry = new THREE.PlaneGeometry(100, 100, 32, 32) // Higher resolution for detail

    // Create a more realistic ocean floor material
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b7355, // Sandy brown color
      shininess: 10, // Low shininess for sand
      specular: 0x444444, // Subtle specular highlights
      transparent: false,
    })

    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -15 // Moved 10 units deeper from -5 to -15
    floor.receiveShadow = true

    // Add subtle height variation to make the floor more natural
    const floorPositions = floor.geometry.attributes.position.array
    for (let i = 2; i < floorPositions.length; i += 3) {
      // Add random height variation to Y coordinates (every 3rd element)
      floorPositions[i] += (Math.random() - 0.5) * 0.3 // Small height variations
    }
    floor.geometry.attributes.position.needsUpdate = true
    floor.geometry.computeVertexNormals() // Recalculate normals for proper lighting

    this.scene.add(floor)

    // Add some sand patches/texture variation
    for (let i = 0; i < 8; i++) {
      const patchGeometry = new THREE.CircleGeometry(2 + Math.random() * 3, 16)
      const patchMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(0.1, 0.3, 0.3 + Math.random() * 0.2), // Varied sandy colors
        shininess: 5,
        transparent: true,
        opacity: 0.7,
      })

      const patch = new THREE.Mesh(patchGeometry, patchMaterial)
      patch.rotation.x = -Math.PI / 2
      patch.position.set(
        (Math.random() - 0.5) * 80,
        -14.9, // Slightly above floor to avoid z-fighting
        (Math.random() - 0.5) * 80
      )
      patch.receiveShadow = true
      this.scene.add(patch)
    }

    // Create physics body for floor
    const floorPhysicsBody = this.physicsEngine.createBoxBody(
      new THREE.Vector3(0, -15, 0), // Updated to match new floor position
      new THREE.Vector3(100, 0.1, 100),
      true // Static
    )
    floorPhysicsBody.type = 'environment'
    this.physicsEngine.addRigidBody(floorPhysicsBody)

    // Add invisible boundary walls to prevent falling off the platform
    this.createLevelBoundaries()

    // Add varied ocean plants and coral with more realistic shapes and colors
    const oceanObjectTypes = ['coral', 'seaweed', 'rock', 'anemone', 'kelp']

    for (let i = 0; i < 15; i++) {
      // Increased from 10 to 15 for more variety
      const objectType =
        oceanObjectTypes[Math.floor(Math.random() * oceanObjectTypes.length)]
      let geometry, material, mesh

      switch (objectType) {
        case 'coral': {
          // Branch-like coral structure
          geometry = new THREE.CylinderGeometry(
            0.1,
            0.4,
            1 + Math.random() * 2,
            6
          )
          material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(
              0.05 + Math.random() * 0.15,
              0.8,
              0.4
            ), // Orange/red coral colors
            shininess: 40,
            transparent: true,
            opacity: 0.9,
          })
          mesh = new THREE.Mesh(geometry, material)

          // Add small coral branches
          for (let j = 0; j < 3; j++) {
            const branchGeometry = new THREE.SphereGeometry(
              0.2 + Math.random() * 0.3,
              8,
              6
            )
            const branchMaterial = new THREE.MeshPhongMaterial({
              color: material.color
                .clone()
                .multiplyScalar(0.8 + Math.random() * 0.4),
              shininess: 60,
            })
            const branch = new THREE.Mesh(branchGeometry, branchMaterial)
            branch.position.set(
              (Math.random() - 0.5) * 0.8,
              Math.random() * 1.5,
              (Math.random() - 0.5) * 0.8
            )
            mesh.add(branch)
          }
          break
        }

        case 'seaweed': {
          // Tall, swaying seaweed
          geometry = new THREE.CylinderGeometry(
            0.05,
            0.08,
            2 + Math.random() * 3,
            8
          )
          material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(
              0.3,
              0.7,
              0.2 + Math.random() * 0.3
            ), // Green seaweed
            shininess: 20,
          })
          mesh = new THREE.Mesh(geometry, material)
          mesh.scale.x = 0.3 // Make it flatter like seaweed
          break
        }

        case 'kelp': {
          // Large kelp fronds
          geometry = new THREE.ConeGeometry(0.5, 3 + Math.random() * 2, 8)
          material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(0.25, 0.6, 0.3), // Dark green kelp
            shininess: 15,
          })
          mesh = new THREE.Mesh(geometry, material)
          break
        }

        case 'anemone': {
          // Sea anemone with tentacles
          geometry = new THREE.SphereGeometry(0.4 + Math.random() * 0.6, 12, 8)
          material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(
              0.8 + Math.random() * 0.2,
              0.7,
              0.6
            ), // Purple/pink anemone
            shininess: 80,
            transparent: true,
            opacity: 0.85,
          })
          mesh = new THREE.Mesh(geometry, material)

          // Add tentacle-like protrusions
          for (let j = 0; j < 8; j++) {
            const tentacleGeometry = new THREE.CylinderGeometry(
              0.02,
              0.05,
              0.5,
              4
            )
            const tentacle = new THREE.Mesh(tentacleGeometry, material.clone())
            const angle = (j / 8) * Math.PI * 2
            tentacle.position.set(
              Math.cos(angle) * 0.4,
              0.3,
              Math.sin(angle) * 0.4
            )
            tentacle.rotation.x = (Math.random() - 0.5) * 0.5
            tentacle.rotation.z = (Math.random() - 0.5) * 0.5
            mesh.add(tentacle)
          }
          break
        }

        default: {
          // rock
          const rockRadius = 0.3 + Math.random() * 1.2
          geometry = new THREE.DodecahedronGeometry(rockRadius, 1) // More irregular rock shape
          material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(
              0.1,
              0.2,
              0.3 + Math.random() * 0.3
            ), // Gray/brown rocks
            shininess: 10,
          })
          mesh = new THREE.Mesh(geometry, material)

          // Make rocks slightly irregular
          const rockPositions = geometry.attributes.position.array
          for (let j = 0; j < rockPositions.length; j += 3) {
            rockPositions[j] += (Math.random() - 0.5) * 0.1
            rockPositions[j + 1] += (Math.random() - 0.5) * 0.1
            rockPositions[j + 2] += (Math.random() - 0.5) * 0.1
          }
          geometry.attributes.position.needsUpdate = true
          geometry.computeVertexNormals()
          break
        }
      }

      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        -14 + Math.random() * 2, // Moved 10 units deeper: was -4 to -2, now -14 to -12
        (Math.random() - 0.5) * 80
      )
      mesh.position.copy(position)
      mesh.castShadow = true
      mesh.receiveShadow = true

      // Add gentle swaying animation for seaweed and kelp
      if (objectType === 'seaweed' || objectType === 'kelp') {
        mesh.userData.swaySpeed = 0.5 + Math.random() * 1.5
        mesh.userData.swayAmount = 0.1 + Math.random() * 0.2
      }

      this.scene.add(mesh)

      // Add physics body for collision (use sphere for simplicity)
      const radius =
        objectType === 'kelp' ? 1.0 : objectType === 'seaweed' ? 0.3 : 0.8
      const objectPhysicsBody = this.physicsEngine.createSphereBody(
        position,
        radius, // Collision radius based on object type
        true // Static
      )
      objectPhysicsBody.type = 'environment'
      objectPhysicsBody.mesh = mesh // Reference to visual representation
      this.physicsEngine.addRigidBody(objectPhysicsBody)
      this.environmentObjects.push({
        mesh: mesh,
        physicsBody: objectPhysicsBody,
      })
    }
  }

  /**
   * Create invisible boundary walls around the level
   */
  createLevelBoundaries() {
    console.log('🧱 Creating level boundaries...')

    // Level size should match the floor size (100x100)
    const levelSize = 50 // Half the floor size (radius from center)
    const wallHeight = 15 // Height of boundary walls
    const wallThickness = 2 // Thickness of walls

    // Create four walls around the level perimeter - positioned for deeper level
    const wallConfigs = [
      // North wall (positive Z)
      {
        position: new THREE.Vector3(0, wallHeight / 2 - 10, levelSize), // Moved 10 units deeper
        size: new THREE.Vector3(levelSize * 2, wallHeight, wallThickness),
        name: 'North Wall',
      },
      // South wall (negative Z)
      {
        position: new THREE.Vector3(0, wallHeight / 2 - 10, -levelSize), // Moved 10 units deeper
        size: new THREE.Vector3(levelSize * 2, wallHeight, wallThickness),
        name: 'South Wall',
      },
      // East wall (positive X)
      {
        position: new THREE.Vector3(levelSize, wallHeight / 2 - 10, 0), // Moved 10 units deeper
        size: new THREE.Vector3(wallThickness, wallHeight, levelSize * 2),
        name: 'East Wall',
      },
      // West wall (negative X)
      {
        position: new THREE.Vector3(-levelSize, wallHeight / 2 - 10, 0), // Moved 10 units deeper
        size: new THREE.Vector3(wallThickness, wallHeight, levelSize * 2),
        name: 'West Wall',
      },
    ]

    wallConfigs.forEach(config => {
      // Create invisible physics wall (no visual mesh needed)
      const wallPhysicsBody = this.physicsEngine.createBoxBody(
        config.position,
        config.size,
        true // Static
      )
      wallPhysicsBody.type = 'environment'
      wallPhysicsBody.name = config.name
      this.physicsEngine.addRigidBody(wallPhysicsBody)

      console.log(
        `🧱 Created ${config.name} at position (${config.position.x.toFixed(1)}, ${config.position.y.toFixed(1)}, ${config.position.z.toFixed(1)})`
      )
    })

    console.log('✅ Level boundaries created successfully')
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
    // Position gate deep underwater for blue atmosphere experience
    const gatePosition = new THREE.Vector3(0, -8, -15) // 13m underwater to match player depth
    this.gate = new Gate(this.scene, this.physicsEngine, gatePosition)
    console.log(
      `🚪 Gate created at position: (${gatePosition.x}, ${gatePosition.y}, ${gatePosition.z})`
    )
  }

  /**
   * Create swimming sea creatures for ambiance
   */
  createSeaCreatures() {
    console.log('🐠 Creating sea creatures...')

    const creatureTypes = ['fish', 'jellyfish', 'seahorse']

    for (let i = 0; i < 12; i++) {
      // Create 12 creatures
      const creatureType =
        creatureTypes[Math.floor(Math.random() * creatureTypes.length)]
      let mesh, swimRadius, swimSpeed

      switch (creatureType) {
        case 'fish': {
          // Simple fish shape using ellipsoid and fins
          const fishGroup = new THREE.Group()

          // Fish body
          const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 6)
          const bodyMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(
              0.1 + Math.random() * 0.8,
              0.8,
              0.6
            ),
            shininess: 60,
          })
          const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
          body.scale.set(1.5, 1, 0.8) // Make it fish-shaped
          fishGroup.add(body)

          // Tail fin
          const tailGeometry = new THREE.ConeGeometry(0.15, 0.4, 3)
          const tailMaterial = new THREE.MeshPhongMaterial({
            color: bodyMaterial.color.clone().multiplyScalar(0.8),
            shininess: 40,
          })
          const tail = new THREE.Mesh(tailGeometry, tailMaterial)
          tail.position.set(-0.4, 0, 0)
          tail.rotation.z = Math.PI / 2
          fishGroup.add(tail)

          // Side fins
          const finGeometry = new THREE.ConeGeometry(0.08, 0.2, 3)
          const leftFin = new THREE.Mesh(finGeometry, tailMaterial.clone())
          leftFin.position.set(0.1, -0.1, 0.2)
          leftFin.rotation.x = Math.PI / 4
          fishGroup.add(leftFin)

          const rightFin = new THREE.Mesh(finGeometry, tailMaterial.clone())
          rightFin.position.set(0.1, -0.1, -0.2)
          rightFin.rotation.x = -Math.PI / 4
          fishGroup.add(rightFin)

          mesh = fishGroup
          swimRadius = 8 + Math.random() * 12
          swimSpeed = 0.3 + Math.random() * 0.5
          break
        }

        case 'jellyfish': {
          // Jellyfish with dome and tentacles
          const jellyfishGroup = new THREE.Group()

          // Dome
          const domeGeometry = new THREE.SphereGeometry(
            0.4,
            8,
            6,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
          )
          const domeMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(
              0.7 + Math.random() * 0.3,
              0.5,
              0.8
            ),
            transparent: true,
            opacity: 0.7,
            shininess: 100,
          })
          const dome = new THREE.Mesh(domeGeometry, domeMaterial)
          jellyfishGroup.add(dome)

          // Tentacles
          for (let j = 0; j < 6; j++) {
            const tentacleGeometry = new THREE.CylinderGeometry(
              0.02,
              0.01,
              1.5,
              4
            )
            const tentacle = new THREE.Mesh(
              tentacleGeometry,
              domeMaterial.clone()
            )
            const angle = (j / 6) * Math.PI * 2
            tentacle.position.set(
              Math.cos(angle) * 0.3,
              -0.7,
              Math.sin(angle) * 0.3
            )
            tentacle.userData.originalRotation = { x: 0, z: 0 }
            tentacle.userData.tentacleIndex = j
            jellyfishGroup.add(tentacle)
          }

          mesh = jellyfishGroup
          swimRadius = 6 + Math.random() * 8
          swimSpeed = 0.1 + Math.random() * 0.2
          break
        }

        default: {
          // seahorse
          const seahorseGroup = new THREE.Group()

          // Seahorse body (curved)
          const seahorseBodyGeometry = new THREE.CylinderGeometry(
            0.1,
            0.15,
            1,
            8
          )
          const seahorseBodyMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(
              0.2 + Math.random() * 0.4,
              0.7,
              0.5
            ),
            shininess: 40,
          })
          const seahorseBody = new THREE.Mesh(
            seahorseBodyGeometry,
            seahorseBodyMaterial
          )
          seahorseBody.rotation.z = Math.PI / 6 // Curved posture
          seahorseGroup.add(seahorseBody)

          // Head
          const headGeometry = new THREE.SphereGeometry(0.12, 6, 4)
          const head = new THREE.Mesh(
            headGeometry,
            seahorseBodyMaterial.clone()
          )
          head.position.set(0.1, 0.5, 0)
          seahorseGroup.add(head)

          // Dorsal fin
          const dorsalFinGeometry = new THREE.PlaneGeometry(0.15, 0.8)
          const dorsalFinMaterial = new THREE.MeshPhongMaterial({
            color: seahorseBodyMaterial.color.clone().multiplyScalar(1.2),
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
          })
          const dorsalFin = new THREE.Mesh(dorsalFinGeometry, dorsalFinMaterial)
          dorsalFin.position.set(-0.1, 0, 0)
          dorsalFin.rotation.y = Math.PI / 2
          seahorseGroup.add(dorsalFin)

          mesh = seahorseGroup
          swimRadius = 4 + Math.random() * 6
          swimSpeed = 0.2 + Math.random() * 0.3
          break
        }
      }

      // Set random starting position within the underwater area
      const startPosition = new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        -5 - Math.random() * 8, // Swimming in mid-water
        (Math.random() - 0.5) * 60
      )

      mesh.position.copy(startPosition)
      mesh.scale.setScalar(0.8 + Math.random() * 0.4) // Vary sizes

      // Add creature data for animation
      mesh.userData = {
        creatureType: creatureType,
        swimCenter: startPosition.clone(),
        swimRadius: swimRadius,
        swimSpeed: swimSpeed,
        swimAngle: Math.random() * Math.PI * 2,
        bobOffset: Math.random() * Math.PI * 2,
      }

      this.scene.add(mesh)
      this.seaCreatures.push(mesh)
    }

    console.log(`🐠 Created ${this.seaCreatures.length} sea creatures`)
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
        Math.random() * 8 - 12, // Moved 10 units deeper: was -2 to +6, now -12 to -4
        (Math.random() - 0.5) * 20
      )
      star.position.copy(position)
      star.castShadow = true

      // Add physics body for collision detection
      const starPhysicsBody = this.physicsEngine.createSphereBody(
        position,
        1.0, // Increased from 0.5 to 1.0 for easier collection
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

    console.log(`✨ Created ${this.stars.length} sample stars`)
  }

  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), {
      passive: true,
    })

    // Enhanced input handling
    window.addEventListener('keydown', event => this.onKeyDown(event))
    window.addEventListener('keyup', event => this.onKeyUp(event))

    // Touch controls for mobile or Tesla mode
    if (this.isMobile || this.teslaMode) {
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
      // Camera controls for desktop users
      case 'KeyI': // Look up
        this.inputState.keys.cameraUp = true
        break
      case 'KeyK': // Look down
        this.inputState.keys.cameraDown = true
        break
      case 'KeyJ': // Look left
        this.inputState.keys.cameraLeft = true
        break
      case 'KeyL': // Look right
        this.inputState.keys.cameraRight = true
        break
      case 'KeyT': // Toggle Tesla mode
        this.toggleTeslaMode()
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
      // Camera controls for desktop users
      case 'KeyI': // Look up
        this.inputState.keys.cameraUp = false
        break
      case 'KeyK': // Look down
        this.inputState.keys.cameraDown = false
        break
      case 'KeyJ': // Look left
        this.inputState.keys.cameraLeft = false
        break
      case 'KeyL': // Look right
        this.inputState.keys.cameraRight = false
        break
    }
  }

  updateCameraSensitivity() {
    // Doubled camera speed for even more responsive controls
    this.cameraRotation.sensitivity =
      this.isMobile || this.teslaMode ? 0.008 : 0.01
  }

  toggleTeslaMode() {
    this.teslaMode = !this.teslaMode
    console.log(`🚗 Tesla mode ${this.teslaMode ? 'enabled' : 'disabled'}`)

    // Update camera sensitivity based on new mode
    this.updateCameraSensitivity()

    const mobileControls = document.getElementById('mobileControls')
    if (mobileControls) {
      if (this.teslaMode) {
        mobileControls.classList.add('tesla-mode')
        // Re-setup touch controls for Tesla mode
        this.setupTouchControls()
      } else {
        mobileControls.classList.remove('tesla-mode')
      }
    }
  }

  setupTouchControls() {
    // Setup virtual joystick
    this.setupVirtualJoystick()

    // Setup camera joystick
    this.setupCameraJoystick()

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

  setupCameraJoystick() {
    const cameraJoystick = document.getElementById('cameraJoystick')
    const cameraKnob = document.getElementById('cameraKnob')

    if (!cameraJoystick || !cameraKnob) {
      return
    }

    const cameraJoystickState = {
      isActive: false,
      centerX: 0,
      centerY: 0,
      currentX: 0,
      currentY: 0,
    }

    cameraJoystick.addEventListener('touchstart', event => {
      event.preventDefault()
      event.stopPropagation()

      if (event.touches.length > 0) {
        const touch = event.touches[0]
        const rect = cameraJoystick.getBoundingClientRect()

        cameraJoystickState.isActive = true
        cameraJoystickState.centerX = rect.left + rect.width / 2
        cameraJoystickState.centerY = rect.top + rect.height / 2
        cameraJoystickState.currentX = touch.clientX
        cameraJoystickState.currentY = touch.clientY

        // Visual feedback - highlight camera joystick when active
        cameraJoystick.style.borderColor = 'rgba(255, 200, 100, 0.6)'
        cameraJoystick.style.background = 'rgba(0, 17, 34, 0.7)'

        this.updateCameraJoystickKnob(cameraKnob, cameraJoystickState, rect)
      }
    })

    cameraJoystick.addEventListener('touchmove', event => {
      event.preventDefault()
      event.stopPropagation()

      if (event.touches.length > 0 && cameraJoystickState.isActive) {
        const touch = event.touches[0]
        const rect = cameraJoystick.getBoundingClientRect()

        cameraJoystickState.currentX = touch.clientX
        cameraJoystickState.currentY = touch.clientY

        // Calculate camera rotation vector
        const deltaX =
          cameraJoystickState.currentX - cameraJoystickState.centerX
        const deltaY =
          cameraJoystickState.currentY - cameraJoystickState.centerY
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const maxDistance = rect.width / 2 - 20

        // Normalize and apply camera rotation
        if (distance > 5) {
          const normalizedX = deltaX / maxDistance
          const normalizedY = deltaY / maxDistance

          // Update camera input state
          this.inputState.cameraJoystick.x = Math.max(
            -1,
            Math.min(1, normalizedX * 1.5)
          )
          this.inputState.cameraJoystick.y = Math.max(
            -1,
            Math.min(1, normalizedY * 1.5)
          )
        } else {
          this.inputState.cameraJoystick.x = 0
          this.inputState.cameraJoystick.y = 0
        }

        this.updateCameraJoystickKnob(cameraKnob, cameraJoystickState, rect)
      }
    })

    cameraJoystick.addEventListener('touchend', event => {
      event.preventDefault()
      event.stopPropagation()

      cameraJoystickState.isActive = false
      this.inputState.cameraJoystick.x = 0
      this.inputState.cameraJoystick.y = 0

      // Reset visual feedback
      cameraJoystick.style.borderColor = 'rgba(255, 255, 255, 0.3)'
      cameraJoystick.style.background = 'rgba(0, 17, 34, 0.5)'
      cameraKnob.style.transform = 'translate(-50%, -50%)'
    })

    cameraJoystick.addEventListener('touchcancel', event => {
      event.preventDefault()
      event.stopPropagation()

      cameraJoystickState.isActive = false
      this.inputState.cameraJoystick.x = 0
      this.inputState.cameraJoystick.y = 0

      // Reset visual feedback
      cameraJoystick.style.borderColor = 'rgba(255, 255, 255, 0.3)'
      cameraJoystick.style.background = 'rgba(0, 17, 34, 0.5)'
      cameraKnob.style.transform = 'translate(-50%, -50%)'
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

  updateCameraJoystickKnob(knob, cameraJoystickState, rect) {
    const deltaX = cameraJoystickState.currentX - cameraJoystickState.centerX
    const deltaY = cameraJoystickState.currentY - cameraJoystickState.centerY
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

    // Setup PWA install functionality
    this.setupPWAInstall()
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
    if (!this.audioEngine) {
      return
    }

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
      if (masterVolumeValue) {
        masterVolumeValue.textContent = `${value}%`
      }
    }

    if (musicVolumeSlider) {
      const value = Math.round(state.musicVolume * 100)
      musicVolumeSlider.value = value
      if (musicVolumeValue) {
        musicVolumeValue.textContent = `${value}%`
      }
    }

    if (sfxVolumeSlider) {
      const value = Math.round(state.sfxVolume * 100)
      sfxVolumeSlider.value = value
      if (sfxVolumeValue) {
        sfxVolumeValue.textContent = `${value}%`
      }
    }
  }

  setupPWAInstall() {
    const installButton = document.getElementById('installButton')
    const installStatus = document.getElementById('installStatus')

    // Store the beforeinstallprompt event for later use
    let deferredPrompt = null

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', event => {
      console.log('📱 PWA install prompt available')
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault()
      // Store the event so it can be triggered later
      deferredPrompt = event

      // Show the install button
      if (installButton) {
        installButton.classList.remove('hidden')
      }
      if (installStatus) {
        installStatus.classList.add('hidden')
      }
    })

    // Handle install button click
    if (installButton) {
      installButton.addEventListener('click', async () => {
        if (!deferredPrompt) {
          console.log('📱 No install prompt available')
          return
        }

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
          console.log('📱 User accepted the install prompt')
          installButton.textContent = '✅ App Installing...'
          installButton.disabled = true
        } else {
          console.log('📱 User dismissed the install prompt')
        }

        // Clear the deferred prompt since it can only be used once
        deferredPrompt = null
        installButton.classList.add('hidden')
      })
    }

    // Listen for successful app installation
    window.addEventListener('appinstalled', () => {
      console.log('📱 PWA was installed successfully')
      if (installButton) {
        installButton.classList.add('hidden')
      }
      if (installStatus) {
        installStatus.textContent = '✅ App installed successfully!'
        installStatus.classList.remove('hidden')
      }
      // Clear the deferred prompt
      deferredPrompt = null
    })

    // Check if app is already installed or running in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone
    ) {
      console.log('📱 PWA is already running in standalone mode')
      if (installButton) {
        installButton.classList.add('hidden')
      }
      if (installStatus) {
        installStatus.textContent = '✅ App is already installed!'
        installStatus.classList.remove('hidden')
      }
    } else {
      // Show fallback message if install prompt is not available after a delay
      setTimeout(() => {
        if (
          !deferredPrompt &&
          installButton &&
          installButton.classList.contains('hidden')
        ) {
          if (installStatus) {
            installStatus.textContent =
              'App installation not available in this browser. Try Chrome, Edge, or Safari.'
            installStatus.classList.remove('hidden')
          }
        }
      }, 2000)
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  updateCamera(deltaTime = 0.016) {
    const playerPosition = this.player.getPosition()

    // Apply desktop keyboard camera controls for non-mobile users
    if (!this.isMobile && !this.teslaMode) {
      let cameraInputX = 0
      let cameraInputY = 0

      if (this.inputState.keys.cameraLeft) {
        cameraInputX -= 1
      }
      if (this.inputState.keys.cameraRight) {
        cameraInputX += 1
      }
      if (this.inputState.keys.cameraUp) {
        cameraInputY -= 1
      }
      if (this.inputState.keys.cameraDown) {
        cameraInputY += 1
      }

      if (cameraInputX !== 0 || cameraInputY !== 0) {
        this.cameraRotation.horizontal +=
          cameraInputX * this.cameraRotation.sensitivity * (60 * deltaTime)
        this.cameraRotation.vertical +=
          cameraInputY * this.cameraRotation.sensitivity * (60 * deltaTime)

        // Allow full 360° rotation by wrapping both rotations
        this.cameraRotation.horizontal =
          this.cameraRotation.horizontal % (Math.PI * 2)
        this.cameraRotation.vertical =
          this.cameraRotation.vertical % (Math.PI * 2)
      }
    }

    // Apply camera joystick rotation if active (mobile or Tesla mode)
    if (
      this.inputState.cameraJoystick.x !== 0 ||
      this.inputState.cameraJoystick.y !== 0
    ) {
      // Update camera rotation based on joystick input with delta time
      this.cameraRotation.horizontal +=
        this.inputState.cameraJoystick.x *
        this.cameraRotation.sensitivity *
        (60 * deltaTime) // Frame rate independent
      this.cameraRotation.vertical +=
        this.inputState.cameraJoystick.y *
        this.cameraRotation.sensitivity *
        (60 * deltaTime)

      // Allow full 360° rotation by wrapping horizontal rotation
      this.cameraRotation.horizontal =
        this.cameraRotation.horizontal % (Math.PI * 2)

      // Allow full vertical rotation (360°) for complete camera freedom
      this.cameraRotation.vertical =
        this.cameraRotation.vertical % (Math.PI * 2)
    }

    // Calculate camera position based on rotation and depth
    const distance = 15 // Distance from player
    const baseHeight = 12 // Base height offset

    // Adjust height offset based on player depth for better wave visibility
    const playerDepth = 5.0 - playerPosition.y // Water surface at Y=5
    const depthAdjustment = Math.min(3, Math.max(0, playerDepth - 10) * 0.3) // Increase height when deeper than 10m
    const height = baseHeight + depthAdjustment

    // Apply rotation to calculate offset
    const offsetX = Math.sin(this.cameraRotation.horizontal) * distance
    const offsetZ = Math.cos(this.cameraRotation.horizontal) * distance
    const offsetY =
      height + Math.sin(this.cameraRotation.vertical) * distance * 0.5

    const offset = new THREE.Vector3(offsetX, offsetY, offsetZ)
    const targetPosition = playerPosition.clone().add(offset)

    // Adaptive camera smoothing for better large screen experience
    // Base smoothing factor adjusted for frame rate and screen size
    const baseSmoothingFactor = 0.12 // Slightly increased for smoother movement

    // Screen size factor: larger screens get smoother camera movement
    // Mobile devices get more conservative smoothing for better control
    let screenSizeFactor
    if (this.isMobile) {
      // More conservative smoothing on mobile for better control
      screenSizeFactor = Math.min(0.8, Math.max(0.5, window.innerWidth / 1920))
    } else {
      // Enhanced smoothing for large screens to reduce jerkiness during direction changes
      screenSizeFactor = Math.min(2.0, Math.max(1.0, window.innerWidth / 1920))
    }

    // Frame rate compensation: maintain consistent smoothing regardless of FPS
    const frameRateCompensation = deltaTime * 60 // Target 60fps equivalent

    // Player movement responsiveness: more responsive when changing direction
    let movementResponsiveness = 1.0
    if (this.player && this.player.isMoving) {
      // Check if player direction changed recently for extra responsiveness
      const currentMovementDirection = this.player.movementVector
        .clone()
        .normalize()
      if (this.previousMovementDirection) {
        const directionChange =
          1 - currentMovementDirection.dot(this.previousMovementDirection)
        movementResponsiveness = 1.0 + directionChange * 0.8 // Up to 80% more responsive when changing direction
      }
      this.previousMovementDirection = currentMovementDirection.clone()
    } else {
      this.previousMovementDirection = null
    }

    // Calculate final smoothing factor
    const adaptiveSmoothingFactor = Math.min(
      1.0,
      baseSmoothingFactor *
        screenSizeFactor *
        frameRateCompensation *
        movementResponsiveness
    )

    // Smooth camera movement with adaptive factor
    this.camera.position.lerp(targetPosition, adaptiveSmoothingFactor)

    // Improved camera look direction to account for player movement direction
    const lookAtTarget = playerPosition.clone()

    // If player is moving, adjust camera to look in the direction of movement
    if (this.player && this.player.isMoving) {
      const movementDirection = this.player.movementVector.clone().normalize()
      // Add movement direction influence to look target for better head direction awareness
      lookAtTarget.add(movementDirection.multiplyScalar(2))
      lookAtTarget.y += 1 // Less vertical offset when moving to see movement direction better
    } else {
      lookAtTarget.y += 2 // Look slightly above the player when stationary
    }

    this.camera.lookAt(lookAtTarget)
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

  /**
   * Calculate Gerstner wave displacement for realistic ocean waves
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} time - Current time
   * @param {Object} wave - Wave parameters {amplitude, frequency, speed, direction, steepness}
   * @returns {Object} - {x, y, z} displacement
   */
  calculateGerstnerWave(x, z, time, wave) {
    // Normalize direction vector
    const dirLength = Math.sqrt(wave.direction.x ** 2 + wave.direction.z ** 2)
    const dirX = wave.direction.x / dirLength
    const dirZ = wave.direction.z / dirLength

    // Calculate wave phase
    const phase = (dirX * x + dirZ * z) * wave.frequency + time * wave.speed
    const sinPhase = Math.sin(phase)
    const cosPhase = Math.cos(phase)

    // Gerstner wave equations for realistic ocean movement
    const steepnessFactor = wave.steepness / wave.frequency

    return {
      x: steepnessFactor * dirX * sinPhase * wave.amplitude,
      y: cosPhase * wave.amplitude,
      z: steepnessFactor * dirZ * sinPhase * wave.amplitude,
    }
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

    // Update camera with delta time for smooth interpolation
    this.updateCamera(deltaTime)

    // Update underwater atmosphere effects based on camera position
    this.updateUnderwaterAtmosphere()

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

      // Enhanced pulsing emissive effect with more dramatic variation
      const pulseFactor = 0.5 + Math.sin(time * 2 + userData.floatOffset) * 0.3
      star.material.emissiveIntensity = pulseFactor
    })

    // Animate environment objects (swaying seaweed and kelp)
    this.environmentObjects.forEach(envObject => {
      const mesh = envObject.mesh
      if (mesh.userData.swaySpeed && mesh.userData.swayAmount) {
        const time = Date.now() * 0.001
        const swayX =
          Math.sin(time * mesh.userData.swaySpeed) * mesh.userData.swayAmount
        const swayZ =
          Math.cos(time * mesh.userData.swaySpeed * 0.7) *
          mesh.userData.swayAmount *
          0.5
        mesh.rotation.x = swayX
        mesh.rotation.z = swayZ
      }
    })

    // Animate sea creatures
    this.seaCreatures.forEach(creature => {
      const userData = creature.userData
      const time = Date.now() * 0.001

      // Update swimming angle
      userData.swimAngle += userData.swimSpeed * deltaTime

      // Calculate circular swimming path
      const swimX =
        userData.swimCenter.x +
        Math.cos(userData.swimAngle) * userData.swimRadius
      const swimZ =
        userData.swimCenter.z +
        Math.sin(userData.swimAngle) * userData.swimRadius
      const swimY =
        userData.swimCenter.y + Math.sin(time + userData.bobOffset) * 0.5 // Gentle vertical bobbing

      creature.position.set(swimX, swimY, swimZ)

      // Face swimming direction
      const directionAngle = userData.swimAngle + Math.PI / 2
      creature.rotation.y = directionAngle

      // Add specific animations based on creature type
      if (userData.creatureType === 'jellyfish') {
        // Animate jellyfish tentacles
        creature.children.forEach(child => {
          if (child.userData.tentacleIndex !== undefined) {
            const tentacleWave =
              Math.sin(time * 3 + child.userData.tentacleIndex) * 0.3
            child.rotation.x = tentacleWave
            child.rotation.z =
              Math.sin(time * 2 + child.userData.tentacleIndex) * 0.2
          }
        })

        // Pulse the dome
        const pulseScale = 1 + Math.sin(time * 2) * 0.1
        if (creature.children[0]) {
          creature.children[0].scale.setScalar(pulseScale)
        }
      } else if (userData.creatureType === 'fish') {
        // Animate fish tail wagging
        if (creature.children[1]) {
          // Tail is usually second child
          creature.children[1].rotation.y = Math.sin(time * 8) * 0.3
        }

        // Animate side fins
        creature.children.forEach((child, index) => {
          if (index > 1) {
            // Side fins
            child.rotation.z =
              child.rotation.z + Math.sin(time * 6 + index) * 0.1
          }
        })
      } else if (userData.creatureType === 'seahorse') {
        // Animate dorsal fin
        creature.children.forEach(child => {
          if (child.geometry && child.geometry.type === 'PlaneGeometry') {
            child.rotation.z = Math.sin(time * 5) * 0.2
          }
        })
      }
    })

    // Get current time for all animations
    const time = Date.now() * 0.001

    // Realistic wave animation system for wave surface only (water surface temporarily disabled)
    // if (this.waterSurface && this.waterOriginalPositions && this.waveParams) {
    //   const positions = this.waterSurface.geometry.attributes.position.array
    //   const time = Date.now() * 0.001

    //   // Apply realistic wave motion to underwater water surface
    //   for (let i = 0; i < positions.length; i += 3) {
    //     const x = this.waterOriginalPositions[i]
    //     const z = this.waterOriginalPositions[i + 2]

    //     // Multi-layered wave system for realistic ocean movement
    //     const wave1 =
    //       Math.sin(
    //         x * this.waveParams.frequency + time * this.waveParams.speed
    //       ) * this.waveParams.amplitude
    //     const wave2 =
    //       Math.sin(
    //         z * this.waveParams.frequency * 0.7 +
    //           time * this.waveParams.speed * 0.8
    //       ) *
    //       this.waveParams.amplitude *
    //       0.6
    //     const wave3 =
    //       Math.sin(
    //         (x + z) * this.waveParams.frequency * 1.3 +
    //           time * this.waveParams.speed * 1.2
    //       ) *
    //       this.waveParams.amplitude *
    //       0.4

    //     const waveHeight = wave1 + wave2 + wave3

    //     positions[i] = x
    //     positions[i + 1] = waveHeight
    //     positions[i + 2] = z
    //   }
    //   this.waterSurface.geometry.attributes.position.needsUpdate = true
    // }

    // Animate the visible wave surface at Y=5.0
    if (this.waveSurface && this.waveOriginalPositions) {
      const time = Date.now() * 0.001 // Declare time here since it's not declared above anymore
      const wavePositions = this.waveSurface.geometry.attributes.position.array
      let maxHeight = 0
      let minHeight = 0
      for (let i = 0; i < wavePositions.length; i += 3) {
        const x = this.waveOriginalPositions[i]
        const z = this.waveOriginalPositions[i + 2]

        // Same wave pattern but with enhanced visibility
        const wave1 =
          Math.sin(
            x * this.waveParams.frequency + time * this.waveParams.speed
          ) * this.waveParams.amplitude
        const wave2 =
          Math.sin(
            z * this.waveParams.frequency * 0.7 +
              time * this.waveParams.speed * 0.8
          ) *
          this.waveParams.amplitude *
          0.6
        const wave3 =
          Math.sin(
            (x + z) * this.waveParams.frequency * 1.3 +
              time * this.waveParams.speed * 1.2
          ) *
          this.waveParams.amplitude *
          0.4

        const waveHeight = wave1 + wave2 + wave3
        maxHeight = Math.max(maxHeight, waveHeight)
        minHeight = Math.min(minHeight, waveHeight)

        wavePositions[i] = x
        wavePositions[i + 1] = waveHeight
        wavePositions[i + 2] = z
      }
      this.waveSurface.geometry.attributes.position.needsUpdate = true
    }
    // }

    // Animate foam surface to show wave crests (simplified)
    if (this.foamSurface && this.foamOriginalPositions) {
      const foamPositions = this.foamSurface.geometry.attributes.position.array

      // Apply simple foam effects
      for (let i = 0; i < foamPositions.length; i += 3) {
        const x = this.foamOriginalPositions[i]
        const z = this.foamOriginalPositions[i + 2]

        // Calculate simple wave height for foam
        const waveHeight =
          Math.sin(x * 0.1 + time * 2) * 3.0 +
          Math.sin(z * 0.15 + time * 1.5) * 2.0

        // Show foam on wave crests
        const foamThreshold = 1.5
        if (waveHeight > foamThreshold) {
          foamPositions[i + 1] = waveHeight + 0.2 // Slightly above water
          this.foamSurface.material.opacity = Math.min(
            0.6,
            (waveHeight - foamThreshold) * 0.3
          )
        } else {
          foamPositions[i + 1] = -10 // Hide foam below surface
        }
      }

      this.foamSurface.geometry.attributes.position.needsUpdate = true
    }

    // Animate clouds drifting across the sky
    if (this.clouds) {
      this.clouds.forEach(cloudGroup => {
        const userData = cloudGroup.userData
        const animationTime = time * userData.speed + userData.offset

        // Gentle drift movement for the entire cloud group
        cloudGroup.position.x =
          userData.originalPosition.x + Math.sin(animationTime) * 3
        cloudGroup.position.z =
          userData.originalPosition.z + Math.cos(animationTime * 0.7) * 2

        // Animate individual spheres within each cloud group
        cloudGroup.children.forEach((sphere, index) => {
          // Individual sphere rotation for cloud movement effect
          sphere.rotation.y += 0.002 + index * 0.001

          // Subtle opacity variation for depth effect
          const baseOpacity = sphere.material.opacity || 0.8
          sphere.material.opacity = Math.max(
            0.6,
            baseOpacity + Math.sin(animationTime * 2 + index) * 0.1
          )
        })
      })
    }

    // Animate celestial body (sun/moon) movement across sky
    if (this.celestialBody && this.celestialBody.userData) {
      const userData = this.celestialBody.userData
      const animationTime = time * userData.animationSpeed

      // Create arc movement across the sky
      const angleOffset = userData.isEvenLevel ? 0 : Math.PI // Moon starts on opposite side
      const angle = animationTime + angleOffset

      const x =
        Math.cos(angle) * userData.animationRadius + userData.originalPosition.x
      const y = Math.abs(Math.sin(angle)) * 15 + 25 // Keep above horizon
      const z = userData.originalPosition.z

      this.celestialBody.position.set(x, y, z)

      // Update celestial light position
      if (this.celestialLight) {
        this.celestialLight.position.copy(this.celestialBody.position)
      }
    }

    // Animate volumetric lights for underwater caustics effect
    if (this.volumetricLights) {
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
        console.log('🎯 Gate collision detected!')
        const levelCompleted = collision.gate.onPlayerEnter()
        if (levelCompleted) {
          console.log('🎉 Level completed via gate collision!')
          this.levelComplete()
          break
        }
      }
    }
  }

  levelComplete() {
    console.log('🎉 Level Complete!')

    // Add portal transition animation
    this.startPortalTransition()

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

  /**
   * Start portal transition animation when passing through gate
   */
  startPortalTransition() {
    console.log('🌊 Starting portal transition...')

    // Create transition effect particles
    if (this.particleSystem && this.gate) {
      const gatePosition = this.gate.getPosition()

      // Create swirling portal particles
      this.particleSystem.createBurst(gatePosition, {
        count: 50,
        life: 2.25, // Average of lifetime range (1.5-3)
        velocity: new THREE.Vector3(0, 1, 0), // Base upward velocity
        velocityVariation: new THREE.Vector3(6, 4, 6), // Variation for swirling effect
        size: { min: 4, max: 12 },
        color: new THREE.Color(0x87ceeb), // Light blue
      })

      // Create golden sparkles for completion
      this.particleSystem.createBurst(gatePosition, {
        count: 30,
        life: 3.0, // Average of lifetime range (2-4)
        velocity: new THREE.Vector3(0, 0.5, 0), // Slower upward velocity
        velocityVariation: new THREE.Vector3(4, 3, 4), // Sparkle spread effect
        size: { min: 2, max: 6 },
        color: new THREE.Color(0xffd700), // Gold
      })
    }

    // Camera shake effect for impact
    if (this.camera) {
      this.startCameraShake(0.3, 1.0) // intensity, duration
    }

    // Temporary screen flash effect
    this.createScreenFlash()
  }

  /**
   * Create a brief screen flash effect for portal transition
   */
  createScreenFlash() {
    const flash = document.createElement('div')
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(135, 206, 235, 0.3) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1000;
      animation: portalFlash 1.2s ease-out forwards;
    `

    // Add CSS animation for flash effect
    if (!document.querySelector('#portalFlashStyle')) {
      const style = document.createElement('style')
      style.id = 'portalFlashStyle'
      style.textContent = `
        @keyframes portalFlash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }

    document.body.appendChild(flash)

    // Remove flash element after animation
    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash)
      }
    }, 1200)
  }

  /**
   * Start camera shake effect
   */
  startCameraShake(intensity = 0.2, duration = 0.5) {
    if (!this.camera) {
      return
    }

    const originalPosition = this.camera.position.clone()
    const startTime = Date.now()

    const shakeAnimation = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = elapsed / duration

      if (progress < 1) {
        // Decreasing intensity over time
        const currentIntensity = intensity * (1 - progress)

        // Random shake offset
        const shakeX = (Math.random() - 0.5) * currentIntensity * 2
        const shakeY = (Math.random() - 0.5) * currentIntensity * 2
        const shakeZ = (Math.random() - 0.5) * currentIntensity * 2

        this.camera.position.copy(originalPosition)
        this.camera.position.add(new THREE.Vector3(shakeX, shakeY, shakeZ))

        requestAnimationFrame(shakeAnimation)
      } else {
        // Reset to original position
        this.camera.position.copy(originalPosition)
      }
    }

    shakeAnimation()
  }

  updateUI() {
    document.getElementById('starCount').textContent = this.starCount
    document.getElementById('levelNumber').textContent = this.levelNumber

    // Update depth meter based on player Y position
    if (this.player) {
      const playerPosition = this.player.getPosition()
      // Water surface is at Y=5, so depth = surface level - current Y position
      const waterSurface = 5.0
      const depth = waterSurface - playerPosition.y // Remove Math.max(0, ...) to allow negative values

      // Format depth display: positive values for underwater, negative for above surface
      const depthText = depth >= 0 ? depth.toFixed(1) : depth.toFixed(1)
      document.getElementById('depthMeter').textContent = depthText
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
      const safeMessage = striptags(message)
      loadingElement.innerHTML = `
        <div style="color: #ff4444; text-align: center;">
          <h3>⚠️ Error Loading Game</h3>
          <p>${safeMessage}</p>
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
      window.oceanAdventure = game // Expose game instance for debugging
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
