import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { Gate } from '../../src/components/Gate.js'
import { PhysicsEngine } from '../../src/core/Physics.js'

describe('Gate Component (Stage 3)', () => {
  let scene, physicsEngine, gate

  beforeEach(() => {
    // Mock Three.js scene
    scene = {
      add: vi.fn(),
      remove: vi.fn(),
    }

    physicsEngine = new PhysicsEngine()
    gate = new Gate(scene, physicsEngine, new THREE.Vector3(0, 0, -10))
  })

  describe('Gate Creation', () => {
    it('should create gate at specified position', () => {
      const position = new THREE.Vector3(5, 3, -15)
      const testGate = new Gate(scene, physicsEngine, position)
      
      expect(testGate.getPosition()).toEqual(position)
      expect(testGate.width).toBe(4)
      expect(testGate.height).toBe(6)
    })

    it('should create gate with default position if none provided', () => {
      const defaultGate = new Gate(scene, physicsEngine)
      
      expect(defaultGate.getPosition()).toEqual(new THREE.Vector3(0, 0, -15))
    })

    it('should initialize as not activated', () => {
      expect(gate.getIsActivated()).toBe(false)
      expect(gate.getIsCollected()).toBe(false)
    })

    it('should create physics body for collision detection', () => {
      expect(gate.physicsBody).toBeDefined()
      expect(Array.isArray(gate.physicsBody)).toBe(true)
      expect(gate.physicsBody.length).toBeGreaterThan(0)
      expect(gate.physicsBody[0].type).toBe('gate')
      expect(gate.physicsBody[0].gate).toBe(gate)
    })
  })

  describe('Gate Activation', () => {
    it('should activate gate when activate() is called', () => {
      expect(gate.getIsActivated()).toBe(false)
      
      gate.activate()
      
      expect(gate.getIsActivated()).toBe(true)
      expect(scene.add).toHaveBeenCalled()
    })

    it('should not activate multiple times', () => {
      gate.activate()
      const firstCallCount = scene.add.mock.calls.length
      
      gate.activate()
      
      expect(scene.add.mock.calls.length).toBe(firstCallCount)
    })

    it('should deactivate gate when deactivate() is called', () => {
      gate.activate()
      expect(gate.getIsActivated()).toBe(true)
      
      gate.deactivate()
      
      expect(gate.getIsActivated()).toBe(false)
      expect(scene.remove).toHaveBeenCalled()
    })
  })

  describe('Gate Collision', () => {
    it('should handle player entering activated gate', () => {
      gate.activate()
      
      const result = gate.onPlayerEnter()
      
      expect(result).toBe(true)
      expect(gate.getIsCollected()).toBe(true)
    })

    it('should not handle player entering deactivated gate', () => {
      expect(gate.getIsActivated()).toBe(false)
      
      const result = gate.onPlayerEnter()
      
      expect(result).toBe(false)
      expect(gate.getIsCollected()).toBe(false)
    })

    it('should not handle player entering already collected gate', () => {
      gate.activate()
      gate.onPlayerEnter() // First collection
      
      const result = gate.onPlayerEnter() // Second attempt
      
      expect(result).toBe(false)
    })
  })

  describe('Gate Animation', () => {
    it('should update animations when activated', () => {
      gate.activate()
      const initialTime = gate.time
      
      gate.update(0.016) // 16ms frame
      
      expect(gate.time).toBeGreaterThan(initialTime)
    })

    it('should not update animations when deactivated', () => {
      expect(gate.getIsActivated()).toBe(false)
      const initialTime = gate.time
      
      gate.update(0.016)
      
      expect(gate.time).toBe(initialTime)
    })
  })

  describe('Gate Reset', () => {
    it('should reset gate state for new level', () => {
      gate.activate()
      gate.onPlayerEnter()
      
      expect(gate.getIsActivated()).toBe(true)
      expect(gate.getIsCollected()).toBe(true)
      
      gate.reset()
      
      expect(gate.getIsActivated()).toBe(false)
      expect(gate.getIsCollected()).toBe(false)
      expect(gate.time).toBe(0)
    })
  })

  describe('Gate Disposal', () => {
    it('should dispose of gate resources properly', () => {
      gate.activate()
      
      gate.dispose()
      
      expect(scene.remove).toHaveBeenCalled()
      // Physics body should be removed from physics engine
      expect(physicsEngine.rigidBodies).not.toContain(gate.physicsBody)
    })
  })
})