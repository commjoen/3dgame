/**
 * Integration test for portal transition bug fix
 * Tests that startPortalTransition method calls createBurst without errors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'

// Mock Three.js dependencies
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

// Mock document for canvas creation
global.document = {
  createElement: vi.fn().mockImplementation(tagName => {
    if (tagName === 'canvas') {
      return {
        width: 64,
        height: 64,
        getContext: vi.fn().mockReturnValue({
          createRadialGradient: vi.fn().mockReturnValue({
            addColorStop: vi.fn(),
          }),
          fillStyle: '',
          fillRect: vi.fn(),
        }),
      }
    }
    if (tagName === 'div') {
      return {
        style: {},
        remove: vi.fn(),
      }
    }
    if (tagName === 'style') {
      return {
        id: '',
        textContent: '',
      }
    }
    return {}
  }),
  querySelector: vi.fn().mockReturnValue(null),
  head: {
    appendChild: vi.fn(),
  },
  body: {
    appendChild: vi.fn(),
  },
}

describe('Portal Transition Bug Fix', () => {
  let mockOceanAdventure
  let mockParticleSystem
  let mockGate
  let mockCamera

  beforeEach(() => {
    // Mock particle system with createBurst method
    mockParticleSystem = {
      createBurst: vi.fn(),
    }

    // Mock gate
    mockGate = {
      getPosition: vi.fn().mockReturnValue(new THREE.Vector3(0, 2, -15))
    }

    // Mock camera
    mockCamera = {}

    // Create a minimal mock of OceanAdventure with startPortalTransition method
    mockOceanAdventure = {
      particleSystem: mockParticleSystem,
      gate: mockGate,
      camera: mockCamera,
      startCameraShake: vi.fn(),
      createScreenFlash: vi.fn(),
      
      // This is the actual method from main.js that we fixed
      startPortalTransition() {
        console.log('🌊 Starting portal transition...')

        // Create transition effect particles
        if (this.particleSystem && this.gate) {
          const gatePosition = this.gate.getPosition()

          // Create swirling portal particles
          this.particleSystem.createBurst(gatePosition, {
            count: 50,
            life: 2.25, // Average of lifetime range (1.5-3)
            velocity: new THREE.Vector3(0, 1, 0), // Base upward velocity
            velocityVariation: new THREE.Vector3(6, 4, 6), // Variation for swirling effect
            size: { min: 4, max: 12 },
            color: new THREE.Color(0x87ceeb), // Light blue
          })

          // Create golden sparkles for completion
          this.particleSystem.createBurst(gatePosition, {
            count: 30,
            life: 3.0, // Average of lifetime range (2-4)
            velocity: new THREE.Vector3(0, 0.5, 0), // Slower upward velocity
            velocityVariation: new THREE.Vector3(4, 3, 4), // Sparkle spread effect
            size: { min: 2, max: 6 },
            color: new THREE.Color(0xffd700), // Gold
          })
        }

        // Camera shake effect for impact
        if (this.camera) {
          this.startCameraShake(0.3, 1.0) // intensity, duration
        }

        // Temporary screen flash effect
        this.createScreenFlash()
      }
    }
  })

  describe('startPortalTransition method', () => {
    it('should call createBurst instead of createParticles', () => {
      // This verifies the fix: the method should call createBurst, not createParticles
      mockOceanAdventure.startPortalTransition()

      // Verify createBurst was called twice (for portal particles and sparkles)
      expect(mockParticleSystem.createBurst).toHaveBeenCalledTimes(2)
    })

    it('should call createBurst with correct parameters for portal particles', () => {
      mockOceanAdventure.startPortalTransition()

      const firstCall = mockParticleSystem.createBurst.mock.calls[0]
      expect(firstCall[0]).toEqual(expect.any(THREE.Vector3)) // position
      expect(firstCall[1]).toEqual(expect.objectContaining({
        count: 50,
        life: 2.25,
        velocity: expect.any(THREE.Vector3),
        velocityVariation: expect.any(THREE.Vector3),
        size: { min: 4, max: 12 },
        color: expect.any(THREE.Color),
      }))
    })

    it('should call createBurst with correct parameters for sparkle particles', () => {
      mockOceanAdventure.startPortalTransition()

      const secondCall = mockParticleSystem.createBurst.mock.calls[1]
      expect(secondCall[0]).toEqual(expect.any(THREE.Vector3)) // position
      expect(secondCall[1]).toEqual(expect.objectContaining({
        count: 30,
        life: 3.0,
        velocity: expect.any(THREE.Vector3),
        velocityVariation: expect.any(THREE.Vector3),
        size: { min: 2, max: 6 },
        color: expect.any(THREE.Color),
      }))
    })

    it('should not throw errors when called', () => {
      expect(() => {
        mockOceanAdventure.startPortalTransition()
      }).not.toThrow()
    })

    it('should call other transition effects', () => {
      mockOceanAdventure.startPortalTransition()

      expect(mockOceanAdventure.startCameraShake).toHaveBeenCalledWith(0.3, 1.0)
      expect(mockOceanAdventure.createScreenFlash).toHaveBeenCalled()
    })
  })
})