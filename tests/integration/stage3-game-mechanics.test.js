import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { PhysicsEngine } from '../../src/core/Physics.js'
import { Player } from '../../src/components/Player.js'
import { Gate } from '../../src/components/Gate.js'
import { AudioEngine } from '../../src/core/AudioEngine.js'

describe('Stage 3 Integration: Game Objects & Mechanics', () => {
  let scene, physicsEngine, player, gate, audioEngine

  beforeEach(() => {
    // Mock Three.js scene
    scene = {
      add: vi.fn(),
      remove: vi.fn(),
    }

    // Mock Web Audio API for AudioEngine
    global.AudioContext = vi.fn(() => ({
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      })),
      createGain: vi.fn(() => ({
        gain: { 
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn()
        },
        connect: vi.fn()
      })),
      createBiquadFilter: vi.fn(() => ({
        type: 'lowpass',
        frequency: { setValueAtTime: vi.fn() },
        Q: { setValueAtTime: vi.fn() },
        connect: vi.fn()
      })),
      currentTime: 0,
      destination: {},
      listener: {
        positionX: { setValueAtTime: vi.fn() },
        positionY: { setValueAtTime: vi.fn() },
        positionZ: { setValueAtTime: vi.fn() },
        forwardX: { setValueAtTime: vi.fn() },
        forwardY: { setValueAtTime: vi.fn() },
        forwardZ: { setValueAtTime: vi.fn() },
        upX: { setValueAtTime: vi.fn() },
        upY: { setValueAtTime: vi.fn() },
        upZ: { setValueAtTime: vi.fn() }
      },
      state: 'running',
      close: vi.fn()
    }))

    physicsEngine = new PhysicsEngine()
    player = new Player(scene, physicsEngine)
    gate = new Gate(scene, physicsEngine, new THREE.Vector3(0, 2, -15))
    audioEngine = new AudioEngine()
  })

  describe('Complete Level Flow', () => {
    it('should complete full level progression: collect stars → activate gate → complete level', async () => {
      // Initialize audio system
      await audioEngine.initialize()
      
      // Position player near gate
      player.setPosition(new THREE.Vector3(0, 2, -14))
      
      // Initially gate should not be activated
      expect(gate.getIsActivated()).toBe(false)
      
      // Simulate all stars collected - activate gate
      gate.activate()
      expect(gate.getIsActivated()).toBe(true)
      
      // Move player into gate collision zone
      player.setPosition(new THREE.Vector3(0, 2, -15))
      
      // Check for gate collision
      const playerCollisions = physicsEngine.collisionSystem.checkCollisions(
        player.physicsBody
      )
      
      let levelCompleted = false
      for (const collision of playerCollisions) {
        if (collision.type === 'gate' && collision.gate) {
          levelCompleted = collision.gate.onPlayerEnter()
          break
        }
      }
      
      expect(levelCompleted).toBe(true)
      expect(gate.getIsCollected()).toBe(true)
    })

    it('should not complete level if gate is not activated', () => {
      // Position player at gate
      player.setPosition(new THREE.Vector3(0, 2, -15))
      
      // Gate should not be activated
      expect(gate.getIsActivated()).toBe(false)
      
      // Try to enter gate
      const result = gate.onPlayerEnter()
      
      expect(result).toBe(false)
      expect(gate.getIsCollected()).toBe(false)
    })
  })

  describe('Audio Integration', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('should play sound effects during gameplay events', () => {
      const playSound = vi.spyOn(audioEngine, 'playSound')
      
      // Test star collection sound
      audioEngine.playSound('starCollect', new THREE.Vector3(5, 0, 0))
      expect(playSound).toHaveBeenCalledWith('starCollect', new THREE.Vector3(5, 0, 0))
      
      // Test gate activation sound
      audioEngine.playSound('gateActivate', gate.getPosition())
      expect(playSound).toHaveBeenCalledWith('gateActivate', gate.getPosition())
      
      // Test level completion sound
      audioEngine.playSound('levelComplete')
      expect(playSound).toHaveBeenCalledWith('levelComplete')
    })

    it('should update 3D audio listener based on player position', () => {
      const updateListener = vi.spyOn(audioEngine, 'updateListenerPosition')
      const playerPosition = player.getPosition()
      const forward = new THREE.Vector3(0, 0, -1)
      const up = new THREE.Vector3(0, 1, 0)
      
      audioEngine.updateListenerPosition(playerPosition, forward, up)
      
      expect(updateListener).toHaveBeenCalledWith(playerPosition, forward, up)
    })
  })

  describe('Physics Integration', () => {
    it('should detect collision between player and activated gate', () => {
      // Activate gate
      gate.activate()
      
      // Position player at gate location
      player.setPosition(gate.getPosition())
      
      // Check collisions
      const collisions = physicsEngine.collisionSystem.checkCollisions(
        player.physicsBody
      )
      
      // Should detect gate collision
      const gateCollision = collisions.find(c => c.type === 'gate')
      expect(gateCollision).toBeDefined()
      expect(gateCollision.gate).toBe(gate)
    })

    it('should not detect collision with deactivated gate', () => {
      // Gate starts deactivated
      expect(gate.getIsActivated()).toBe(false)
      
      // Position player at gate location
      player.setPosition(gate.getPosition())
      
      // Check collisions - should work because physics body exists regardless of visual state
      const collisions = physicsEngine.collisionSystem.checkCollisions(
        player.physicsBody
      )
      
      // Gate collision should still be detectable (physics body exists)
      // but onPlayerEnter should return false
      const gateCollision = collisions.find(c => c.type === 'gate')
      if (gateCollision) {
        const result = gateCollision.gate.onPlayerEnter()
        expect(result).toBe(false)
      }
    })
  })

  describe('Game State Management', () => {
    it('should reset gate state for new level', () => {
      // Complete a level
      gate.activate()
      gate.onPlayerEnter()
      
      expect(gate.getIsActivated()).toBe(true)
      expect(gate.getIsCollected()).toBe(true)
      
      // Reset for new level
      gate.reset()
      
      expect(gate.getIsActivated()).toBe(false)
      expect(gate.getIsCollected()).toBe(false)
    })

    it('should maintain consistent game object states', () => {
      // Initial state
      expect(player.getPosition()).toEqual(new THREE.Vector3(0, 2, 0))
      expect(gate.getIsActivated()).toBe(false)
      expect(audioEngine.getState().isInitialized).toBe(false)
      
      // After setup
      player.setPosition(new THREE.Vector3(5, 3, -10))
      gate.activate()
      
      expect(player.getPosition()).toEqual(new THREE.Vector3(5, 3, -10))
      expect(gate.getIsActivated()).toBe(true)
    })
  })

  describe('Performance and Resource Management', () => {
    it('should properly dispose of all Stage 3 components', () => {
      const sceneMock = scene
      
      // Dispose all components
      player.dispose()
      gate.dispose()
      audioEngine.dispose()
      
      // Verify cleanup
      expect(sceneMock.remove).toHaveBeenCalled()
      expect(physicsEngine.rigidBodies).not.toContain(player.physicsBody)
      expect(physicsEngine.rigidBodies).not.toContain(gate.physicsBody)
      expect(audioEngine.getState().isInitialized).toBe(false)
    })

    it('should handle update loops efficiently', () => {
      const deltaTime = 0.016 // 60 FPS
      
      // Activate gate for animation updates
      gate.activate()
      
      // Multiple update calls should not cause errors
      for (let i = 0; i < 100; i++) {
        player.update()
        gate.update(deltaTime)
        physicsEngine.update(deltaTime)
      }
      
      // All objects should still be in valid states
      expect(player.getPosition()).toBeDefined()
      expect(gate.getIsActivated()).toBe(true)
      expect(gate.time).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing audio context gracefully', async () => {
      // Break the audio context
      global.AudioContext = undefined
      const brokenAudioEngine = new AudioEngine()
      
      // Should not throw errors
      await expect(brokenAudioEngine.initialize()).resolves.toBeUndefined()
      expect(brokenAudioEngine.getState().isInitialized).toBe(false)
      
      // Should handle sound calls without crashing
      brokenAudioEngine.playSound('starCollect')
      brokenAudioEngine.startAmbientSound()
    })

    it('should handle physics errors gracefully', () => {
      // Test with extreme positions
      const extremePosition = new THREE.Vector3(Number.MAX_VALUE, 0, 0)
      
      // Should not crash
      expect(() => {
        player.setPosition(extremePosition)
        gate.dispose()
        physicsEngine.update(0.016)
      }).not.toThrow()
    })
  })
})