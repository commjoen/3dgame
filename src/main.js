/**
 * Ocean Adventure - Main Game Entry Point
 *
 * This is a placeholder implementation showing the basic structure
 * for the 3D underwater platform game. The actual game engine
 * implementation will be developed following the Copilot plan.
 */

import * as THREE from 'three'

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

    // Game state
    this.starCount = 0
    this.levelNumber = 1

    console.log('🌊 Ocean Adventure - Initializing...')
  }

  async initialize() {
    try {
      this.setupCanvas()
      this.setupRenderer()
      this.setupScene()
      this.setupCamera()
      this.setupLights()
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
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile, // Disable antialiasing on mobile for performance
      alpha: false,
    })

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x001122, 1) // Deep ocean blue

    // Enable shadows for better visual quality
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  setupScene() {
    this.scene = new THREE.Scene()

    // Add basic underwater environment
    this.createUnderwaterEnvironment()
    this.createPlayer()
    this.createSampleStars()
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
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
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

    // Add some basic coral/rocks
    for (let i = 0; i < 10; i++) {
      const geometry = new THREE.SphereGeometry(0.5 + Math.random() * 1.5)
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.3, 0.7, 0.5),
      })
      const coral = new THREE.Mesh(geometry, material)
      coral.position.set(
        (Math.random() - 0.5) * 80,
        -4 + Math.random() * 2,
        (Math.random() - 0.5) * 80
      )
      coral.castShadow = true
      this.scene.add(coral)
    }
  }

  createPlayer() {
    // Simple player representation (will be replaced with proper model)
    const playerGeometry = new THREE.CapsuleGeometry(0.5, 1.5)
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff88 })
    this.player = new THREE.Mesh(playerGeometry, playerMaterial)
    this.player.position.set(0, 0, 0)
    this.player.castShadow = true
    this.scene.add(this.player)
  }

  createSampleStars() {
    this.stars = []

    // Create glowing star collectibles
    for (let i = 0; i < 5; i++) {
      const starGeometry = new THREE.SphereGeometry(0.3)
      const starMaterial = new THREE.MeshLambertMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
      })

      const star = new THREE.Mesh(starGeometry, starMaterial)
      star.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 8 - 2,
        (Math.random() - 0.5) * 20
      )

      // Add simple rotation animation
      star.userData = { rotationSpeed: 0.02 + Math.random() * 0.02 }

      this.stars.push(star)
      this.scene.add(star)
    }
  }

  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize())

    // Basic movement controls (placeholder)
    window.addEventListener('keydown', event => this.onKeyDown(event))

    // Touch controls for mobile (placeholder)
    if (this.isMobile) {
      this.setupTouchControls()
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

    const moveSpeed = 0.15

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

          // Apply movement to player
          this.player.position.x += normalizedX * moveSpeed * 0.03
          this.player.position.z += normalizedY * moveSpeed * 0.03

          this.updateCamera()
        }

        this.updateJoystickKnob(knob, joystickState, rect)
      }
    })

    joystick.addEventListener('touchend', event => {
      event.preventDefault()
      event.stopPropagation()

      joystickState.isActive = false
      knob.style.transform = 'translate(-50%, -50%)'
    })

    joystick.addEventListener('touchcancel', event => {
      event.preventDefault()
      event.stopPropagation()

      joystickState.isActive = false
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
      swimUpBtn.addEventListener('touchstart', event => {
        event.preventDefault()
        event.stopPropagation()
        this.mobileButtonState = { swimUp: true }
      })

      swimUpBtn.addEventListener('touchend', event => {
        event.preventDefault()
        event.stopPropagation()
        this.mobileButtonState = { swimUp: false }
      })
    }

    if (swimDownBtn) {
      swimDownBtn.addEventListener('touchstart', event => {
        event.preventDefault()
        event.stopPropagation()
        this.mobileButtonState = { swimDown: true }
      })

      swimDownBtn.addEventListener('touchend', event => {
        event.preventDefault()
        event.stopPropagation()
        this.mobileButtonState = { swimDown: false }
      })
    }

    // Initialize mobile button state
    this.mobileButtonState = { swimUp: false, swimDown: false }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  onKeyDown(event) {
    // Basic movement controls (placeholder)
    const moveSpeed = 0.2

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.player.position.z -= moveSpeed
        break
      case 'ArrowDown':
      case 'KeyS':
        this.player.position.z += moveSpeed
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.player.position.x -= moveSpeed
        break
      case 'ArrowRight':
      case 'KeyD':
        this.player.position.x += moveSpeed
        break
      case 'Space':
        this.player.position.y += moveSpeed * 0.5
        break
      case 'ShiftLeft':
        this.player.position.y -= moveSpeed * 0.5
        break
    }

    // Update camera to follow player
    this.updateCamera()
  }

  updateCamera() {
    // Simple camera follow logic (will be improved)
    const offset = new THREE.Vector3(0, 5, 10)
    const targetPosition = this.player.position.clone().add(offset)
    this.camera.position.lerp(targetPosition, 0.1)
    this.camera.lookAt(this.player.position)
  }

  startGameLoop() {
    const animate = () => {
      requestAnimationFrame(animate)
      this.update()
      this.render()
    }
    animate()
  }

  update() {
    if (!this.isLoaded) {
      return
    }

    // Handle mobile button states
    if (this.isMobile && this.mobileButtonState) {
      const moveSpeed = 0.2
      if (this.mobileButtonState.swimUp) {
        this.player.position.y += moveSpeed * 0.5
        this.updateCamera()
      }
      if (this.mobileButtonState.swimDown) {
        this.player.position.y -= moveSpeed * 0.5
        this.updateCamera()
      }
    }

    // Animate stars
    this.stars.forEach(star => {
      star.rotation.y += star.userData.rotationSpeed
      star.rotation.x += star.userData.rotationSpeed * 0.5
    })

    // Check star collection (simple distance check)
    this.checkStarCollection()
  }

  checkStarCollection() {
    this.stars.forEach((star, index) => {
      const distance = this.player.position.distanceTo(star.position)
      if (distance < 1.0) {
        // Collect star
        this.scene.remove(star)
        this.stars.splice(index, 1)
        this.starCount++
        this.updateUI()

        console.log(`⭐ Star collected! Total: ${this.starCount}`)

        // Check if level is complete
        if (this.stars.length === 0) {
          this.levelComplete()
        }
      }
    })
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
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
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
