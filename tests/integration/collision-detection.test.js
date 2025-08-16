import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import { Player } from '../../src/components/Player.js'
import { PhysicsEngine } from '../../src/core/Physics.js'

describe('Collision Detection Integration', () => {
  let scene, physicsEngine, player

  beforeEach(() => {
    // Mock Three.js scene
    scene = {
      add: vi.fn(),
      remove: vi.fn(),
    }

    physicsEngine = new PhysicsEngine()
    player = new Player(scene, physicsEngine)
  })

  it('should detect collision between player and environment objects', () => {
    // Create an obstacle near the player
    const obstacle = physicsEngine.createSphereBody(
      new THREE.Vector3(1, 0, 0), // Close to player at origin
      1, // radius
      true // static
    )
    obstacle.type = 'environment'
    physicsEngine.addRigidBody(obstacle)

    // Move player towards obstacle
    player.setPosition(new THREE.Vector3(0.5, 0, 0))

    // Check collision
    const collisions = physicsEngine.collisionSystem.checkCollisions(player.physicsBody)
    
    expect(collisions.length).toBeGreaterThan(0)
    expect(collisions[0].type).toBe('environment')
  })

  it('should detect collision between player and collectibles', () => {
    // Create a collectible near the player
    const collectible = physicsEngine.createSphereBody(
      new THREE.Vector3(0.5, 0, 0),
      0.5, // radius
      true // static
    )
    collectible.type = 'collectible'
    physicsEngine.addRigidBody(collectible)

    // Player starts at origin, should collide with collectible
    const collisions = physicsEngine.collisionSystem.checkCollisions(player.physicsBody)
    
    expect(collisions.length).toBeGreaterThan(0)
    expect(collisions[0].type).toBe('collectible')
  })

  it('should not detect collision when objects are far apart', () => {
    // Create an obstacle far from the player
    const obstacle = physicsEngine.createSphereBody(
      new THREE.Vector3(10, 0, 0), // Far from player at origin
      1, // radius
      true // static
    )
    obstacle.type = 'environment'
    physicsEngine.addRigidBody(obstacle)

    // Check collision - should be none
    const collisions = physicsEngine.collisionSystem.checkCollisions(player.physicsBody)
    
    expect(collisions.length).toBe(0)
  })

  it('should handle player movement with physics', () => {
    const initialPosition = player.getPosition()
    
    // Simulate movement input
    const inputState = {
      keys: { forward: true },
      joystick: { x: 0, y: 0 },
      mobileButtons: { swimUp: false, swimDown: false }
    }

    // Update player
    player.handleInput(inputState)
    
    // Player should have some velocity after input
    const velocity = player.getVelocity()
    expect(velocity.length()).toBeGreaterThan(0)
  })

  it('should apply underwater physics effects', () => {
    const initialVelocity = new THREE.Vector3(0, -1, 0) // Downward velocity
    player.physicsBody.velocity.copy(initialVelocity)

    // Update physics (underwater should apply buoyancy)
    physicsEngine.update(0.1)

    // After underwater physics, y-velocity should be less negative (buoyancy effect)
    expect(player.physicsBody.velocity.y).toBeGreaterThan(initialVelocity.y)
  })

  it('should resolve collisions by preventing penetration', () => {
    // Place player and obstacle overlapping
    player.setPosition(new THREE.Vector3(0, 0, 0))
    
    const obstacle = physicsEngine.createSphereBody(
      new THREE.Vector3(0.5, 0, 0), // Overlapping with player
      1, // Large radius to ensure overlap
      true // static
    )
    obstacle.type = 'environment'
    physicsEngine.addRigidBody(obstacle)

    // Give player velocity towards obstacle
    player.physicsBody.velocity.set(1, 0, 0)
    
    const initialPosition = player.getPosition()
    
    // Update physics - should resolve collision
    physicsEngine.update(0.1)
    
    // Player should have moved back or velocity reduced due to collision
    const finalVelocity = player.getVelocity()
    expect(finalVelocity.length()).toBeLessThan(1) // Velocity should be reduced
  })

  it('should handle multiple simultaneous collisions', () => {
    // Create multiple obstacles around the player
    const obstacles = []
    for (let i = 0; i < 3; i++) {
      const obstacle = physicsEngine.createSphereBody(
        new THREE.Vector3(
          Math.cos(i * Math.PI * 2 / 3) * 1.5,
          0,
          Math.sin(i * Math.PI * 2 / 3) * 1.5
        ),
        1, // radius
        true // static
      )
      obstacle.type = 'environment'
      physicsEngine.addRigidBody(obstacle)
      obstacles.push(obstacle)
    }

    // Check collisions - player at origin should collide with multiple obstacles
    const collisions = physicsEngine.collisionSystem.checkCollisions(player.physicsBody)
    
    expect(collisions.length).toBeGreaterThan(0)
    // All colliding objects should be environment type
    collisions.forEach(collision => {
      expect(collision.type).toBe('environment')
    })
  })

  it('should maintain performance with many collision objects', () => {
    // Create many static collision objects
    const startTime = performance.now()
    
    for (let i = 0; i < 100; i++) {
      const object = physicsEngine.createSphereBody(
        new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        0.5,
        true
      )
      object.type = 'environment'
      physicsEngine.addRigidBody(object)
    }
    
    // Check collision performance
    const collisionStartTime = performance.now()
    physicsEngine.collisionSystem.checkCollisions(player.physicsBody)
    const collisionEndTime = performance.now()
    
    const collisionTime = collisionEndTime - collisionStartTime
    
    // Collision detection should be fast (less than 10ms even with 100 objects)
    expect(collisionTime).toBeLessThan(10)
  })
})