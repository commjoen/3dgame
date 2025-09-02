import { describe, it, expect } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

describe('GitHub Pages Deployment Verification', () => {
  it('should build and verify GitHub Pages deployment files', async () => {
    // Set up environment for GitHub Pages build
    const originalBasePath = process.env.VITE_BASE_PATH
    process.env.VITE_BASE_PATH = '/3dgame/'
    
    try {
      // Clean and build
      await execAsync('rm -rf dist')
      await execAsync('npm run build')
      
      const distPath = path.join(process.cwd(), 'dist')
    
    // 1. Check for 404.html file for SPA routing
    const html404Path = path.join(distPath, '404.html')
    expect(existsSync(html404Path)).toBe(true)
    
    const html404Content = readFileSync(html404Path, 'utf-8')
    expect(html404Content).toContain('/3dgame/')
    expect(html404Content).toContain('window.location.replace')

    // 2. Check JavaScript module paths in index.html
    const indexPath = path.join(distPath, 'index.html')
    expect(existsSync(indexPath)).toBe(true)
    
    const indexContent = readFileSync(indexPath, 'utf-8')
    
    // Should have script tags with /3dgame/ prefix
    expect(indexContent).toMatch(/src="\/3dgame\/assets\/.*\.js"/)
    
    // Should have module preload with correct paths
    expect(indexContent).toMatch(/href="\/3dgame\/assets\/.*\.js"/)
    
    // Should have manifest and favicon with correct paths
    expect(indexContent).toContain('href="/3dgame/manifest.json"')
    expect(indexContent).toContain('href="/3dgame/favicon.ico"')

    // 3. Check manifest.webmanifest with correct start_url
    const manifestPath = path.join(distPath, 'manifest.webmanifest')
    expect(existsSync(manifestPath)).toBe(true)
    
    const manifestContent = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)
    
    expect(manifest.start_url).toBe('/3dgame/')
    expect(manifest.scope).toBe('/3dgame/')
    expect(manifest.name).toBe('Ocean Adventure')

    // 4. Check service worker exists
    const swPath = path.join(distPath, 'sw.js')
    expect(existsSync(swPath)).toBe(true)

    // 5. Check all required static assets
    const requiredFiles = [
      'index.html',
      '404.html',
      'favicon.ico',
      'manifest.json',
      'manifest.webmanifest',
      'sw.js',
      'registerSW.js'
    ]
    
    for (const file of requiredFiles) {
      const filePath = path.join(distPath, file)
      expect(existsSync(filePath)).toBe(true)
    }
    
    // Check for assets directory
    const assetsPath = path.join(distPath, 'assets')
    expect(existsSync(assetsPath)).toBe(true)
    } finally {
      // Restore original environment variable
      if (originalBasePath !== undefined) {
        process.env.VITE_BASE_PATH = originalBasePath
      } else {
        delete process.env.VITE_BASE_PATH
      }
    }
  }, 30000) // 30 second timeout for build
})