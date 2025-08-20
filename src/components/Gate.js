/**
 * Gate Component for Ocean Adventure
 *
 * Represents the glowing portal gates that players must swim through
 * to complete levels after collecting all stars.
 */

import * as THREE from 'three'

export class Gate {
  constructor(scene, physicsEngine, position = new THREE.Vector3(0, 0, -15)) {
    this.scene = scene
    this.physicsEngine = physicsEngine
    this.position = position.clone()

    // Gate properties
    this.width = 4
    this.height = 6
    this.depth = 0.5
    this.isActivated = false
    this.isCollected = false

    // Animation properties
    this.pulseSpeed = 0.02
    this.rotationSpeed = 0.01
    this.time = 0

    // Create gate mesh and physics body
    this.createGateMesh()
    this.createPhysicsBody()

    console.log('🚪 Gate created at position:', position)
  }

  /**
   * Create the visual representation of the gate
   */
  createGateMesh() {
    // Create gate frame (torus shape for portal effect)
    const gateGeometry = new THREE.TorusGeometry(this.width, 0.3, 8, 32)

    // Enhanced glowing material with stronger emissive properties
    const gateMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x006666,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      shininess: 100,
    })

    this.gateMesh = new THREE.Mesh(gateGeometry, gateMaterial)
    this.gateMesh.position.copy(this.position)
    this.gateMesh.castShadow = true
    this.gateMesh.receiveShadow = true

    // Create inner portal effect with enhanced materials
    const portalGeometry = new THREE.PlaneGeometry(
      this.width * 1.5,
      this.height
    )
    const portalMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    })

    this.portalMesh = new THREE.Mesh(portalGeometry, portalMaterial)
    this.portalMesh.position.copy(this.position)

    // Create multiple enhanced light sources for better illumination
    this.gateLight = new THREE.PointLight(0x00ffff, 1.0, 25)
    this.gateLight.position.copy(this.position)
    this.gateLight.position.z += 1

    // Add secondary lights for rim lighting effect
    this.rimLights = []
    const numRimLights = 6
    for (let i = 0; i < numRimLights; i++) {
      const angle = (i / numRimLights) * Math.PI * 2
      const rimLight = new THREE.PointLight(0x0088ff, 0.3, 10)
      const lightRadius = this.width * 1.2
      rimLight.position.set(
        this.position.x + Math.cos(angle) * lightRadius,
        this.position.y + Math.sin(angle) * lightRadius * 0.7,
        this.position.z + (Math.random() - 0.5) * 2
      )
      rimLight.userData = {
        originalAngle: angle,
        animationOffset: Math.random() * Math.PI * 2,
      }
      this.rimLights.push(rimLight)
    }

    // Add to scene (initially invisible until activated)
    this.setVisibility(false)
  }

  /**
   * Create physics body for collision detection
   * Using a ring shape instead of a solid box to allow swimming through
   */
  createPhysicsBody() {
    // Create multiple collision bodies around the ring
    // This allows detection when player touches the gate frame but can swim through the center
    this.physicsBody = []

    const ringRadius = this.width
    const segments = 8

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle) * ringRadius
      const y = Math.sin(angle) * ringRadius * 0.7 // Make it more oval for height

      const segmentPosition = this.position.clone()
      segmentPosition.x += x
      segmentPosition.y += y

      const segmentBody = this.physicsEngine.createSphereBody(
        segmentPosition,
        0.8, // Collision radius for each segment
        true // Static - gates don't move
      )
      segmentBody.type = 'gate'
      segmentBody.gate = this
      this.physicsEngine.addRigidBody(segmentBody)
      this.physicsBody.push(segmentBody)
    }
  }

  /**
   * Activate the gate (make it visible and interactive)
   */
  activate() {
    if (this.isActivated) {
      return
    }

    this.isActivated = true
    this.setVisibility(true)

    // Enhanced activation effects
    this.gateMesh.material.emissiveIntensity = 0.8
    this.gateLight.intensity = 1.5

    // Activate rim lights
    this.rimLights.forEach(light => {
      light.intensity = 0.4
    })

    console.log('✨ Gate activated!')
  }

  /**
   * Deactivate the gate
   */
  deactivate() {
    this.isActivated = false
    this.setVisibility(false)
    this.gateMesh.material.emissiveIntensity = 0.5
    this.gateLight.intensity = 1.0

    // Deactivate rim lights
    this.rimLights.forEach(light => {
      light.intensity = 0.1
    })
  }

  /**
   * Set gate visibility
   */
  setVisibility(visible) {
    if (visible) {
      this.scene.add(this.gateMesh)
      this.scene.add(this.portalMesh)
      this.scene.add(this.gateLight)
      // Add rim lights
      this.rimLights.forEach(light => this.scene.add(light))
    } else {
      this.scene.remove(this.gateMesh)
      this.scene.remove(this.portalMesh)
      this.scene.remove(this.gateLight)
      // Remove rim lights
      this.rimLights.forEach(light => this.scene.remove(light))
    }
  }

  /**
   * Handle player collision with gate
   */
  onPlayerEnter() {
    if (!this.isActivated || this.isCollected) {
      return false
    }

    this.isCollected = true
    console.log('🎯 Player entered gate - Level Complete!')

    // Gate completion effects
    this.gateMesh.material.emissiveIntensity = 1.0
    this.gateLight.intensity = 2.0

    return true
  }

  /**
   * Update gate animations and effects
   */
  update(deltaTime) {
    if (!this.isActivated) {
      return
    }

    this.time += deltaTime

    // Enhanced pulsing glow effect
    const pulseIntensity =
      0.4 + Math.sin(this.time * this.pulseSpeed * 10) * 0.3
    this.gateMesh.material.emissiveIntensity = pulseIntensity
    this.gateLight.intensity = 0.8 + pulseIntensity

    // Gentle rotation
    this.gateMesh.rotation.z += this.rotationSpeed

    // Enhanced portal shimmer effect
    this.portalMesh.material.opacity =
      0.2 + Math.sin(this.time * this.pulseSpeed * 15) * 0.2

    // Animate rim lights for dynamic lighting
    this.rimLights.forEach((light, index) => {
      const userData = light.userData
      const animationTime = this.time * 0.5 + userData.animationOffset

      // Create pulsing effect with phase offset for each light
      const pulseFactor = 0.2 + Math.sin(animationTime + index * 0.5) * 0.2
      light.intensity = pulseFactor

      // Slight movement for dynamic effect
      const lightRadius = this.width * 1.2
      const wobble = Math.sin(animationTime * 2) * 0.1
      light.position.set(
        this.position.x +
          Math.cos(userData.originalAngle) * (lightRadius + wobble),
        this.position.y +
          Math.sin(userData.originalAngle) * (lightRadius + wobble) * 0.7,
        this.position.z + Math.sin(animationTime * 3) * 0.5
      )
    })
  }

  /**
   * Get gate position
   */
  getPosition() {
    return this.position.clone()
  }

  /**
   * Check if gate is activated
   */
  getIsActivated() {
    return this.isActivated
  }

  /**
   * Check if gate has been collected (level completed)
   */
  getIsCollected() {
    return this.isCollected
  }

  /**
   * Reset gate for new level
   */
  reset() {
    this.isCollected = false
    this.deactivate()
    this.time = 0
  }

  /**
   * Dispose of gate resources
   */
  dispose() {
    // Remove from physics engine - handle array of physics bodies
    if (Array.isArray(this.physicsBody)) {
      this.physicsBody.forEach(body => {
        this.physicsEngine.removeRigidBody(body)
      })
    } else if (this.physicsBody) {
      this.physicsEngine.removeRigidBody(this.physicsBody)
    }

    // Remove from scene
    this.setVisibility(false)

    // Dispose geometry and materials
    if (this.gateMesh) {
      this.gateMesh.geometry.dispose()
      this.gateMesh.material.dispose()
    }

    if (this.portalMesh) {
      this.portalMesh.geometry.dispose()
      this.portalMesh.material.dispose()
    }

    console.log('🗑️ Gate disposed')
  }
}
