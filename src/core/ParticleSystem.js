/**
 * Particle System for Ocean Adventure
 *
 * Creates underwater atmosphere with bubbles, light rays,
 * and collection effects for enhanced immersion.
 */

import * as THREE from 'three'

/**
 * Individual particle class
 */
class Particle {
  constructor(position, velocity, life, size, color) {
    this.position = position.clone()
    this.velocity = velocity.clone()
    this.life = life
    this.maxLife = life
    this.size = size
    this.color = color.clone()
    this.alpha = 1.0
    this.active = true
  }

  /**
   * Update particle state
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    if (!this.active) {
      return
    }

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime))

    // Update life
    this.life -= deltaTime

    // Update alpha based on life remaining
    this.alpha = this.life / this.maxLife

    // Deactivate particle if life is over
    if (this.life <= 0) {
      this.active = false
    }
  }

  /**
   * Reset particle with new properties
   * @param {THREE.Vector3} position - New position
   * @param {THREE.Vector3} velocity - New velocity
   * @param {number} life - New life span
   * @param {number} size - New size
   * @param {THREE.Color} color - New color
   */
  reset(position, velocity, life, size, color) {
    this.position.copy(position)
    this.velocity.copy(velocity)
    this.life = life
    this.maxLife = life
    this.size = size
    this.color.copy(color)
    this.alpha = 1.0
    this.active = true
  }
}

/**
 * Main particle system class
 */
export class ParticleSystem {
  constructor(scene, maxParticles = 1000) {
    this.scene = scene
    this.maxParticles = maxParticles
    this.particles = []
    this.emitters = []

    // Create particle pool
    this.initializeParticlePool()

    // Create particle geometry and material
    this.createParticleRenderSystem()

    // Add default underwater emitters
    this.createUnderwaterEmitters()
  }

  /**
   * Initialize the particle pool for object reuse
   */
  initializeParticlePool() {
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = new Particle(
        new THREE.Vector3(),
        new THREE.Vector3(),
        1.0,
        1.0,
        new THREE.Color(0xffffff)
      )
      particle.active = false
      this.particles.push(particle)
    }
  }

  /**
   * Create the rendering system for particles
   */
  createParticleRenderSystem() {
    // Create geometry for point sprites
    this.geometry = new THREE.BufferGeometry()

    // Create arrays for particle attributes
    this.positions = new Float32Array(this.maxParticles * 3)
    this.colors = new Float32Array(this.maxParticles * 3)
    this.sizes = new Float32Array(this.maxParticles)
    this.alphas = new Float32Array(this.maxParticles)

    // Set attributes
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    )
    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colors, 3)
    )
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute(
      'alpha',
      new THREE.BufferAttribute(this.alphas, 1)
    )

    // Create shader material for better underwater effects
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        pointTexture: { value: this.createParticleTexture() },
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vAlpha = alpha;
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, vAlpha * texColor.a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    // Create points object
    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)
  }

  /**
   * Create texture for particles
   * @returns {THREE.Texture} Particle texture
   */
  createParticleTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64

    const context = canvas.getContext('2d')
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)

    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }

  /**
   * Create underwater particle emitters
   */
  createUnderwaterEmitters() {
    // Bubble emitter
    this.addEmitter({
      type: 'bubbles',
      position: new THREE.Vector3(0, -10, 0),
      rate: 5, // particles per second
      life: 8.0,
      size: { min: 2, max: 6 },
      velocity: new THREE.Vector3(0, 2, 0),
      velocityVariation: new THREE.Vector3(0.5, 0.5, 0.5),
      color: new THREE.Color(0x87ceeb),
      colorVariation: 0.1,
      area: new THREE.Vector3(20, 2, 20), // Emission area
    })

    // Floating particles (debris/plankton)
    this.addEmitter({
      type: 'debris',
      position: new THREE.Vector3(0, 0, 0),
      rate: 3,
      life: 15.0,
      size: { min: 1, max: 3 },
      velocity: new THREE.Vector3(0.1, 0.05, 0.1),
      velocityVariation: new THREE.Vector3(0.3, 0.2, 0.3),
      color: new THREE.Color(0xffffff),
      colorVariation: 0.2,
      area: new THREE.Vector3(40, 20, 40),
    })

    // Light rays effect (very sparse)
    this.addEmitter({
      type: 'lightRays',
      position: new THREE.Vector3(0, 15, 0),
      rate: 0.5,
      life: 20.0,
      size: { min: 8, max: 15 },
      velocity: new THREE.Vector3(0, -0.5, 0),
      velocityVariation: new THREE.Vector3(0.1, 0.2, 0.1),
      color: new THREE.Color(0xffd700),
      colorVariation: 0.1,
      area: new THREE.Vector3(30, 5, 30),
    })
  }

  /**
   * Add a particle emitter
   * @param {Object} emitterConfig - Configuration for the emitter
   */
  addEmitter(emitterConfig) {
    const emitter = {
      ...emitterConfig,
      accumulator: 0.0, // For rate control
      active: true,
    }
    this.emitters.push(emitter)
  }

  /**
   * Emit a single particle
   * @param {Object} emitter - Emitter configuration
   */
  emitParticle(emitter) {
    // Find inactive particle
    const particle = this.particles.find(p => !p.active)
    if (!particle) {
      return
    } // No available particles

    // Calculate random position within emission area
    const position = emitter.position
      .clone()
      .add(
        new THREE.Vector3(
          (Math.random() - 0.5) * emitter.area.x,
          (Math.random() - 0.5) * emitter.area.y,
          (Math.random() - 0.5) * emitter.area.z
        )
      )

    // Calculate random velocity
    const velocity = emitter.velocity
      .clone()
      .add(
        new THREE.Vector3(
          (Math.random() - 0.5) * emitter.velocityVariation.x,
          (Math.random() - 0.5) * emitter.velocityVariation.y,
          (Math.random() - 0.5) * emitter.velocityVariation.z
        )
      )

    // Calculate random size
    const size =
      emitter.size.min + Math.random() * (emitter.size.max - emitter.size.min)

    // Calculate random color
    const color = emitter.color.clone()
    if (emitter.colorVariation > 0) {
      color.offsetHSL(
        (Math.random() - 0.5) * emitter.colorVariation,
        0,
        (Math.random() - 0.5) * emitter.colorVariation * 0.5
      )
    }

    // Reset particle with new properties
    particle.reset(position, velocity, emitter.life, size, color)
  }

  /**
   * Create a burst of particles at a specific location
   * @param {THREE.Vector3} position - Position to emit particles
   * @param {Object} config - Burst configuration
   */
  createBurst(position, config = {}) {
    const count = config.count || 20
    const life = config.life || 2.0
    const velocity = config.velocity || new THREE.Vector3(0, 1, 0)
    const velocityVariation =
      config.velocityVariation || new THREE.Vector3(2, 2, 2)
    const color = config.color || new THREE.Color(0xffd700)
    const size = config.size || { min: 2, max: 8 }

    for (let i = 0; i < count; i++) {
      const particle = this.particles.find(p => !p.active)
      if (!particle) {
        break
      }

      const burstVelocity = velocity
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * velocityVariation.x,
            (Math.random() - 0.5) * velocityVariation.y,
            (Math.random() - 0.5) * velocityVariation.z
          )
        )

      const particleSize = size.min + Math.random() * (size.max - size.min)

      particle.reset(position.clone(), burstVelocity, life, particleSize, color)
    }
  }

  /**
   * Update particle system
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Update emitters
    for (const emitter of this.emitters) {
      if (!emitter.active) {
        continue
      }

      emitter.accumulator += deltaTime
      const emissionInterval = 1.0 / emitter.rate

      while (emitter.accumulator >= emissionInterval) {
        this.emitParticle(emitter)
        emitter.accumulator -= emissionInterval
      }
    }

    // Update particles
    let activeCount = 0
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]

      if (particle.active) {
        particle.update(deltaTime)

        // Update render attributes
        const index3 = activeCount * 3
        this.positions[index3] = particle.position.x
        this.positions[index3 + 1] = particle.position.y
        this.positions[index3 + 2] = particle.position.z

        this.colors[index3] = particle.color.r
        this.colors[index3 + 1] = particle.color.g
        this.colors[index3 + 2] = particle.color.b

        this.sizes[activeCount] = particle.size
        this.alphas[activeCount] = particle.alpha

        activeCount++
      }
    }

    // Update geometry
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
    this.geometry.attributes.size.needsUpdate = true
    this.geometry.attributes.alpha.needsUpdate = true

    // Update draw range to only render active particles
    this.geometry.setDrawRange(0, activeCount)

    // Update shader uniforms
    this.material.uniforms.time.value += deltaTime
  }

  /**
   * Set emitter active state
   * @param {string} type - Emitter type
   * @param {boolean} active - Whether emitter should be active
   */
  setEmitterActive(type, active) {
    const emitter = this.emitters.find(e => e.type === type)
    if (emitter) {
      emitter.active = active
    }
  }

  /**
   * Remove all particles
   */
  clear() {
    for (const particle of this.particles) {
      particle.active = false
    }
  }

  /**
   * Dispose of particle system resources
   */
  dispose() {
    this.scene.remove(this.points)
    this.geometry.dispose()
    this.material.dispose()
    if (this.material.uniforms.pointTexture.value) {
      this.material.uniforms.pointTexture.value.dispose()
    }
  }
}
