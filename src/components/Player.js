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
    // Create swimmer-like body using a group of geometries
    this.mesh = new THREE.Group()

    // Main body (torso) - elongated ellipsoid shape
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8)
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0xfdbcb4, // Skin tone
      transparent: true,
      opacity: 0.95,
      shininess: 30,
      specular: 0x444444,
    })
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial)
    bodyMesh.castShadow = true
    bodyMesh.receiveShadow = true
    this.mesh.add(bodyMesh)

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 6)
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0xfdbcb4, // Same skin tone
      shininess: 20,
    })
    const headMesh = new THREE.Mesh(headGeometry, headMaterial)
    headMesh.position.set(0, 0.9, 0)
    headMesh.castShadow = true
    headMesh.receiveShadow = true
    this.mesh.add(headMesh)

    // Swimming arms (simplified)
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.6, 4, 6)
    const armMaterial = new THREE.MeshPhongMaterial({
      color: 0xfdbcb4,
      shininess: 20,
    })

    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial)
    leftArm.position.set(-0.4, 0.3, 0)
    leftArm.rotation.z = 0.3 // Swimming position
    leftArm.castShadow = true
    leftArm.receiveShadow = true
    this.mesh.add(leftArm)

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial)
    rightArm.position.set(0.4, 0.3, 0)
    rightArm.rotation.z = -0.3 // Swimming position
    rightArm.castShadow = true
    rightArm.receiveShadow = true
    this.mesh.add(rightArm)

    // Swimming legs
    const legGeometry = new THREE.CapsuleGeometry(0.1, 0.8, 4, 6)
    const legMaterial = new THREE.MeshPhongMaterial({
      color: 0xfdbcb4,
      shininess: 20,
    })

    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    leftLeg.position.set(-0.15, -0.9, 0)
    leftLeg.castShadow = true
    leftLeg.receiveShadow = true
    this.mesh.add(leftLeg)

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    rightLeg.position.set(0.15, -0.9, 0)
    rightLeg.castShadow = true
    rightLeg.receiveShadow = true
    this.mesh.add(rightLeg)

    // Swimming gear (goggles/mask)
    const gogglesGeometry = new THREE.SphereGeometry(0.28, 8, 6)
    const gogglesMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.8,
      shininess: 100,
    })
    const goggles = new THREE.Mesh(gogglesGeometry, gogglesMaterial)
    goggles.position.set(0, 0.9, 0.1)
    goggles.scale.set(1, 0.6, 0.8) // Flatten for goggle shape
    this.mesh.add(goggles)

    // Store references for animation
    this.bodyParts = {
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
    }

    // Set initial position - start deep underwater for blue glow effect
    this.mesh.position.set(0, -8, 0) // Start 13 meters below water surface (5 - (-8) = 13m depth)

    // Add to scene
    this.scene.add(this.mesh)
  }

  /**
   * Create physics body for collision detection and movement
   */
  createPhysicsBody() {
    this.physicsBody = this.physicsEngine.createSphereBody(
      this.mesh.position.clone(), // Use the mesh position which is now set to (0, 2, 0)
      1.0, // Increased from 0.7 to 1.0 for better collision detection
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
      .multiplyScalar(this.moveSpeed * 0.05) // Increased force for better responsiveness

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
    // Sync mesh position with physics body (don't override physics with floating animation)
    this.mesh.position.copy(this.physicsBody.position)

    // Add gentle floating animation to visual representation only
    const time = Date.now() * 0.001
    const floatingOffset = Math.sin(time * 2) * 0.02
    this.mesh.position.y += floatingOffset

    // Add swimming animation to body parts when moving
    if (this.bodyParts && this.isMoving) {
      const swimTime = time * 4 // Faster swimming animation

      // Animate arms - alternating stroke motion
      this.bodyParts.leftArm.rotation.x = Math.sin(swimTime) * 0.5
      this.bodyParts.rightArm.rotation.x = Math.sin(swimTime + Math.PI) * 0.5

      // Animate legs - flutter kick motion
      this.bodyParts.leftLeg.rotation.x = Math.sin(swimTime * 1.5) * 0.3
      this.bodyParts.rightLeg.rotation.x =
        Math.sin(swimTime * 1.5 + Math.PI) * 0.3
    } else if (this.bodyParts) {
      // Gentle idle animation when not moving
      const idleTime = time * 0.5
      this.bodyParts.leftArm.rotation.x = Math.sin(idleTime) * 0.1
      this.bodyParts.rightArm.rotation.x = Math.sin(idleTime + Math.PI) * 0.1
      this.bodyParts.leftLeg.rotation.x = Math.sin(idleTime * 0.8) * 0.05
      this.bodyParts.rightLeg.rotation.x =
        Math.sin(idleTime * 0.8 + Math.PI) * 0.05
    }

    // Don't update physics body position from mesh - let physics handle position
    // The physics body position should be authoritative
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
    // Return physics body position (authoritative) instead of mesh position (includes floating animation)
    return this.physicsBody.position.clone()
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

    // Dispose geometry and material for the group
    if (this.mesh.children) {
      this.mesh.children.forEach(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    } else {
      // Fallback for simple mesh (backward compatibility)
      if (this.mesh.geometry) this.mesh.geometry.dispose()
      if (this.mesh.material) this.mesh.material.dispose()
    }
  }
}
