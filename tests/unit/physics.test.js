import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import {
  PhysicsEngine,
  CollisionSystem,
  UnderwaterPhysics,
} from '../../src/core/Physics.js'

describe('Physics Engine', () => {
  let physicsEngine

  beforeEach(() => {
    physicsEngine = new PhysicsEngine()
  })

  describe('CollisionSystem', () => {
    let collisionSystem

    beforeEach(() => {
      collisionSystem = new CollisionSystem()
    })

    it('should detect sphere-sphere collision', () => {
      const sphereA = {
        position: new THREE.Vector3(0, 0, 0),
        collisionType: 'sphere',
        radius: 1,
      }

      const sphereB = {
        position: new THREE.Vector3(1.5, 0, 0),
        collisionType: 'sphere',
        radius: 1,
      }

      const colliding = collisionSystem.checkCollision(sphereA, sphereB)
      expect(colliding).toBe(true)
    })

    it('should not detect sphere collision when far apart', () => {
      const sphereA = {
        position: new THREE.Vector3(0, 0, 0),
        collisionType: 'sphere',
        radius: 1,
      }

      const sphereB = {
        position: new THREE.Vector3(5, 0, 0),
        collisionType: 'sphere',
        radius: 1,
      }

      const colliding = collisionSystem.checkCollision(sphereA, sphereB)
      expect(colliding).toBe(false)
    })

    it('should detect AABB-AABB collision', () => {
      const boxA = {
        position: new THREE.Vector3(0, 0, 0),
        collisionType: 'box',
        size: new THREE.Vector3(2, 2, 2),
      }

      const boxB = {
        position: new THREE.Vector3(1, 0, 0),
        collisionType: 'box',
        size: new THREE.Vector3(2, 2, 2),
      }

      const colliding = collisionSystem.checkCollision(boxA, boxB)
      expect(colliding).toBe(true)
    })

    it('should detect sphere-AABB collision', () => {
      const sphere = {
        position: new THREE.Vector3(0, 0, 0),
        collisionType: 'sphere',
        radius: 1,
      }

      const box = {
        position: new THREE.Vector3(1.5, 0, 0),
        collisionType: 'box',
        size: new THREE.Vector3(1, 1, 1),
      }

      const colliding = collisionSystem.checkCollision(sphere, box)
      expect(colliding).toBe(true)
    })

    it('should add and remove colliders correctly', () => {
      const collider = {
        position: new THREE.Vector3(0, 0, 0),
        collisionType: 'sphere',
        radius: 1,
      }

      expect(collisionSystem.colliders.length).toBe(0)

      collisionSystem.addCollider(collider)
      expect(collisionSystem.colliders.length).toBe(1)

      collisionSystem.removeCollider(collider)
      expect(collisionSystem.colliders.length).toBe(0)
    })

    it('should handle static colliders separately', () => {
      const dynamicCollider = {
        position: new THREE.Vector3(0, 0, 0),
        collisionType: 'sphere',
        radius: 1,
      }

      const staticCollider = {
        position: new THREE.Vector3(2, 0, 0),
        collisionType: 'sphere',
        radius: 1,
      }

      collisionSystem.addCollider(dynamicCollider, false)
      collisionSystem.addCollider(staticCollider, true)

      expect(collisionSystem.colliders.length).toBe(1)
      expect(collisionSystem.staticColliders.length).toBe(1)
    })
  })

  describe('UnderwaterPhysics', () => {
    let underwaterPhysics

    beforeEach(() => {
      underwaterPhysics = new UnderwaterPhysics()
    })

    it('should apply buoyancy force', () => {
      const body = {
        velocity: new THREE.Vector3(0, 0, 0),
      }

      const deltaTime = 0.016 // ~60fps
      underwaterPhysics.applyBuoyancy(body, deltaTime)

      expect(body.velocity.y).toBeGreaterThan(0)
    })

    it('should apply drag to reduce velocity', () => {
      const body = {
        velocity: new THREE.Vector3(5, 5, 5),
      }

      const originalMagnitude = body.velocity.length()
      underwaterPhysics.applyDrag(body, 0.016)

      expect(body.velocity.length()).toBeLessThan(originalMagnitude)
    })

    it('should apply current forces', () => {
      const body = {
        velocity: new THREE.Vector3(0, 0, 0),
      }

      const deltaTime = 0.016
      underwaterPhysics.applyCurrent(body, 1.0, deltaTime)

      // Should have some velocity from current
      expect(body.velocity.length()).toBeGreaterThan(0)
    })

    it('should apply all underwater effects', () => {
      const body = {
        velocity: new THREE.Vector3(1, -1, 1),
      }

      const originalVelocity = body.velocity.clone()
      underwaterPhysics.applyUnderwaterEffects(body, 0.016)

      // Velocity should change due to buoyancy, drag, and current
      expect(body.velocity.equals(originalVelocity)).toBe(false)
    })
  })

  describe('PhysicsEngine Integration', () => {
    it('should create sphere bodies correctly', () => {
      const position = new THREE.Vector3(1, 2, 3)
      const radius = 2

      const body = physicsEngine.createSphereBody(position, radius, false)

      expect(body.position.equals(position)).toBe(true)
      expect(body.radius).toBe(radius)
      expect(body.collisionType).toBe('sphere')
      expect(body.isStatic).toBe(false)
      expect(body.velocity).toBeInstanceOf(THREE.Vector3)
    })

    it('should create box bodies correctly', () => {
      const position = new THREE.Vector3(1, 2, 3)
      const size = new THREE.Vector3(2, 2, 2)

      const body = physicsEngine.createBoxBody(position, size, true)

      expect(body.position.equals(position)).toBe(true)
      expect(body.size.equals(size)).toBe(true)
      expect(body.collisionType).toBe('box')
      expect(body.isStatic).toBe(true)
    })

    it('should add and remove rigid bodies', () => {
      const body = physicsEngine.createSphereBody(new THREE.Vector3(), 1)

      expect(physicsEngine.rigidBodies.length).toBe(0)

      physicsEngine.addRigidBody(body)
      expect(physicsEngine.rigidBodies.length).toBe(1)

      physicsEngine.removeRigidBody(body)
      expect(physicsEngine.rigidBodies.length).toBe(0)
    })

    it('should update physics bodies', () => {
      const body = physicsEngine.createSphereBody(new THREE.Vector3(0, 0, 0), 1)
      body.velocity.set(1, 0, 0)

      physicsEngine.addRigidBody(body)

      const originalPosition = body.position.clone()
      physicsEngine.update(0.1) // 100ms update

      // Position should change due to velocity
      expect(body.position.equals(originalPosition)).toBe(false)
      expect(body.position.x).toBeGreaterThan(originalPosition.x)
    })

    it('should not update static bodies', () => {
      const body = physicsEngine.createSphereBody(
        new THREE.Vector3(0, 0, 0),
        1,
        true
      )
      body.velocity.set(1, 1, 1)

      physicsEngine.addRigidBody(body)

      const originalPosition = body.position.clone()
      physicsEngine.update(0.1)

      // Static body should not move
      expect(body.position.equals(originalPosition)).toBe(true)
    })

    it('should handle collisions and resolve them', () => {
      // Create two overlapping spheres
      const bodyA = physicsEngine.createSphereBody(
        new THREE.Vector3(0, 0, 0),
        1
      )
      const bodyB = physicsEngine.createSphereBody(
        new THREE.Vector3(1, 0, 0),
        1,
        true
      )

      bodyA.velocity.set(1, 0, 0) // Moving towards bodyB

      physicsEngine.addRigidBody(bodyA)
      physicsEngine.addRigidBody(bodyB)

      // Update physics - should detect and resolve collision
      physicsEngine.update(0.1)

      // Velocity should be reduced due to collision
      expect(bodyA.velocity.length()).toBeLessThan(1)
    })

    it('should apply underwater physics effects', () => {
      const body = physicsEngine.createSphereBody(new THREE.Vector3(0, 0, 0), 1)
      physicsEngine.addRigidBody(body)

      // Should start with no velocity
      expect(body.velocity.length()).toBe(0)

      physicsEngine.update(0.1)

      // Should have some velocity from underwater effects (buoyancy, current)
      expect(body.velocity.length()).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero delta time', () => {
      const body = physicsEngine.createSphereBody(new THREE.Vector3(0, 0, 0), 1)
      body.velocity.set(1, 1, 1)
      physicsEngine.addRigidBody(body)

      const originalPosition = body.position.clone()
      physicsEngine.update(0) // Zero delta time

      // Position should not change with zero delta time
      expect(body.position.equals(originalPosition)).toBe(true)
    })

    it('should handle collision with identical positions', () => {
      const sphereA = {
        position: new THREE.Vector3(0, 0, 0),
        collisionType: 'sphere',
        radius: 1,
      }

      const sphereB = {
        position: new THREE.Vector3(0, 0, 0), // Same position
        collisionType: 'sphere',
        radius: 1,
      }

      const colliding = physicsEngine.collisionSystem.checkCollision(
        sphereA,
        sphereB
      )
      expect(colliding).toBe(true)
    })

    it('should handle very small collision bodies', () => {
      const sphereA = {
        position: new THREE.Vector3(0, 0, 0),
        collisionType: 'sphere',
        radius: 0.001,
      }

      const sphereB = {
        position: new THREE.Vector3(0.0015, 0, 0),
        collisionType: 'sphere',
        radius: 0.001,
      }

      const colliding = physicsEngine.collisionSystem.checkCollision(
        sphereA,
        sphereB
      )
      expect(colliding).toBe(true)
    })
  })
})
