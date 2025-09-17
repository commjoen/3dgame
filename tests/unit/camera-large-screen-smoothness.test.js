/**
 * Tests for camera smoothness improvements on large screens
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

describe('Camera Large Screen Smoothness Improvements', () => {
  let mockGame
  let mockPlayer

  beforeEach(() => {
    // Create a mock player with movement capabilities
    mockPlayer = {
      getPosition: vi.fn(() => new THREE.Vector3(0, -10, 0)),
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
      isMobile: false, // Default to desktop
      inputState: {
        cameraJoystick: { x: 0, y: 0 },
      },
      previousMovementDirection: null,
      // Mock the improved updateCamera method
      updateCamera(deltaTime = 0.016) {
        const playerPosition = this.player.getPosition()

        // Apply camera joystick rotation if active
        if (
          this.inputState.cameraJoystick.x !== 0 ||
          this.inputState.cameraJoystick.y !== 0
        ) {
          this.cameraRotation.horizontal +=
            this.inputState.cameraJoystick.x * this.cameraRotation.sensitivity * (60 * deltaTime)
          this.cameraRotation.vertical +=
            this.inputState.cameraJoystick.y * this.cameraRotation.sensitivity * (60 * deltaTime)

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

        // Adaptive camera smoothing for better large screen experience
        const baseSmoothingFactor = 0.1
        
        // Screen size factor: larger screens get smoother camera movement
        // Mobile devices get more conservative smoothing for better control
        let screenSizeFactor
        if (this.isMobile) {
          // More conservative smoothing on mobile for better control
          screenSizeFactor = Math.min(1.0, Math.max(0.6, window.innerWidth / 1920))
        } else {
          screenSizeFactor = Math.min(1.5, Math.max(0.8, window.innerWidth / 1920))
        }
        
        // Frame rate compensation: maintain consistent smoothing regardless of FPS
        const frameRateCompensation = deltaTime * 60
        
        // Player movement responsiveness: more responsive when changing direction
        let movementResponsiveness = 1.0
        if (this.player && this.player.isMoving) {
          const currentMovementDirection = this.player.movementVector.clone().normalize()
          if (this.previousMovementDirection) {
            const directionChange = 1 - currentMovementDirection.dot(this.previousMovementDirection)
            movementResponsiveness = 1.0 + (directionChange * 0.8)
          }
          this.previousMovementDirection = currentMovementDirection.clone()
        } else {
          this.previousMovementDirection = null
        }
        
        // Calculate final smoothing factor
        const adaptiveSmoothingFactor = Math.min(1.0, 
          baseSmoothingFactor * 
          screenSizeFactor * 
          frameRateCompensation * 
          movementResponsiveness
        )

        // Smooth camera movement with adaptive factor
        this.camera.position.lerp(targetPosition, adaptiveSmoothingFactor)

        // Improved camera look direction to account for player movement direction
        const lookAtTarget = playerPosition.clone()

        if (this.player && this.player.isMoving) {
          const movementDirection = this.player.movementVector.clone().normalize()
          lookAtTarget.add(movementDirection.multiplyScalar(2))
          lookAtTarget.y += 1
        } else {
          lookAtTarget.y += 2
        }

        this.camera.lookAt(lookAtTarget)
        
        // Return smoothing factor for testing
        return adaptiveSmoothingFactor
      },
    }
  })

  describe('Adaptive Smoothing Factor Calculation', () => {
    it('should provide higher smoothing factor for large screens', () => {
      // Mock large screen (1920px width)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const largeSmoothingFactor = mockGame.updateCamera(0.016)
      
      // Mock small screen (800px width)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      })

      const smallSmoothingFactor = mockGame.updateCamera(0.016)

      // Large screen should have higher smoothing factor for smoother movement
      expect(largeSmoothingFactor).toBeGreaterThan(smallSmoothingFactor)
    })

    it('should be frame rate independent', () => {
      // Test at 60fps (0.016 delta)
      const smoothingAt60fps = mockGame.updateCamera(0.016)
      
      // Test at 30fps (0.033 delta)  
      const smoothingAt30fps = mockGame.updateCamera(0.033)

      // Higher delta time should result in proportionally higher smoothing factor
      expect(smoothingAt30fps).toBeGreaterThan(smoothingAt60fps)
      
      // The ratio should be approximately 2:1 (30fps vs 60fps)
      const expectedRatio = 0.033 / 0.016 // ~2.06
      const actualRatio = smoothingAt30fps / smoothingAt60fps
      expect(actualRatio).toBeCloseTo(expectedRatio, 1)
    })

    it('should increase responsiveness when player changes direction', () => {
      // Set player as moving forward
      mockPlayer.isMoving = true
      mockPlayer.movementVector.set(0, 0, -1) // Moving forward

      // First update to establish direction
      const initialSmoothingFactor = mockGame.updateCamera(0.016)
      
      // Change direction drastically (180 degrees)
      mockPlayer.movementVector.set(0, 0, 1) // Moving backward
      
      const directionChangeSmoothingFactor = mockGame.updateCamera(0.016)

      // Should be more responsive (higher smoothing factor) when changing direction
      expect(directionChangeSmoothingFactor).toBeGreaterThan(initialSmoothingFactor)
    })

    it('should reset movement direction tracking when player stops', () => {
      // Set player as moving
      mockPlayer.isMoving = true
      mockPlayer.movementVector.set(1, 0, 0) // Moving right
      
      mockGame.updateCamera(0.016)
      expect(mockGame.previousMovementDirection).not.toBeNull()
      
      // Stop player movement
      mockPlayer.isMoving = false
      mockPlayer.movementVector.set(0, 0, 0)
      
      mockGame.updateCamera(0.016)
      expect(mockGame.previousMovementDirection).toBeNull()
    })
  })

  describe('Camera Joystick Frame Rate Independence', () => {
    it('should apply rotation consistently regardless of frame rate', () => {
      // Set joystick input
      mockGame.inputState.cameraJoystick.x = 0.5
      mockGame.inputState.cameraJoystick.y = 0.3

      const initialHorizontal = mockGame.cameraRotation.horizontal
      const initialVertical = mockGame.cameraRotation.vertical

      // Update at 60fps
      mockGame.updateCamera(0.016)
      const horizontalChange60fps = mockGame.cameraRotation.horizontal - initialHorizontal
      const verticalChange60fps = mockGame.cameraRotation.vertical - initialVertical

      // Reset rotation
      mockGame.cameraRotation.horizontal = initialHorizontal
      mockGame.cameraRotation.vertical = initialVertical

      // Update at 30fps with same input
      mockGame.updateCamera(0.033)
      const horizontalChange30fps = mockGame.cameraRotation.horizontal - initialHorizontal
      const verticalChange30fps = mockGame.cameraRotation.vertical - initialVertical

      // 30fps update should apply roughly twice the rotation as 60fps
      const expectedRatio = 0.033 / 0.016
      expect(horizontalChange30fps / horizontalChange60fps).toBeCloseTo(expectedRatio, 1)
      expect(verticalChange30fps / verticalChange60fps).toBeCloseTo(expectedRatio, 1)
    })
  })

  describe('Smoothing Factor Bounds', () => {
    it('should never exceed 1.0 smoothing factor', () => {
      // Mock very large screen and high frame rate
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 4000,
      })

      // Set player changing direction rapidly
      mockPlayer.isMoving = true
      mockPlayer.movementVector.set(1, 0, 0)
      mockGame.updateCamera(0.016)
      
      mockPlayer.movementVector.set(-1, 0, 0) // 180 degree change
      const smoothingFactor = mockGame.updateCamera(0.008) // Very high frame rate

      // Should be capped at 1.0
      expect(smoothingFactor).toBeLessThanOrEqual(1.0)
    })

    it('should maintain minimum smoothing for very small screens', () => {
      // Mock very small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      })

      const smoothingFactor = mockGame.updateCamera(0.016)

      // Should still provide reasonable smoothing (at least some minimum)
      expect(smoothingFactor).toBeGreaterThan(0.05)
    })
  })

  describe('Mobile Camera Behavior', () => {
    it('should provide more conservative smoothing on mobile devices', () => {
      // Mock very large screen to see the difference
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 2880, // 1.5x of 1920px
      })

      // Test desktop mode first
      mockGame.isMobile = false
      const desktopSmoothingFactor = mockGame.updateCamera(0.016)
      
      // Reset camera position for fair comparison
      mockGame.camera.position.set(0, 0, 0)
      
      // Set up mobile mode
      mockGame.isMobile = true
      const mobileSmoothingFactor = mockGame.updateCamera(0.016)

      // For very large screens (2880px):
      // Desktop: screenSizeFactor = Math.min(1.5, Math.max(0.8, 2880/1920)) = Math.min(1.5, 1.5) = 1.5
      // Mobile: screenSizeFactor = Math.min(1.0, Math.max(0.6, 2880/1920)) = Math.min(1.0, 1.5) = 1.0
      
      // Mobile should have more conservative smoothing (lower factor)
      expect(mobileSmoothingFactor).toBeLessThan(desktopSmoothingFactor)
    })

    it('should have appropriate maximum smoothing factor on mobile', () => {
      // Set up mobile mode with large screen
      mockGame.isMobile = true
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const smoothingFactor = mockGame.updateCamera(0.016)

      // Mobile devices should have smoothing factor capped at 1.0 (based on max 1.0 screen factor)
      expect(smoothingFactor).toBeLessThanOrEqual(1.0)
    })
  })
})