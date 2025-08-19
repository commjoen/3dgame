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
    
    // Glowing material with emissive properties
    const gateMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x006666,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    })
    
    this.gateMesh = new THREE.Mesh(gateGeometry, gateMaterial)
    this.gateMesh.position.copy(this.position)
    this.gateMesh.castShadow = true
    this.gateMesh.receiveShadow = true
    
    // Create inner portal effect
    const portalGeometry = new THREE.PlaneGeometry(this.width * 1.5, this.height)
    const portalMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    })
    
    this.portalMesh = new THREE.Mesh(portalGeometry, portalMaterial)
    this.portalMesh.position.copy(this.position)
    
    // Create gate light source
    this.gateLight = new THREE.PointLight(0x00ffff, 0.5, 20)
    this.gateLight.position.copy(this.position)
    this.gateLight.position.z += 1
    
    // Add to scene (initially invisible until activated)
    this.setVisibility(false)
  }
  
  /**
   * Create physics body for collision detection
   */
  createPhysicsBody() {
    const gateSize = new THREE.Vector3(this.width * 2, this.height, this.depth)
    this.physicsBody = this.physicsEngine.createBoxBody(
      this.position,
      gateSize,
      true // Static - gates don't move
    )
    this.physicsBody.type = 'gate'
    this.physicsBody.gate = this
    this.physicsEngine.addRigidBody(this.physicsBody)
  }
  
  /**
   * Activate the gate (make it visible and interactive)
   */
  activate() {
    if (this.isActivated) return
    
    this.isActivated = true
    this.setVisibility(true)
    
    // Enhanced activation effects
    this.gateMesh.material.emissiveIntensity = 0.6
    this.gateLight.intensity = 1.0
    
    console.log('✨ Gate activated!')
  }
  
  /**
   * Deactivate the gate
   */
  deactivate() {
    this.isActivated = false
    this.setVisibility(false)
    this.gateMesh.material.emissiveIntensity = 0.3
    this.gateLight.intensity = 0.5
  }
  
  /**
   * Set gate visibility
   */
  setVisibility(visible) {
    if (visible) {
      this.scene.add(this.gateMesh)
      this.scene.add(this.portalMesh) 
      this.scene.add(this.gateLight)
    } else {
      this.scene.remove(this.gateMesh)
      this.scene.remove(this.portalMesh)
      this.scene.remove(this.gateLight)
    }
  }
  
  /**
   * Handle player collision with gate
   */
  onPlayerEnter() {
    if (!this.isActivated || this.isCollected) return false
    
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
    if (!this.isActivated) return
    
    this.time += deltaTime
    
    // Pulsing glow effect
    const pulseIntensity = 0.3 + Math.sin(this.time * this.pulseSpeed * 10) * 0.2
    this.gateMesh.material.emissiveIntensity = pulseIntensity
    this.gateLight.intensity = 0.5 + pulseIntensity
    
    // Gentle rotation
    this.gateMesh.rotation.z += this.rotationSpeed
    
    // Portal shimmer effect
    this.portalMesh.material.opacity = 0.1 + Math.sin(this.time * this.pulseSpeed * 15) * 0.1
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
    // Remove from physics engine
    this.physicsEngine.removeRigidBody(this.physicsBody)
    
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