/**
 * MultiplayerManager - WebRTC Multiplayer for Ocean Adventure
 *
 * Uses PeerJS to establish peer-to-peer data channels between players.
 * One player acts as the "host" and shares a room code; others join
 * using that code.  All position/rotation state is exchanged directly
 * over the data channels – no relay server required once the initial
 * connection is made.
 *
 * Message protocol (JSON over RTCDataChannel):
 *   { type: 'playerState', id, position: {x,y,z}, rotation: {x,y,z,w}, isMoving }
 *   { type: 'playerJoined', id }
 *   { type: 'playerLeft',   id }
 */

/**
 * @typedef {Object} PlayerState
 * @property {string} id - Unique peer identifier
 * @property {{x:number,y:number,z:number}} position
 * @property {{x:number,y:number,z:number,w:number}} rotation
 * @property {boolean} isMoving
 */

export class MultiplayerManager {
  /**
   * @param {Object} [options]
   * @param {string} [options.host='0.peerjs.com'] - PeerJS signalling host
   * @param {number} [options.port=443]            - PeerJS signalling port
   * @param {string} [options.path='/']            - PeerJS signalling path
   * @param {boolean} [options.secure=true]        - Use WSS/HTTPS
   * @param {Function} [options.PeerClass]         - Peer constructor (for testing)
   */
  constructor(options = {}) {
    this.host = options.host ?? '0.peerjs.com'
    this.port = options.port ?? 443
    this.path = options.path ?? '/'
    this.secure = options.secure ?? true
    this._PeerClass = options.PeerClass ?? null

    /** @type {import('peerjs').Peer|null} */
    this.peer = null

    /** @type {string|null} */
    this.localId = null

    /** @type {Map<string, import('peerjs').DataConnection>} */
    this.connections = new Map()

    /** @type {Map<string, PlayerState>} */
    this.remotePlayers = new Map()

    this.isConnected = false
    this.isHost = false
    this.roomCode = null

    // Rate-limit outgoing state broadcasts (max once per ~50 ms)
    this._lastBroadcastTime = 0
    this._broadcastInterval = 50

    // Event callbacks
    this._onPlayerJoined = null
    this._onPlayerLeft = null
    this._onPlayerUpdated = null
    this._onConnected = null
    this._onError = null
    this._onDisconnected = null
  }

  // ─── Event registration ───────────────────────────────────────────────────

  /** @param {(id:string)=>void} fn */
  onPlayerJoined(fn) {
    this._onPlayerJoined = fn
    return this
  }

  /** @param {(id:string)=>void} fn */
  onPlayerLeft(fn) {
    this._onPlayerLeft = fn
    return this
  }

  /** @param {(state:PlayerState)=>void} fn */
  onPlayerUpdated(fn) {
    this._onPlayerUpdated = fn
    return this
  }

  /** @param {(localId:string)=>void} fn */
  onConnected(fn) {
    this._onConnected = fn
    return this
  }

  /** @param {(err:Error)=>void} fn */
  onError(fn) {
    this._onError = fn
    return this
  }

  /** @param {()=>void} fn */
  onDisconnected(fn) {
    this._onDisconnected = fn
    return this
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  /**
   * Lazily import and instantiate the Peer class.
   * Falls back to the PeerClass provided in constructor options (useful in tests).
   * @param {string} [id] - Desired peer ID (omit for auto-generated)
   * @returns {Promise<import('peerjs').Peer>}
   */
  async _createPeer(id) {
    let PeerConstructor = this._PeerClass
    if (!PeerConstructor) {
      const module = await import('peerjs')
      PeerConstructor = module.Peer
    }

    const peerOptions = {
      host: this.host,
      port: this.port,
      path: this.path,
      secure: this.secure,
      debug: 0,
    }

    return id
      ? new PeerConstructor(id, peerOptions)
      : new PeerConstructor(peerOptions)
  }

  /**
   * Attach data-channel event handlers to a connection.
   * @param {import('peerjs').DataConnection} conn
   */
  _attachConnectionHandlers(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn)
      this._emit('playerJoined', conn.peer)

      // Announce ourselves to the newly connected peer
      conn.send(JSON.stringify({ type: 'playerJoined', id: this.localId }))
    })

    conn.on('data', raw => {
      this._handleMessage(conn.peer, raw)
    })

    conn.on('close', () => {
      this._removeConnection(conn.peer)
    })

    conn.on('error', err => {
      console.warn(`[Multiplayer] Connection error with ${conn.peer}:`, err)
      this._removeConnection(conn.peer)
    })
  }

  /**
   * Parse and dispatch an incoming message.
   * @param {string} senderId
   * @param {string|Object} raw
   */
  _handleMessage(senderId, raw) {
    let msg
    try {
      msg = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
      return
    }

    switch (msg.type) {
      case 'playerState': {
        const state = {
          id: senderId,
          position: msg.position,
          rotation: msg.rotation,
          isMoving: msg.isMoving,
        }
        this.remotePlayers.set(senderId, state)
        this._emit('playerUpdated', state)
        break
      }
      case 'playerJoined':
        // Remote peer announced themselves – already handled in _attachConnectionHandlers
        break
      case 'playerLeft':
        this._removeConnection(msg.id ?? senderId)
        break
      default:
        break
    }
  }

  /**
   * Fire a named event callback.
   * @param {string} event
   * @param  {...any} args
   */
  _emit(event, ...args) {
    const map = {
      playerJoined: this._onPlayerJoined,
      playerLeft: this._onPlayerLeft,
      playerUpdated: this._onPlayerUpdated,
      connected: this._onConnected,
      error: this._onError,
      disconnected: this._onDisconnected,
    }
    const fn = map[event]
    if (typeof fn === 'function') {
      try {
        fn(...args)
      } catch (err) {
        console.error(`[Multiplayer] Error in ${event} callback:`, err)
      }
    }
  }

  /**
   * Remove and clean up a connection.
   * @param {string} peerId
   */
  _removeConnection(peerId) {
    if (this.connections.has(peerId)) {
      try {
        this.connections.get(peerId).close()
      } catch {
        // ignore
      }
      this.connections.delete(peerId)
    }
    if (this.remotePlayers.has(peerId)) {
      this.remotePlayers.delete(peerId)
      this._emit('playerLeft', peerId)
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Create a new room.  The returned promise resolves with the room code
   * that other players can use to join.
   * @returns {Promise<string>} room code
   */
  async createRoom() {
    if (this.peer) {
      this.destroy()
    }

    this.peer = await this._createPeer()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for PeerJS server'))
      }, 15000)

      this.peer.on('open', id => {
        clearTimeout(timeout)
        this.localId = id
        this.roomCode = id
        this.isHost = true
        this.isConnected = true

        // Accept incoming connections from joining players
        this.peer.on('connection', conn => {
          this._attachConnectionHandlers(conn)
        })

        this._emit('connected', id)
        resolve(id)
      })

      this.peer.on('error', err => {
        clearTimeout(timeout)
        this._emit('error', err)
        reject(err)
      })

      this.peer.on('disconnected', () => {
        this.isConnected = false
        this._emit('disconnected')
      })
    })
  }

  /**
   * Join an existing room using the host's room code.
   * @param {string} roomCode - The host player's peer ID / room code
   * @returns {Promise<void>}
   */
  async joinRoom(roomCode) {
    if (!roomCode || typeof roomCode !== 'string') {
      throw new Error('Invalid room code')
    }

    if (this.peer) {
      this.destroy()
    }

    this.peer = await this._createPeer()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for PeerJS server'))
      }, 15000)

      this.peer.on('open', id => {
        clearTimeout(timeout)
        this.localId = id
        this.roomCode = roomCode
        this.isHost = false
        this.isConnected = true

        // Connect to host
        const conn = this.peer.connect(roomCode, { reliable: true })
        this._attachConnectionHandlers(conn)

        // Accept connections from other peers the host may forward
        this.peer.on('connection', incoming => {
          this._attachConnectionHandlers(incoming)
        })

        this._emit('connected', id)
        resolve()
      })

      this.peer.on('error', err => {
        clearTimeout(timeout)
        this._emit('error', err)
        reject(err)
      })

      this.peer.on('disconnected', () => {
        this.isConnected = false
        this._emit('disconnected')
      })
    })
  }

  /**
   * Broadcast local player state to all connected peers.
   * Rate-limited to at most once every `_broadcastInterval` ms.
   * @param {{x:number,y:number,z:number}} position
   * @param {{x:number,y:number,z:number,w:number}} rotation
   * @param {boolean} isMoving
   */
  broadcastPlayerState(position, rotation, isMoving) {
    if (!this.isConnected || this.connections.size === 0) {
      return
    }

    const now = Date.now()
    if (now - this._lastBroadcastTime < this._broadcastInterval) {
      return
    }
    this._lastBroadcastTime = now

    const message = JSON.stringify({
      type: 'playerState',
      id: this.localId,
      position: { x: position.x, y: position.y, z: position.z },
      rotation: {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        w: rotation.w,
      },
      isMoving,
    })

    for (const conn of this.connections.values()) {
      try {
        conn.send(message)
      } catch (err) {
        console.warn('[Multiplayer] Failed to send state:', err)
      }
    }
  }

  /**
   * Number of currently connected remote peers.
   * @returns {number}
   */
  get playerCount() {
    return this.connections.size
  }

  /**
   * Cleanly close all connections and destroy the Peer instance.
   */
  destroy() {
    for (const peerId of [...this.connections.keys()]) {
      this._removeConnection(peerId)
    }
    if (this.peer) {
      try {
        this.peer.destroy()
      } catch {
        // ignore
      }
      this.peer = null
    }
    this.isConnected = false
    this.localId = null
    this.roomCode = null
  }
}
