import { describe, it, expect } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

describe('GitHub Pages Build', () => {
  it('should generate correct base paths for GitHub Pages deployment', async () => {
    // Set up environment for GitHub Pages build
    const env = { ...process.env, VITE_BASE_PATH: '/3dgame/' }
    
    // Clean and build
    await execAsync('rm -rf dist', { env })
    await execAsync('npm run build', { env })
    
    // Read the generated index.html
    const indexPath = path.join(process.cwd(), 'dist', 'index.html')
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    
    // Verify base paths are correctly set
    expect(indexContent).toContain('href="/3dgame/favicon.ico"')
    expect(indexContent).toContain('href="/3dgame/manifest.json"')
    
    // Verify script tags have correct paths
    expect(indexContent).toMatch(/src="\/3dgame\/assets\/.*\.js"/)
    
    // Verify manifest file exists
    const manifestPath = path.join(process.cwd(), 'dist', 'manifest.webmanifest')
    const manifestExists = await fs.access(manifestPath).then(() => true).catch(() => false)
    expect(manifestExists).toBe(true)
    
    // Verify assets directory exists
    const assetsPath = path.join(process.cwd(), 'dist', 'assets')
    const assetsExists = await fs.access(assetsPath).then(() => true).catch(() => false)
    expect(assetsExists).toBe(true)
  }, 30000) // 30 second timeout for build
})