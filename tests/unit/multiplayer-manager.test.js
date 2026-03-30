import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MultiplayerManager } from '../../src/core/MultiplayerManager.js'

// ─── Minimal Peer mock ────────────────────────────────────────────────────────

/**
 * A lightweight mock of a PeerJS Peer + DataConnection so tests run without a
 * real network or browser WebRTC stack.
 */
function createMockPeer(autoOpenId = 'peer-abc') {
  const eventHandlers = {}

  const peer = {
    _autoOpenId: autoOpenId,
    _handlers: eventHandlers,
    on(event, fn) {
      eventHandlers[event] = fn
      // Simulate the 'open' event asynchronously
      if (event === 'open') {
        Promise.resolve().then(() => fn(this._autoOpenId))
      }
      return this
    },
    connect(remoteId) {
      return createMockConnection(remoteId)
    },
    destroy: vi.fn(),
  }

  return peer
}

function createMockConnection(peerId = 'remote-peer') {
  const handlers = {}
  return {
    peer: peerId,
    _handlers: handlers,
    on(event, fn) {
      handlers[event] = fn
      if (event === 'open') {
        Promise.resolve().then(() => fn())
      }
      return this
    },
    send: vi.fn(),
    close: vi.fn(),
    // Helper for tests: simulate receiving data
    _receive(data) {
      handlers['data']?.(data)
    },
    _close() {
      handlers['close']?.()
    },
  }
}

// A PeerClass factory that returns a constructable mock class
function makePeerClass(autoOpenId = 'host-id') {
  // Must be a real function (not arrow) so it can be used with `new`
  function MockPeer() {
    const peer = createMockPeer(autoOpenId)
    Object.assign(this, peer)
    // Rebind `on` so `this` references work correctly after Object.assign
    this.on = peer.on.bind(this)
    this._handlers = peer._handlers
    this._autoOpenId = peer._autoOpenId
    this.connect = peer.connect.bind(peer)
    this.destroy = peer.destroy
    return this
  }
  return MockPeer
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MultiplayerManager', () => {
  let manager

  beforeEach(() => {
    manager = new MultiplayerManager({ PeerClass: makePeerClass('local-id') })
  })

  afterEach(() => {
    manager.destroy()
  })

  // ── Constructor ──────────────────────────────────────────────────────────

  describe('Constructor', () => {
    it('should initialise with sensible defaults', () => {
      const m = new MultiplayerManager()
      expect(m.isConnected).toBe(false)
      expect(m.isHost).toBe(false)
      expect(m.roomCode).toBeNull()
      expect(m.localId).toBeNull()
      expect(m.playerCount).toBe(0)
    })

    it('should accept custom PeerJS server options', () => {
      const m = new MultiplayerManager({
        host: 'mypeer.example.com',
        port: 9000,
        path: '/game',
        secure: false,
      })
      expect(m.host).toBe('mypeer.example.com')
      expect(m.port).toBe(9000)
      expect(m.path).toBe('/game')
      expect(m.secure).toBe(false)
    })
  })

  // ── Event registration ───────────────────────────────────────────────────

  describe('Event registration', () => {
    it('should return the manager for chaining', () => {
      const result = manager
        .onConnected(() => {})
        .onPlayerJoined(() => {})
        .onPlayerLeft(() => {})
        .onPlayerUpdated(() => {})
        .onError(() => {})
        .onDisconnected(() => {})
      expect(result).toBe(manager)
    })
  })

  // ── createRoom ───────────────────────────────────────────────────────────

  describe('createRoom()', () => {
    it('should resolve with a room code and mark the manager as host', async () => {
      const roomCode = await manager.createRoom()
      expect(typeof roomCode).toBe('string')
      expect(roomCode.length).toBeGreaterThan(0)
      expect(manager.isHost).toBe(true)
      expect(manager.isConnected).toBe(true)
      expect(manager.roomCode).toBe(roomCode)
      expect(manager.localId).toBe(roomCode)
    })

    it('should invoke the onConnected callback', async () => {
      const cb = vi.fn()
      manager.onConnected(cb)
      await manager.createRoom()
      expect(cb).toHaveBeenCalledOnce()
    })
  })

  // ── joinRoom ─────────────────────────────────────────────────────────────

  describe('joinRoom()', () => {
    it('should resolve and set isHost to false', async () => {
      await manager.joinRoom('host-room-code')
      expect(manager.isHost).toBe(false)
      expect(manager.isConnected).toBe(true)
      expect(manager.roomCode).toBe('host-room-code')
    })

    it('should reject when given an invalid room code', async () => {
      await expect(manager.joinRoom('')).rejects.toThrow('Invalid room code')
      await expect(manager.joinRoom(null)).rejects.toThrow('Invalid room code')
      await expect(manager.joinRoom(123)).rejects.toThrow('Invalid room code')
    })

    it('should invoke the onConnected callback', async () => {
      const cb = vi.fn()
      manager.onConnected(cb)
      await manager.joinRoom('some-room')
      expect(cb).toHaveBeenCalledOnce()
    })
  })

  // ── broadcastPlayerState ─────────────────────────────────────────────────

  describe('broadcastPlayerState()', () => {
    it('should not throw when not connected', () => {
      expect(() =>
        manager.broadcastPlayerState(
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0, w: 1 },
          false
        )
      ).not.toThrow()
    })

    it('should send state to all connected peers', async () => {
      await manager.createRoom()

      // Manually inject a mock connection
      const mockConn = { send: vi.fn() }
      manager.connections.set('remote-a', mockConn)

      // Reset rate-limit so the first broadcast goes through
      manager._lastBroadcastTime = 0

      manager.broadcastPlayerState(
        { x: 1, y: 2, z: 3 },
        { x: 0, y: 0, z: 0, w: 1 },
        true
      )

      expect(mockConn.send).toHaveBeenCalledOnce()
      const sent = JSON.parse(mockConn.send.mock.calls[0][0])
      expect(sent.type).toBe('playerState')
      expect(sent.position).toEqual({ x: 1, y: 2, z: 3 })
      expect(sent.isMoving).toBe(true)
    })

    it('should rate-limit broadcasts', async () => {
      await manager.createRoom()
      const mockConn = { send: vi.fn() }
      manager.connections.set('remote-a', mockConn)

      // Force a recent broadcast time
      manager._lastBroadcastTime = Date.now()

      manager.broadcastPlayerState(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0, w: 1 },
        false
      )

      // Should be suppressed
      expect(mockConn.send).not.toHaveBeenCalled()
    })
  })

  // ── Incoming messages ────────────────────────────────────────────────────

  describe('Incoming message handling', () => {
    it('should update remotePlayers on playerState message', async () => {
      await manager.createRoom()
      const updateCb = vi.fn()
      manager.onPlayerUpdated(updateCb)

      manager._handleMessage('peer-x', {
        type: 'playerState',
        position: { x: 5, y: -3, z: 2 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        isMoving: true,
      })

      expect(manager.remotePlayers.has('peer-x')).toBe(true)
      const state = manager.remotePlayers.get('peer-x')
      expect(state.position).toEqual({ x: 5, y: -3, z: 2 })
      expect(updateCb).toHaveBeenCalledOnce()
    })

    it('should handle malformed JSON gracefully', async () => {
      await manager.createRoom()
      expect(() => manager._handleMessage('peer-x', '{')).not.toThrow()
    })
  })

  // ── Connection removal / playerLeft ──────────────────────────────────────

  describe('_removeConnection()', () => {
    it('should fire onPlayerLeft and clean up state', async () => {
      await manager.createRoom()
      const leftCb = vi.fn()
      manager.onPlayerLeft(leftCb)

      // Inject a fake remote player
      manager.remotePlayers.set('peer-y', { id: 'peer-y' })
      manager.connections.set('peer-y', { close: vi.fn() })

      manager._removeConnection('peer-y')

      expect(leftCb).toHaveBeenCalledWith('peer-y')
      expect(manager.remotePlayers.has('peer-y')).toBe(false)
      expect(manager.connections.has('peer-y')).toBe(false)
    })
  })

  // ── playerCount ──────────────────────────────────────────────────────────

  describe('playerCount', () => {
    it('should reflect the number of active connections', async () => {
      await manager.createRoom()
      expect(manager.playerCount).toBe(0)

      manager.connections.set('a', { close: vi.fn() })
      manager.connections.set('b', { close: vi.fn() })
      expect(manager.playerCount).toBe(2)
    })
  })

  // ── destroy ──────────────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('should reset state and close all connections', async () => {
      await manager.createRoom()
      manager.connections.set('x', { close: vi.fn() })
      manager.remotePlayers.set('x', {})

      manager.destroy()

      expect(manager.isConnected).toBe(false)
      expect(manager.localId).toBeNull()
      expect(manager.roomCode).toBeNull()
      expect(manager.connections.size).toBe(0)
      expect(manager.remotePlayers.size).toBe(0)
    })

    it('should not throw when called on an uninitialised manager', () => {
      const m = new MultiplayerManager()
      expect(() => m.destroy()).not.toThrow()
    })
  })
})
