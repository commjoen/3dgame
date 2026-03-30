/**
 * RemotePlayer - Visual representation of another player in the world.
 *
 * Mirrors the geometry of the local Player but without physics or input
 * handling.  Positions are smoothly interpolated toward the latest value
 * received from the remote peer to compensate for network jitter.
 */

import * as THREE from 'three'

/** How quickly the mesh snaps toward the target (lerp factor per second). */
const LERP_SPEED = 8

export class RemotePlayer {
  /**
   * @param {THREE.Scene} scene
   * @param {string} peerId
   */
  constructor(scene, peerId) {
    this.scene = scene
    this.peerId = peerId

    /** Target position received from the network */
    this.targetPosition = new THREE.Vector3()

    /** Target quaternion received from the network */
    this.targetQuaternion = new THREE.Quaternion()

    this.isMoving = false

    this.mesh = this._createMesh()
    this.scene.add(this.mesh)
  }

  // ─── Mesh construction ────────────────────────────────────────────────────

  _createMesh() {
    const group = new THREE.Group()

    // Body – teal colour to distinguish remote players from the local one
    const bodyGeo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      roughness: 0.6,
      metalness: 0.1,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    group.add(body)

    // Head
    const headGeo = new THREE.SphereGeometry(0.25, 8, 8)
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xfdbcb4,
      roughness: 0.7,
    })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.set(0, 0.9, 0)
    head.castShadow = true
    group.add(head)

    // Left arm
    const armGeo = new THREE.CapsuleGeometry(0.08, 0.6, 4, 6)
    const leftArm = new THREE.Mesh(armGeo, bodyMat)
    leftArm.position.set(-0.45, 0.2, 0)
    leftArm.rotation.z = 0.3
    leftArm.castShadow = true
    group.add(leftArm)

    // Right arm
    const rightArm = new THREE.Mesh(armGeo, bodyMat)
    rightArm.position.set(0.45, 0.2, 0)
    rightArm.rotation.z = -0.3
    rightArm.castShadow = true
    group.add(rightArm)

    // Store references for swim animation
    group.userData.leftArm = leftArm
    group.userData.rightArm = rightArm

    // Peer ID nameplate (visible in debug / future UI)
    group.userData.peerId = this.peerId

    // Start off-screen until first position update arrives
    group.position.set(0, -1000, 0)

    return group
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Apply the latest state received from the network.
   * @param {{x:number,y:number,z:number}} position
   * @param {{x:number,y:number,z:number,w:number}} rotation
   * @param {boolean} isMoving
   */
  applyNetworkState(position, rotation, isMoving) {
    this.targetPosition.set(position.x, position.y, position.z)
    this.targetQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    this.isMoving = isMoving
  }

  /**
   * Smoothly interpolate the mesh toward the target state.
   * Call once per frame from the game loop.
   * @param {number} deltaTime - Seconds since last frame
   */
  update(deltaTime) {
    if (!this.mesh) {
      return
    }

    const alpha = Math.min(1, LERP_SPEED * deltaTime)
    this.mesh.position.lerp(this.targetPosition, alpha)
    this.mesh.quaternion.slerp(this.targetQuaternion, alpha)

    // Simple swim animation when moving
    if (this.isMoving) {
      const t = Date.now() * 0.005
      const { leftArm, rightArm } = this.mesh.userData
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t) * 0.4
      }
      if (rightArm) {
        rightArm.rotation.x = Math.sin(t + Math.PI) * 0.4
      }
    }
  }

  /**
   * Remove the mesh from the scene and dispose GPU resources.
   */
  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh)
      this.mesh.traverse(child => {
        if (child.isMesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
      this.mesh = null
    }
  }
}
