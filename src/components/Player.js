/**
 * Player Component for Ocean Adventure
 *
 * Enhanced player controller with physics integration,
 * underwater movement mechanics, and collision handling.
 */

import * as THREE from 'three'

export class Player {
  constructor(scene, physicsEngine) {
    this.scene = scene
    this.physicsEngine = physicsEngine

    // Player properties
    this.moveSpeed = 8.0
    this.rotationSpeed = 3.0
    this.maxVelocity = 5.0

    // Movement state
    this.movementVector = new THREE.Vector3()
    this.isMoving = false

    // Create player mesh and physics body
    this.createPlayerMesh()
    this.createPhysicsBody()

    // Bind collision handler
    this.physicsBody.onCollision = collisions =>
      this.handleCollisions(collisions)
  }

  /**
   * Create the visual representation of the player
   */
  createPlayerMesh() {
    // Create player geometry (capsule for better collision detection)
    const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8)
    const material = new THREE.MeshLambertMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.9,
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true

    // Add to scene
    this.scene.add(this.mesh)
  }

  /**
   * Create physics body for collision detection and movement
   */
  createPhysicsBody() {
    this.physicsBody = this.physicsEngine.createSphereBody(
      this.mesh.position,
      0.7, // Slightly larger radius for collision detection
      false // Not static - player can move
    )

    // Add physics body to engine
    this.physicsEngine.addRigidBody(this.physicsBody)
  }

  /**
   * Handle input and update movement vector
   * @param {Object} inputState - Current input state
   */
  handleInput(inputState) {
    // Reset movement vector
    this.movementVector.set(0, 0, 0)
    this.isMoving = false

    // Keyboard input
    if (inputState.keys) {
      if (inputState.keys.forward) {
        this.movementVector.z -= 1
        this.isMoving = true
      }
      if (inputState.keys.backward) {
        this.movementVector.z += 1
        this.isMoving = true
      }
      if (inputState.keys.left) {
        this.movementVector.x -= 1
        this.isMoving = true
      }
      if (inputState.keys.right) {
        this.movementVector.x += 1
        this.isMoving = true
      }
      if (inputState.keys.up) {
        this.movementVector.y += 1
        this.isMoving = true
      }
      if (inputState.keys.down) {
        this.movementVector.y -= 1
        this.isMoving = true
      }
    }

    // Touch/mobile input
    if (inputState.joystick) {
      this.movementVector.x += inputState.joystick.x
      this.movementVector.z += inputState.joystick.y
      if (
        Math.abs(inputState.joystick.x) > 0.1 ||
        Math.abs(inputState.joystick.y) > 0.1
      ) {
        this.isMoving = true
      }
    }

    // Mobile buttons
    if (inputState.mobileButtons) {
      if (inputState.mobileButtons.swimUp) {
        this.movementVector.y += 1
        this.isMoving = true
      }
      if (inputState.mobileButtons.swimDown) {
        this.movementVector.y -= 1
        this.isMoving = true
      }
    }

    // Normalize movement vector to prevent faster diagonal movement
    if (this.movementVector.length() > 1) {
      this.movementVector.normalize()
    }

    // Apply movement to physics body
    this.applyMovement()
  }

  /**
   * Apply movement forces to the physics body
   */
  applyMovement() {
    if (!this.isMoving) {
      // Apply stronger drag when not actively moving
      this.physicsBody.velocity.multiplyScalar(0.9)
      return
    }

    // Calculate movement force
    const force = this.movementVector
      .clone()
      .multiplyScalar(this.moveSpeed * 0.016) // Assume ~60fps for consistent feel

    // Add force to velocity
    this.physicsBody.velocity.add(force)

    // Clamp velocity to max speed
    if (this.physicsBody.velocity.length() > this.maxVelocity) {
      this.physicsBody.velocity.normalize().multiplyScalar(this.maxVelocity)
    }

    // Rotate player to face movement direction (optional visual enhancement)
    if (this.movementVector.length() > 0.1) {
      const targetRotation = Math.atan2(
        this.movementVector.x,
        this.movementVector.z
      )
      this.mesh.rotation.y = THREE.MathUtils.lerp(
        this.mesh.rotation.y,
        targetRotation,
        this.rotationSpeed * 0.016
      )
    }
  }

  /**
   * Update player state
   */
  update() {
    // Sync mesh position with physics body
    this.mesh.position.copy(this.physicsBody.position)

    // Add gentle floating animation
    const time = Date.now() * 0.001
    this.mesh.position.y += Math.sin(time * 2) * 0.02

    // Update physics body position to match (for the floating effect)
    this.physicsBody.position.copy(this.mesh.position)
  }

  /**
   * Handle collisions with other objects
   * @param {Array} collisions - Array of objects the player collided with
   */
  handleCollisions(collisions) {
    for (const collision of collisions) {
      // Handle different types of collisions
      if (collision.type === 'collectible') {
        this.handleCollectibleCollision(collision)
      } else if (collision.type === 'obstacle') {
        this.handleObstacleCollision(collision)
      } else if (collision.type === 'environment') {
        this.handleEnvironmentCollision(collision)
      }
    }
  }

  /**
   * Handle collision with collectible items
   * @param {Object} collectible - Collectible object
   */
  handleCollectibleCollision(collectible) {
    // Collectibles will be handled by the game manager
    // This is just for reference and future expansion
    console.log('Player collected item:', collectible)
  }

  /**
   * Handle collision with obstacles
   * @param {Object} obstacle - Obstacle object
   */
  handleObstacleCollision(obstacle) {
    // Bounce back slightly from obstacles
    const direction = this.physicsBody.position
      .clone()
      .sub(obstacle.position)
      .normalize()

    this.physicsBody.velocity.add(direction.multiplyScalar(2))
  }

  /**
   * Handle collision with environment objects
   * @param {Object} _envObject - Environment object (unused for now)
   */
  handleEnvironmentCollision() {
    // Environment collisions are handled by physics engine
    // This can be used for special effects or sounds
  }

  /**
   * Get current player position
   * @returns {THREE.Vector3} Current position
   */
  getPosition() {
    return this.mesh.position.clone()
  }

  /**
   * Set player position
   * @param {THREE.Vector3} position - New position
   */
  setPosition(position) {
    this.mesh.position.copy(position)
    this.physicsBody.position.copy(position)
  }

  /**
   * Get current velocity
   * @returns {THREE.Vector3} Current velocity
   */
  getVelocity() {
    return this.physicsBody.velocity.clone()
  }

  /**
   * Check if player is moving
   * @returns {boolean} Whether player is currently moving
   */
  getIsMoving() {
    return this.isMoving || this.physicsBody.velocity.length() > 0.1
  }

  /**
   * Dispose of player resources
   */
  dispose() {
    // Remove from physics engine
    this.physicsEngine.removeRigidBody(this.physicsBody)

    // Remove mesh from scene
    this.scene.remove(this.mesh)

    // Dispose geometry and material
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
  }
}
