import { describe, it, expect } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

describe('GitHub Pages Deployment Verification', () => {
  it('should build correctly for GitHub Pages deployment', async () => {
    // Set up environment for GitHub Pages build
    const originalBasePath = process.env.VITE_BASE_PATH
    process.env.VITE_BASE_PATH = '/3dgame/'
    
    try {
      // Clean and build
      await execAsync('rm -rf dist')
      await execAsync('npm run build')
      
      const distPath = path.join(process.cwd(), 'dist')
    
    // 1. Check for essential files
    const indexPath = path.join(distPath, 'index.html')
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    
    // 2. Verify correct base paths in HTML
    expect(indexContent).toContain('href="/3dgame/favicon.ico"')
    expect(indexContent).toContain('href="/3dgame/manifest.json"')
    
    // 3. Verify script and CSS paths use /3dgame/ prefix
    expect(indexContent).toMatch(/src="\/3dgame\/assets\/.*\.js"/)
    
    // 4. Check for 404.html file (required for SPA routing on GitHub Pages)
    const html404Path = path.join(distPath, '404.html')
    const html404Exists = await fs.access(html404Path).then(() => true).catch(() => false)
    expect(html404Exists).toBe(true)
    
    // 5. Verify 404.html contains redirect logic
    const html404Content = await fs.readFile(html404Path, 'utf-8')
    expect(html404Content).toContain('/3dgame/')
    expect(html404Content).toContain('window.location.replace')
    
    // 6. Check manifest.webmanifest has correct start_url
    const manifestPath = path.join(distPath, 'manifest.webmanifest')
    const manifestContent = await fs.readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)
    expect(manifest.start_url).toBe('/3dgame/')
    expect(manifest.scope).toBe('/3dgame/')
    
    // 7. Verify service worker exists
    const swPath = path.join(distPath, 'sw.js')
    const swExists = await fs.access(swPath).then(() => true).catch(() => false)
    expect(swExists).toBe(true)
    
    // 8. Check for required assets
    const assetsPath = path.join(distPath, 'assets')
    const assetsExists = await fs.access(assetsPath).then(() => true).catch(() => false)
    expect(assetsExists).toBe(true)
    } finally {
      // Restore original environment variable
      if (originalBasePath !== undefined) {
        process.env.VITE_BASE_PATH = originalBasePath
      } else {
        delete process.env.VITE_BASE_PATH
      }
    }
  }, 60000) // 60 second timeout for build
})