/**
 * Star Geometry for Ocean Adventure
 *
 * Creates actual star-shaped geometry instead of simple spheres
 * for more realistic collectible stars.
 */

import * as THREE from 'three'

export class StarGeometry {
  /**
   * Create a 3D star shape with specified parameters
   * @param {number} innerRadius - Inner radius of the star points
   * @param {number} outerRadius - Outer radius of the star points
   * @param {number} points - Number of star points (default: 5)
   * @param {number} depth - Depth/thickness of the star (default: 0.1)
   */
  static create(innerRadius = 0.2, outerRadius = 0.4, points = 5, depth = 0.1) {
    // Create star shape using Three.js Shape
    const starShape = new THREE.Shape()
    
    // Calculate star points
    const angleStep = (Math.PI * 2) / points
    const halfAngleStep = angleStep / 2
    
    // Start at the top point
    let angle = -Math.PI / 2 // Start at top
    starShape.moveTo(
      Math.cos(angle) * outerRadius,
      Math.sin(angle) * outerRadius
    )
    
    // Create star points by alternating between outer and inner radius
    for (let i = 0; i < points; i++) {
      // Inner point
      angle += halfAngleStep
      starShape.lineTo(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      )
      
      // Outer point
      angle += halfAngleStep
      starShape.lineTo(
        Math.cos(angle) * outerRadius,
        Math.sin(angle) * outerRadius
      )
    }
    
    // Extrude the shape to create 3D star
    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02
    }
    
    const starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings)
    
    // Center the geometry
    starGeometry.center()
    
    return starGeometry
  }
  
  /**
   * Create a simple star material with glowing effects
   * @param {number} color - Base color (default: gold)
   * @param {number} emissiveIntensity - Glow intensity (default: 0.4)
   */
  static createMaterial(color = 0xffd700, emissiveIntensity = 0.4) {
    return new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: emissiveIntensity,
      shininess: 100,
      specular: 0xffffff,
      transparent: true,
      opacity: 0.95,
    })
  }
  
  /**
   * Create multiple star variants with different sizes and colors
   */
  static createVariants() {
    const variants = []
    
    // Different star sizes and colors
    const configs = [
      { inner: 0.15, outer: 0.35, color: 0xffd700 }, // Classic gold
      { inner: 0.18, outer: 0.38, color: 0xffff80 }, // Light yellow
      { inner: 0.12, outer: 0.32, color: 0xffa500 }, // Orange
      { inner: 0.20, outer: 0.40, color: 0xfffacd }, // Light gold
      { inner: 0.16, outer: 0.36, color: 0xffb347 }, // Sandy brown
    ]
    
    configs.forEach((config, index) => {
      const geometry = StarGeometry.create(config.inner, config.outer)
      const material = StarGeometry.createMaterial(config.color)
      variants.push({ geometry, material, config })
    })
    
    return variants
  }
}