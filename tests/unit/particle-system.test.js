import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { ParticleSystem } from '../../src/core/ParticleSystem.js'

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

// Mock document and canvas for testing
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
    return {}
  }),
}

describe('ParticleSystem', () => {
  let mockScene
  let particleSystem

  beforeEach(() => {
    // Mock scene
    mockScene = {
      add: vi.fn(),
      remove: vi.fn(),
    }

    // Create particle system with small particle count for testing
    particleSystem = new ParticleSystem(mockScene, 50)
  })

  describe('Initialization', () => {
    it('should initialize with correct particle count', () => {
      expect(particleSystem.maxParticles).toBe(50)
      expect(particleSystem.particles).toHaveLength(50)
      expect(particleSystem.emitters).toHaveLength(3) // Default underwater emitters
    })

    it('should add particle system to scene', () => {
      expect(mockScene.add).toHaveBeenCalled()
    })

    it('should create default underwater emitters', () => {
      const emitterTypes = particleSystem.emitters.map(e => e.type)
      expect(emitterTypes).toContain('bubbles')
      expect(emitterTypes).toContain('debris')
      expect(emitterTypes).toContain('lightRays')
    })

    it('should initialize all particles as inactive', () => {
      const activeParticles = particleSystem.particles.filter(p => p.active)
      expect(activeParticles).toHaveLength(0)
    })
  })

  describe('Particle Management', () => {
    it('should create particle burst at specified position', () => {
      const position = new THREE.Vector3(5, 5, 5)
      const config = {
        count: 10,
        life: 2.0,
        color: new THREE.Color(0xff0000),
      }

      particleSystem.createBurst(position, config)

      const activeParticles = particleSystem.particles.filter(p => p.active)
      expect(activeParticles.length).toBeGreaterThan(0)
      expect(activeParticles.length).toBeLessThanOrEqual(10)

      // Check that particles have correct properties
      const firstParticle = activeParticles[0]
      expect(firstParticle.life).toBe(2.0)
      expect(firstParticle.maxLife).toBe(2.0)
      expect(firstParticle.color.equals(config.color)).toBe(true)
    })

    it('should update particle positions over time', () => {
      // Create a particle burst
      particleSystem.createBurst(new THREE.Vector3(0, 0, 0), { count: 5 })

      const activeParticles = particleSystem.particles.filter(p => p.active)
      const initialPositions = activeParticles.map(p => p.position.clone())

      // Update particles
      particleSystem.update(0.1) // 100ms

      // Check that positions changed
      activeParticles.forEach((particle, index) => {
        const initialPos = initialPositions[index]
        const currentPos = particle.position
        const moved = !initialPos.equals(currentPos)
        expect(moved).toBe(true)
      })
    })

    it('should deactivate particles when life expires', () => {
      // Create particles with very short life
      particleSystem.createBurst(new THREE.Vector3(0, 0, 0), {
        count: 5,
        life: 0.05, // 50ms life
      })

      let activeParticles = particleSystem.particles.filter(p => p.active)
      expect(activeParticles.length).toBe(5)

      // Update with enough time to expire particles
      particleSystem.update(0.1) // 100ms

      activeParticles = particleSystem.particles.filter(p => p.active)
      expect(activeParticles.length).toBe(0)
    })
  })

  describe('Emitters', () => {
    it('should emit particles from emitters over time', () => {
      // Set high emission rate for testing
      const emitter = particleSystem.emitters[0]
      emitter.rate = 100 // 100 particles per second

      // Update for a short time
      particleSystem.update(0.1)

      const activeParticles = particleSystem.particles.filter(p => p.active)
      expect(activeParticles.length).toBeGreaterThan(0)
    })

    it('should be able to activate/deactivate emitters', () => {
      // Deactivate bubbles emitter
      particleSystem.setEmitterActive('bubbles', false)

      const bubblesEmitter = particleSystem.emitters.find(e => e.type === 'bubbles')
      expect(bubblesEmitter.active).toBe(false)

      // Reactivate
      particleSystem.setEmitterActive('bubbles', true)
      expect(bubblesEmitter.active).toBe(true)
    })

    it('should add custom emitters', () => {
      const customEmitter = {
        type: 'custom',
        position: new THREE.Vector3(0, 0, 0),
        rate: 1,
        life: 1.0,
        size: { min: 1, max: 2 },
        velocity: new THREE.Vector3(0, 1, 0),
        velocityVariation: new THREE.Vector3(0.1, 0.1, 0.1),
        color: new THREE.Color(0x00ff00),
        colorVariation: 0.1,
        area: new THREE.Vector3(1, 1, 1),
      }

      const initialEmitterCount = particleSystem.emitters.length
      particleSystem.addEmitter(customEmitter)

      expect(particleSystem.emitters.length).toBe(initialEmitterCount + 1)
      expect(particleSystem.emitters.some(e => e.type === 'custom')).toBe(true)
    })
  })

  describe('Resource Management', () => {
    it('should clear all particles', () => {
      // Create some particles
      particleSystem.createBurst(new THREE.Vector3(0, 0, 0), { count: 10 })

      let activeParticles = particleSystem.particles.filter(p => p.active)
      expect(activeParticles.length).toBe(10)

      // Clear all particles
      particleSystem.clear()

      activeParticles = particleSystem.particles.filter(p => p.active)
      expect(activeParticles.length).toBe(0)
    })

    it('should dispose resources properly', () => {
      expect(() => particleSystem.dispose()).not.toThrow()
      expect(mockScene.remove).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should handle particle pool exhaustion gracefully', () => {
      // Try to create more particles than the pool size
      particleSystem.createBurst(new THREE.Vector3(0, 0, 0), { count: 100 })

      const activeParticles = particleSystem.particles.filter(p => p.active)
      expect(activeParticles.length).toBeLessThanOrEqual(50) // Max pool size
    })

    it('should reuse particles efficiently', () => {
      // Create particles with short life
      particleSystem.createBurst(new THREE.Vector3(0, 0, 0), {
        count: 10,
        life: 0.05,
      })

      // Let them expire
      particleSystem.update(0.1)

      // Create new particles - should reuse the same particle objects
      particleSystem.createBurst(new THREE.Vector3(0, 0, 0), { count: 10 })

      const activeParticles = particleSystem.particles.filter(p => p.active)
      expect(activeParticles.length).toBe(10)
    })
  })
})