/**
 * Physics Engine for Ocean Adventure
 *
 * Implements collision detection and underwater physics simulation
 * including buoyancy, drag, and environmental forces.
 */

import * as THREE from 'three'

/**
 * Collision system supporting AABB and sphere-based collision detection
 */
export class CollisionSystem {
  constructor() {
    this.colliders = []
    this.staticColliders = []
  }

  /**
   * Add a collider to the system
   * @param {Object} collider - Collider object with geometry and position
   * @param {boolean} isStatic - Whether the collider is static (doesn't move)
   */
  addCollider(collider, isStatic = false) {
    const list = isStatic ? this.staticColliders : this.colliders
    list.push(collider)
  }

  /**
   * Remove a collider from the system
   * @param {Object} collider - Collider to remove
   */
  removeCollider(collider) {
    let index = this.colliders.indexOf(collider)
    if (index !== -1) {
      this.colliders.splice(index, 1)
      return
    }

    index = this.staticColliders.indexOf(collider)
    if (index !== -1) {
      this.staticColliders.splice(index, 1)
    }
  }

  /**
   * Check for collisions between two objects
   * @param {Object} objectA - First object with position and geometry
   * @param {Object} objectB - Second object with position and geometry
   * @returns {boolean} Whether objects are colliding
   */
  checkCollision(objectA, objectB) {
    // Sphere-sphere collision detection
    if (
      objectA.collisionType === 'sphere' &&
      objectB.collisionType === 'sphere'
    ) {
      return this.checkSphereCollision(objectA, objectB)
    }

    // AABB-AABB collision detection
    if (objectA.collisionType === 'box' && objectB.collisionType === 'box') {
      return this.checkAABBCollision(objectA, objectB)
    }

    // Sphere-AABB collision detection
    if (
      (objectA.collisionType === 'sphere' && objectB.collisionType === 'box') ||
      (objectA.collisionType === 'box' && objectB.collisionType === 'sphere')
    ) {
      return this.checkSphereAABBCollision(objectA, objectB)
    }

    return false
  }

  /**
   * Check sphere-sphere collision
   * @param {Object} sphereA - First sphere
   * @param {Object} sphereB - Second sphere
   * @returns {boolean} Whether spheres are colliding
   */
  checkSphereCollision(sphereA, sphereB) {
    const distance = sphereA.position.distanceTo(sphereB.position)
    const radiusSum = sphereA.radius + sphereB.radius
    return distance <= radiusSum
  }

  /**
   * Check AABB-AABB collision
   * @param {Object} boxA - First box
   * @param {Object} boxB - Second box
   * @returns {boolean} Whether boxes are colliding
   */
  checkAABBCollision(boxA, boxB) {
    const minA = boxA.position
      .clone()
      .sub(boxA.size.clone().multiplyScalar(0.5))
    const maxA = boxA.position
      .clone()
      .add(boxA.size.clone().multiplyScalar(0.5))
    const minB = boxB.position
      .clone()
      .sub(boxB.size.clone().multiplyScalar(0.5))
    const maxB = boxB.position
      .clone()
      .add(boxB.size.clone().multiplyScalar(0.5))

    return (
      minA.x <= maxB.x &&
      maxA.x >= minB.x &&
      minA.y <= maxB.y &&
      maxA.y >= minB.y &&
      minA.z <= maxB.z &&
      maxA.z >= minB.z
    )
  }

  /**
   * Check sphere-AABB collision
   * @param {Object} objectA - First object (sphere or box)
   * @param {Object} objectB - Second object (sphere or box)
   * @returns {boolean} Whether objects are colliding
   */
  checkSphereAABBCollision(objectA, objectB) {
    const sphere = objectA.collisionType === 'sphere' ? objectA : objectB
    const box = objectA.collisionType === 'box' ? objectA : objectB

    const boxMin = box.position
      .clone()
      .sub(box.size.clone().multiplyScalar(0.5))
    const boxMax = box.position
      .clone()
      .add(box.size.clone().multiplyScalar(0.5))

    // Find closest point on box to sphere center
    const closestPoint = new THREE.Vector3(
      Math.max(boxMin.x, Math.min(sphere.position.x, boxMax.x)),
      Math.max(boxMin.y, Math.min(sphere.position.y, boxMax.y)),
      Math.max(boxMin.z, Math.min(sphere.position.z, boxMax.z))
    )

    const distance = sphere.position.distanceTo(closestPoint)
    return distance <= sphere.radius
  }

  /**
   * Check all collisions for a given object
   * @param {Object} object - Object to check collisions for
   * @returns {Array} Array of colliding objects
   */
  checkCollisions(object) {
    const collisions = []

    // Check against dynamic colliders
    for (const collider of this.colliders) {
      if (collider !== object && this.checkCollision(object, collider)) {
        collisions.push(collider)
      }
    }

    // Check against static colliders
    for (const collider of this.staticColliders) {
      if (this.checkCollision(object, collider)) {
        collisions.push(collider)
      }
    }

    return collisions
  }
}

/**
 * Underwater physics simulation
 */
export class UnderwaterPhysics {
  constructor() {
    this.buoyancyForce = 2.0 // Further reduced buoyancy force (was 4.0)
    this.dragCoefficient = 0.95 // Water resistance (0-1, lower = more drag)
    this.currentDirection = new THREE.Vector3(0.1, 0, 0.05) // Gentle underwater current
    this.currentStrength = 0.02
  }

  /**
   * Apply buoyancy force to an object
   * @param {Object} body - Physics body with velocity and position
   * @param {number} deltaTime - Time since last frame
   */
  applyBuoyancy(body, deltaTime) {
    const buoyancy = new THREE.Vector3(0, this.buoyancyForce * deltaTime, 0)
    body.velocity.add(buoyancy)
  }

  /**
   * Apply drag force to an object
   * @param {Object} body - Physics body with velocity
   */
  applyDrag(body) {
    body.velocity.multiplyScalar(this.dragCoefficient)
  }

  /**
   * Apply underwater current to an object
   * @param {Object} body - Physics body with velocity
   * @param {number} currentStrength - Strength multiplier for current effect
   * @param {number} deltaTime - Time since last frame
   */
  applyCurrent(body, currentStrength = 1.0, deltaTime) {
    const currentForce = this.currentDirection
      .clone()
      .multiplyScalar(this.currentStrength * currentStrength * deltaTime)
    body.velocity.add(currentForce)
  }

  /**
   * Apply all underwater physics effects
   * @param {Object} body - Physics body
   * @param {number} deltaTime - Time since last frame
   */
  applyUnderwaterEffects(body, deltaTime) {
    this.applyBuoyancy(body, deltaTime)
    this.applyDrag(body)
    this.applyCurrent(body, 1.0, deltaTime)
  }
}

/**
 * Main Physics Engine
 */
export class PhysicsEngine {
  constructor() {
    this.gravity = new THREE.Vector3(0, -9.8, 0)
    this.waterDensity = 1000 // kg/m³
    this.collisionSystem = new CollisionSystem()
    this.underwaterPhysics = new UnderwaterPhysics()
    this.rigidBodies = []
    this.isUnderwater = true // For now, everything is underwater
  }

  /**
   * Add a rigid body to the physics simulation
   * @param {Object} body - Physics body to add
   */
  addRigidBody(body) {
    this.rigidBodies.push(body)

    // Add to collision system if it has collision properties
    if (body.collisionType) {
      this.collisionSystem.addCollider(body, body.isStatic)
    }
  }

  /**
   * Remove a rigid body from the physics simulation
   * @param {Object} body - Physics body to remove
   */
  removeRigidBody(body) {
    const index = this.rigidBodies.indexOf(body)
    if (index !== -1) {
      this.rigidBodies.splice(index, 1)
      this.collisionSystem.removeCollider(body)
    }
  }

  /**
   * Update all physics bodies
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    for (const body of this.rigidBodies) {
      this.updateBody(body, deltaTime)
    }
  }

  /**
   * Update a single physics body
   * @param {Object} body - Physics body to update
   * @param {number} deltaTime - Time since last frame
   */
  updateBody(body, deltaTime) {
    if (body.isStatic) {
      return
    }

    // Initialize velocity if not present
    if (!body.velocity) {
      body.velocity = new THREE.Vector3()
    }

    // Store previous position for collision resolution
    const previousPosition = body.position.clone()

    // Apply forces based on environment
    if (this.isUnderwater) {
      this.underwaterPhysics.applyUnderwaterEffects(body, deltaTime)
    } else {
      // Apply gravity in air
      const gravityForce = this.gravity.clone().multiplyScalar(deltaTime)
      body.velocity.add(gravityForce)
    }

    // Apply velocity to position
    const velocityDelta = body.velocity.clone().multiplyScalar(deltaTime)
    body.position.add(velocityDelta)

    // Check collisions and resolve
    const collisions = this.collisionSystem.checkCollisions(body)
    if (collisions.length > 0) {
      this.resolveCollisions(body, collisions, previousPosition)
    }
  }

  /**
   * Resolve collisions for a body
   * @param {Object} body - Physics body that collided
   * @param {Array} collisions - Array of colliding objects
   * @param {THREE.Vector3} previousPosition - Position before collision
   */
  resolveCollisions(body, collisions, previousPosition) {
    // Check if any collisions are with collectibles that should not block movement
    const blockingCollisions = collisions.filter(
      collision => collision.type !== 'collectible' || collision.collected
    )

    // Only revert position and stop movement for blocking collisions
    if (blockingCollisions.length > 0) {
      // Simple collision resolution: revert to previous position and stop movement
      body.position.copy(previousPosition)

      // Reduce velocity on collision (bounce/friction)
      body.velocity.multiplyScalar(0.3)
    }

    // Notify collision callbacks if present (for all collisions)
    if (body.onCollision) {
      body.onCollision(collisions)
    }
  }

  /**
   * Check collisions for all bodies
   * @returns {Array} Array of collision pairs
   */
  checkCollisions() {
    const collisionPairs = []

    for (let i = 0; i < this.rigidBodies.length; i++) {
      const bodyA = this.rigidBodies[i]
      const collisions = this.collisionSystem.checkCollisions(bodyA)

      for (const bodyB of collisions) {
        collisionPairs.push([bodyA, bodyB])
      }
    }

    return collisionPairs
  }

  /**
   * Create a sphere collision body
   * @param {THREE.Vector3} position - Position of the sphere
   * @param {number} radius - Radius of the sphere
   * @param {boolean} isStatic - Whether the body is static
   * @returns {Object} Collision body
   */
  createSphereBody(position, radius, isStatic = false) {
    return {
      position: position.clone(),
      velocity: new THREE.Vector3(),
      collisionType: 'sphere',
      radius: radius,
      isStatic: isStatic,
    }
  }

  /**
   * Create a box collision body
   * @param {THREE.Vector3} position - Position of the box
   * @param {THREE.Vector3} size - Size of the box
   * @param {boolean} isStatic - Whether the body is static
   * @returns {Object} Collision body
   */
  createBoxBody(position, size, isStatic = false) {
    return {
      position: position.clone(),
      velocity: new THREE.Vector3(),
      collisionType: 'box',
      size: size.clone(),
      isStatic: isStatic,
    }
  }
}
