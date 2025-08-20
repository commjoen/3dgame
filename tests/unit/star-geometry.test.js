import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { StarGeometry } from '../../src/components/StarGeometry.js'

describe('StarGeometry (Phase 3 Enhancement)', () => {
  describe('Star Creation', () => {
    it('should create star geometry with default parameters', () => {
      const geometry = StarGeometry.create()
      
      expect(geometry).toBeInstanceOf(THREE.ExtrudeGeometry)
      expect(geometry.attributes.position).toBeDefined()
      expect(geometry.attributes.normal).toBeDefined()
    })

    it('should create star geometry with custom parameters', () => {
      const innerRadius = 0.3
      const outerRadius = 0.6
      const points = 6
      const depth = 0.2
      
      const geometry = StarGeometry.create(innerRadius, outerRadius, points, depth)
      
      expect(geometry).toBeInstanceOf(THREE.ExtrudeGeometry)
      expect(geometry.attributes.position).toBeDefined()
    })

    it('should create star material with default properties', () => {
      const material = StarGeometry.createMaterial()
      
      expect(material).toBeInstanceOf(THREE.MeshPhongMaterial)
      expect(material.color.getHex()).toBe(0xffd700)
      expect(material.emissive.getHex()).toBe(0xffd700)
      expect(material.emissiveIntensity).toBe(0.4)
      expect(material.transparent).toBe(true)
      expect(material.opacity).toBe(0.95)
    })

    it('should create star material with custom color and intensity', () => {
      const customColor = 0xff0000
      const customIntensity = 0.6
      
      const material = StarGeometry.createMaterial(customColor, customIntensity)
      
      expect(material.color.getHex()).toBe(customColor)
      expect(material.emissive.getHex()).toBe(customColor)
      expect(material.emissiveIntensity).toBe(customIntensity)
    })
  })

  describe('Star Variants', () => {
    it('should create multiple star variants', () => {
      const variants = StarGeometry.createVariants()
      
      expect(Array.isArray(variants)).toBe(true)
      expect(variants.length).toBe(5)
      
      variants.forEach(variant => {
        expect(variant).toHaveProperty('geometry')
        expect(variant).toHaveProperty('material')
        expect(variant).toHaveProperty('config')
        expect(variant.geometry).toBeInstanceOf(THREE.ExtrudeGeometry)
        expect(variant.material).toBeInstanceOf(THREE.MeshPhongMaterial)
      })
    })

    it('should create variants with different configurations', () => {
      const variants = StarGeometry.createVariants()
      
      // Check that variants have different properties
      const colors = variants.map(v => v.material.color.getHex())
      const configs = variants.map(v => v.config)
      
      // Should have different colors
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBeGreaterThan(1)
      
      // Should have different inner/outer radii
      const uniqueInner = new Set(configs.map(c => c.inner))
      const uniqueOuter = new Set(configs.map(c => c.outer))
      expect(uniqueInner.size).toBeGreaterThan(1)
      expect(uniqueOuter.size).toBeGreaterThan(1)
    })
  })

  describe('Star Geometry Properties', () => {
    it('should create centered geometry', () => {
      const geometry = StarGeometry.create()
      
      // Check that geometry is centered by computing bounding box
      geometry.computeBoundingBox()
      const box = geometry.boundingBox
      
      // The center should be close to origin (within reasonable tolerance)
      const center = box.getCenter(new THREE.Vector3())
      expect(Math.abs(center.x)).toBeLessThan(0.1)
      expect(Math.abs(center.y)).toBeLessThan(0.1)
      expect(Math.abs(center.z)).toBeLessThan(0.1)
    })

    it('should have appropriate vertex count for star shape', () => {
      const geometry = StarGeometry.create()
      
      // Star geometry should have a reasonable number of vertices
      const positionAttribute = geometry.attributes.position
      const vertexCount = positionAttribute.count
      
      expect(vertexCount).toBeGreaterThan(50) // Should be complex enough for a star
      expect(vertexCount).toBeLessThan(1000) // But not too complex for performance
    })
  })
})