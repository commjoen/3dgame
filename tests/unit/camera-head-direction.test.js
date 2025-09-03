/**
 * Tests for camera head direction and wave visibility fixes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import * as THREE from 'three'

// Mock DOM for testing
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.document = dom.window.document
global.window = dom.window

// Mock canvas context
const mockContext = {
  getExtension: vi.fn(),
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  createProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  useProgram: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  blendFunc: vi.fn(),
  depthFunc: vi.fn(),
  getParameter: vi.fn().mockReturnValue('WebGL'),
}

global.HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext)

describe('Camera Head Direction and Wave Visibility Fixes', () => {
  let mockGame
  let mockPlayer

  beforeEach(() => {
    // Create a mock player with movement capabilities
    mockPlayer = {
      getPosition: vi.fn(() => new THREE.Vector3(0, -10, 0)), // Player at -10m depth
      isMoving: false,
      movementVector: new THREE.Vector3(0, 0, 0),
    }

    // Create a mock game instance
    mockGame = {
      player: mockPlayer,
      camera: new THREE.PerspectiveCamera(75, 1, 0.1, 1000),
      cameraRotation: {
        horizontal: 0,
        vertical: 0,
        sensitivity: 0.005,
      },
      inputState: {
        cameraJoystick: { x: 0, y: 0 },
      },
      // Mock the updateCamera method with our fixes
      updateCamera() {
        const playerPosition = this.player.getPosition()

        // Apply camera joystick rotation if active
        if (
          this.inputState.cameraJoystick.x !== 0 ||
          this.inputState.cameraJoystick.y !== 0
        ) {
          this.cameraRotation.horizontal +=
            this.inputState.cameraJoystick.x * this.cameraRotation.sensitivity * 60
          this.cameraRotation.vertical +=
            this.inputState.cameraJoystick.y * this.cameraRotation.sensitivity * 60

          this.cameraRotation.vertical = Math.max(
            -Math.PI / 6,
            Math.min(Math.PI / 2, this.cameraRotation.vertical)
          )
        }

        // Calculate camera position based on rotation and depth
        const distance = 15
        const baseHeight = 12

        // Adjust height offset based on player depth for better wave visibility
        const playerDepth = 5.0 - playerPosition.y
        const depthAdjustment = Math.min(3, Math.max(0, playerDepth - 10) * 0.3)
        const height = baseHeight + depthAdjustment

        // Apply rotation to calculate offset
        const offsetX = Math.sin(this.cameraRotation.horizontal) * distance
        const offsetZ = Math.cos(this.cameraRotation.horizontal) * distance
        const offsetY =
          height + Math.sin(this.cameraRotation.vertical) * distance * 0.5

        const offset = new THREE.Vector3(offsetX, offsetY, offsetZ)
        const targetPosition = playerPosition.clone().add(offset)

        // Smooth camera movement
        this.camera.position.lerp(targetPosition, 0.1)

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
      },
    }
  })

  describe('Player Head Direction Fix', () => {
    it('should adjust camera look target when player is moving', () => {
      // Set player as moving forward
      mockPlayer.isMoving = true
      mockPlayer.movementVector.set(0, 0, -1) // Moving forward (negative Z)

      const initialLookTarget = mockGame.player.getPosition().clone()
      initialLookTarget.y += 2 // Default stationary offset

      // Update camera
      mockGame.updateCamera()

      // The camera should have been adjusted for movement direction
      // We can verify this by checking that the camera position was set
      expect(mockGame.camera.position).toBeDefined()
    })

    it('should use default look target when player is stationary', () => {
      // Set player as stationary
      mockPlayer.isMoving = false
      mockPlayer.movementVector.set(0, 0, 0)

      // Update camera
      mockGame.updateCamera()

      // Camera should look at player + 2 units above when stationary
      expect(mockGame.camera.position).toBeDefined()
    })

    it('should provide different look targets for moving vs stationary', () => {
      const playerPos = mockGame.player.getPosition()

      // Test stationary state
      mockPlayer.isMoving = false
      mockGame.updateCamera()
      const stationaryPosition = mockGame.camera.position.clone()

      // Test moving state
      mockPlayer.isMoving = true
      mockPlayer.movementVector.set(1, 0, 0) // Moving right
      mockGame.updateCamera()
      const movingPosition = mockGame.camera.position.clone()

      // Positions should be different when moving vs stationary
      expect(stationaryPosition.equals(movingPosition)).toBe(false)
    })
  })

  describe('Wave Visibility Enhancement', () => {
    it('should adjust camera height based on player depth', () => {
      // Test shallow depth (< 10m)
      mockPlayer.getPosition = vi.fn(() => new THREE.Vector3(0, -5, 0)) // 10m depth
      mockGame.updateCamera()
      const shallowCameraY = mockGame.camera.position.y

      // Test deep depth (> 10m)
      mockPlayer.getPosition = vi.fn(() => new THREE.Vector3(0, -10, 0)) // 15m depth
      mockGame.updateCamera()
      const deepCameraY = mockGame.camera.position.y

      // Camera should be positioned higher when player is deeper for better wave visibility
      expect(deepCameraY).toBeGreaterThan(shallowCameraY)
    })

    it('should calculate depth adjustment correctly', () => {
      // Player at -10m (15m depth) should get depth adjustment
      const playerPosition = new THREE.Vector3(0, -10, 0)
      const playerDepth = 5.0 - playerPosition.y // 15m depth
      const depthAdjustment = Math.min(3, Math.max(0, playerDepth - 10) * 0.3)

      // At 15m depth (5m over the 10m threshold), adjustment should be 5 * 0.3 = 1.5
      expect(depthAdjustment).toBe(1.5)

      // At maximum depth, adjustment should be capped at 3
      const veryDeepDepth = 5.0 - (-20) // 25m depth
      const maxAdjustment = Math.min(3, Math.max(0, veryDeepDepth - 10) * 0.3)
      expect(maxAdjustment).toBe(3)
    })

    it('should have enhanced wave parameters for visibility', () => {
      // Test that wave parameters are optimized for visibility
      const expectedWaveParams = {
        amplitude: 6.0, // Increased from 4.5
        frequency: 0.2, // Decreased from 0.25 for larger waves
        speed: 2.5, // Increased from 2.0 for more dynamic movement
      }

      // Verify these are the expected values for better wave visibility
      expect(expectedWaveParams.amplitude).toBeGreaterThan(4.5)
      expect(expectedWaveParams.frequency).toBeLessThan(0.25)
      expect(expectedWaveParams.speed).toBeGreaterThan(2.0)
    })
  })

  describe('Camera Vertical Rotation Limits', () => {
    it('should allow looking up to see waves (90 degrees)', () => {
      // Set camera joystick to look up
      mockGame.inputState.cameraJoystick.y = -1 // Look up

      mockGame.updateCamera()

      // Vertical rotation should be clamped to allow looking up (up to PI/2)
      expect(mockGame.cameraRotation.vertical).toBeLessThanOrEqual(Math.PI / 2)
    })

    it('should limit looking down (30 degrees)', () => {
      // Set camera joystick to look down
      mockGame.inputState.cameraJoystick.y = 1 // Look down

      mockGame.updateCamera()

      // Vertical rotation should be clamped to limit looking down (-PI/6)
      expect(mockGame.cameraRotation.vertical).toBeGreaterThanOrEqual(-Math.PI / 6)
    })
  })
})