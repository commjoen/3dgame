import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { Player } from '../../src/components/Player.js'
import { PhysicsEngine } from '../../src/core/Physics.js'

// Mock Three.js WebGL dependencies for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      getContext: vi.fn().mockReturnValue({}),
      setSize: vi.fn(),
      render: vi.fn(),
    })),
  }
})

describe('Player', () => {
  let mockScene
  let physicsEngine
  let player

  beforeEach(() => {
    // Mock scene
    mockScene = {
      add: vi.fn(),
      remove: vi.fn(),
    }

    // Create physics engine
    physicsEngine = new PhysicsEngine()

    // Create player
    player = new Player(mockScene, physicsEngine)
  })

  describe('Initialization', () => {
    it('should create player mesh and add to scene', () => {
      expect(mockScene.add).toHaveBeenCalled()
      expect(player.mesh).toBeDefined()
      // Player mesh is now a Group with child meshes for body parts
      expect(player.mesh.type).toBe('Group')
      expect(player.mesh.children.length).toBeGreaterThan(0)
      // Check that child meshes have geometry and material
      const childMesh = player.mesh.children[0]
      expect(childMesh.geometry).toBeDefined()
      expect(childMesh.material).toBeDefined()
    })

    it('should create physics body', () => {
      expect(player.physicsBody).toBeDefined()
      expect(player.physicsBody.collisionType).toBe('sphere')
      expect(player.physicsBody.radius).toBe(1.0)
      expect(player.physicsBody.isStatic).toBe(false)
    })

    it('should set initial position underwater', () => {
      const position = player.getPosition()
      expect(position.y).toBe(-8) // Started at Y=-8 (13m underwater from surface at Y=5)
    })

    it('should initialize movement properties', () => {
      expect(player.moveSpeed).toBe(8.0)
      expect(player.rotationSpeed).toBe(3.0)
      expect(player.maxVelocity).toBe(5.0)
      expect(player.isMoving).toBe(false)
    })
  })

  describe('Input Handling', () => {
    it('should handle keyboard input correctly', () => {
      const inputState = {
        keys: {
          forward: true,
          left: true,
          up: true,
        },
        joystick: { x: 0, y: 0 },
        mobileButtons: {},
      }

      player.handleInput(inputState)

      expect(player.isMoving).toBe(true)
      expect(player.movementVector.z).toBeLessThan(0) // Forward movement
      expect(player.movementVector.x).toBeLessThan(0) // Left movement
      expect(player.movementVector.y).toBeGreaterThan(0) // Upward movement
    })

    it('should handle joystick input correctly', () => {
      const inputState = {
        keys: {},
        joystick: { x: 0.5, y: -0.8 },
        mobileButtons: {},
      }

      player.handleInput(inputState)

      expect(player.isMoving).toBe(true)
      expect(player.movementVector.x).toBe(0.5)
      expect(player.movementVector.z).toBe(-0.8)
    })

    it('should handle mobile buttons correctly', () => {
      const inputState = {
        keys: {},
        joystick: { x: 0, y: 0 },
        mobileButtons: {
          swimUp: true,
          swimDown: false,
        },
      }

      player.handleInput(inputState)

      expect(player.isMoving).toBe(true)
      expect(player.movementVector.y).toBe(1)
    })

    it('should normalize diagonal movement', () => {
      const inputState = {
        keys: {
          forward: true,
          right: true,
        },
        joystick: { x: 0, y: 0 },
        mobileButtons: {},
      }

      player.handleInput(inputState)

      // Movement vector should be normalized to prevent faster diagonal movement
      expect(player.movementVector.length()).toBeCloseTo(1, 5)
    })

    it('should stop movement when no input', () => {
      // First set some movement
      const inputStateMoving = {
        keys: { forward: true },
        joystick: { x: 0, y: 0 },
        mobileButtons: {},
      }
      player.handleInput(inputStateMoving)
      expect(player.isMoving).toBe(true)

      // Then stop input
      const inputStateStop = {
        keys: {},
        joystick: { x: 0, y: 0 },
        mobileButtons: {},
      }
      player.handleInput(inputStateStop)
      expect(player.isMoving).toBe(false)
    })
  })

  describe('Movement and Physics', () => {
    it('should apply movement forces to physics body', () => {
      const initialVelocity = player.physicsBody.velocity.clone()

      const inputState = {
        keys: { forward: true },
        joystick: { x: 0, y: 0 },
        mobileButtons: {},
      }

      player.handleInput(inputState)

      // Velocity should change after input
      expect(player.physicsBody.velocity.equals(initialVelocity)).toBe(false)
    })

    it('should respect maximum velocity', () => {
      // Apply very large movement repeatedly
      const inputState = {
        keys: { forward: true },
        joystick: { x: 0, y: 0 },
        mobileButtons: {},
      }

      // Apply movement many times to build up velocity
      for (let i = 0; i < 100; i++) {
        player.handleInput(inputState)
      }

      const velocityMagnitude = player.physicsBody.velocity.length()
      expect(velocityMagnitude).toBeLessThanOrEqual(player.maxVelocity + 0.1) // Small tolerance for floating point
    })

    it('should apply drag when not moving', () => {
      // Set initial velocity
      player.physicsBody.velocity.set(1, 1, 1)
      const initialVelocity = player.physicsBody.velocity.length()

      // Apply no input (should apply drag)
      const inputState = {
        keys: {},
        joystick: { x: 0, y: 0 },
        mobileButtons: {},
      }

      player.handleInput(inputState)

      const finalVelocity = player.physicsBody.velocity.length()
      expect(finalVelocity).toBeLessThan(initialVelocity)
    })

    it('should rotate to face movement direction', () => {
      const initialRotation = player.mesh.rotation.y

      const inputState = {
        keys: { right: true },
        joystick: { x: 0, y: 0 },
        mobileButtons: {},
      }

      player.handleInput(inputState)
      player.update() // Update to apply rotation

      // Rotation should change when moving sideways
      expect(player.mesh.rotation.y).not.toBe(initialRotation)
    })
  })

  describe('Update and Synchronization', () => {
    it('should sync mesh position with physics body', () => {
      // Set physics body position
      const testPosition = new THREE.Vector3(5, 3, -2)
      player.physicsBody.position.copy(testPosition)

      player.update()

      // Mesh position should match physics body (with floating animation offset)
      expect(player.mesh.position.x).toBeCloseTo(testPosition.x, 5)
      expect(player.mesh.position.z).toBeCloseTo(testPosition.z, 5)
      // Y position may differ slightly due to floating animation
      expect(player.mesh.position.y).toBeCloseTo(testPosition.y, 1)
    })

    it('should apply floating animation to visual representation', () => {
      const physicsPosition = player.physicsBody.position.clone()

      player.update()

      // Mesh Y position should include floating animation offset
      const yDifference = Math.abs(player.mesh.position.y - physicsPosition.y)
      expect(yDifference).toBeGreaterThan(0)
      expect(yDifference).toBeLessThan(0.05) // Small floating animation
    })
  })

  describe('Position and Velocity Getters', () => {
    it('should return correct position from physics body', () => {
      const testPosition = new THREE.Vector3(1, 2, 3)
      player.physicsBody.position.copy(testPosition)

      const returnedPosition = player.getPosition()
      expect(returnedPosition.equals(testPosition)).toBe(true)
    })

    it('should return correct velocity', () => {
      const testVelocity = new THREE.Vector3(0.5, -0.3, 1.2)
      player.physicsBody.velocity.copy(testVelocity)

      const returnedVelocity = player.getVelocity()
      expect(returnedVelocity.equals(testVelocity)).toBe(true)
    })

    it('should set position correctly', () => {
      const testPosition = new THREE.Vector3(10, 5, -5)
      player.setPosition(testPosition)

      expect(player.mesh.position.equals(testPosition)).toBe(true)
      expect(player.physicsBody.position.equals(testPosition)).toBe(true)
    })

    it('should detect if player is moving', () => {
      // Initially not moving
      expect(player.getIsMoving()).toBe(false)

      // Set velocity
      player.physicsBody.velocity.set(0.5, 0, 0)
      expect(player.getIsMoving()).toBe(true)

      // Stop velocity
      player.physicsBody.velocity.set(0, 0, 0)
      expect(player.getIsMoving()).toBe(false)
    })
  })

  describe('Collision Handling', () => {
    it('should handle collectible collisions', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const collectible = { type: 'collectible', id: 'star1' }
      player.handleCollisions([collectible])

      expect(consoleSpy).toHaveBeenCalledWith('Player collected item:', collectible)
      consoleSpy.mockRestore()
    })

    it('should bounce away from obstacles', () => {
      const obstacle = {
        type: 'obstacle',
        position: new THREE.Vector3(0, 0, 0),
      }

      player.physicsBody.position.set(1, 0, 0) // Position near obstacle
      const initialVelocity = player.physicsBody.velocity.clone()

      player.handleCollisions([obstacle])

      // Velocity should change due to bounce effect
      expect(player.physicsBody.velocity.equals(initialVelocity)).toBe(false)
    })

    it('should handle environment collisions gracefully', () => {
      const envObject = { type: 'environment' }

      // Should not throw error
      expect(() => player.handleCollisions([envObject])).not.toThrow()
    })
  })

  describe('Resource Management', () => {
    it('should dispose resources properly', () => {
      const removeSpy = vi.spyOn(physicsEngine, 'removeRigidBody').mockImplementation(() => {})

      player.dispose()

      expect(mockScene.remove).toHaveBeenCalledWith(player.mesh)
      expect(removeSpy).toHaveBeenCalledWith(player.physicsBody)

      removeSpy.mockRestore()
    })
  })
})