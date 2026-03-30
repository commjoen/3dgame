import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as THREE from 'three'
import { RemotePlayer } from '../../src/components/RemotePlayer.js'

// Mock Three.js WebGL dependencies
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

describe('RemotePlayer', () => {
  let mockScene
  let remotePlayer

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn(),
    }
    remotePlayer = new RemotePlayer(mockScene, 'peer-test-id')
  })

  afterEach(() => {
    remotePlayer.dispose()
  })

  describe('Initialization', () => {
    it('should add mesh to scene', () => {
      expect(mockScene.add).toHaveBeenCalledOnce()
    })

    it('should create a Group mesh', () => {
      expect(remotePlayer.mesh).toBeDefined()
      expect(remotePlayer.mesh.type).toBe('Group')
    })

    it('should store the peer ID', () => {
      expect(remotePlayer.peerId).toBe('peer-test-id')
    })

    it('should start off-screen', () => {
      expect(remotePlayer.mesh.position.y).toBe(-1000)
    })
  })

  describe('applyNetworkState()', () => {
    it('should update target position and rotation', () => {
      remotePlayer.applyNetworkState(
        { x: 3, y: -5, z: 1 },
        { x: 0, y: 0.7071, z: 0, w: 0.7071 },
        true
      )
      expect(remotePlayer.targetPosition.x).toBeCloseTo(3)
      expect(remotePlayer.targetPosition.y).toBeCloseTo(-5)
      expect(remotePlayer.targetPosition.z).toBeCloseTo(1)
      expect(remotePlayer.isMoving).toBe(true)
    })
  })

  describe('update()', () => {
    it('should interpolate mesh toward target position', () => {
      remotePlayer.applyNetworkState(
        { x: 10, y: 0, z: 0 },
        { x: 0, y: 0, z: 0, w: 1 },
        false
      )
      // Large deltaTime forces full lerp
      remotePlayer.update(10)
      expect(remotePlayer.mesh.position.x).toBeCloseTo(10, 1)
    })

    it('should not throw when called before any state is applied', () => {
      expect(() => remotePlayer.update(0.016)).not.toThrow()
    })
  })

  describe('dispose()', () => {
    it('should remove mesh from scene', () => {
      remotePlayer.dispose()
      expect(mockScene.remove).toHaveBeenCalledOnce()
    })

    it('should null out the mesh reference', () => {
      remotePlayer.dispose()
      expect(remotePlayer.mesh).toBeNull()
    })

    it('should not throw when called twice', () => {
      remotePlayer.dispose()
      expect(() => remotePlayer.dispose()).not.toThrow()
    })
  })
})
