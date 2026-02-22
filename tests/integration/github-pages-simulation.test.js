/**
 * GitHub Pages Deployment Test - Simulates GitHub Pages environment
 * 
 * This test serves the built application and simulates what happens
 * when accessing the application via GitHub Pages
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import http from 'http'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

describe('GitHub Pages Deployment Simulation', () => {
  let server
  let distPath
  const PORT = 8080
  const BASE_URL = `http://localhost:${PORT}`

  beforeAll(async () => {
    // Build the application for GitHub Pages using unique directory
    const testId = 'github-pages-simulation-' + Date.now()
    distPath = path.join(process.cwd(), 'dist-' + testId)
    const env = { 
      ...process.env, 
      VITE_BASE_PATH: '/3dgame/',
      VITE_OUT_DIR: distPath
    }
    await execAsync(`rm -rf "${distPath}"`, { env })
    await execAsync('npm run build', { env })

    // Pre-build a map of allowed files by scanning the dist directory.
    // Values in this map are trusted paths derived from the filesystem scan,
    // not from user input, which prevents uncontrolled path expression issues.
    const allowedFiles = new Map()
    const scanDirectory = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          scanDirectory(fullPath)
        } else {
          const relPath = path.relative(distPath, fullPath)
          allowedFiles.set(relPath, fullPath)
        }
      }
    }
    scanDirectory(distPath)

    // Create a simple static server that simulates GitHub Pages
    server = http.createServer((req, res) => {
      // Strip query string to get just the pathname
      const urlPath = req.url.split('?')[0]

      // GitHub Pages routing simulation
      let servePath = urlPath
      if (servePath === '/3dgame/' || servePath === '/3dgame') {
        servePath = '/3dgame/index.html'
      }

      // Remove /3dgame prefix and normalize to get relative path for lookup
      const cleanPath = servePath.replace('/3dgame', '')
      const relPath = path.normalize(cleanPath === '/' ? 'index.html' : cleanPath.replace(/^[/\\]+/, ''))

      // Reject any path that escapes the dist root (e.g. traversal via '..')
      if (relPath.startsWith('..') || path.isAbsolute(relPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not Found')
        return
      }

      // Look up in the pre-built allowed files map.
      // The value returned from the map is a trusted path from the filesystem scan,
      // not derived from user input, breaking the taint chain.
      const trustedPath = allowedFiles.get(relPath) ?? allowedFiles.get('404.html')

      if (trustedPath && fs.existsSync(trustedPath)) {
        const stat = fs.statSync(trustedPath)
        if (stat.isFile()) {
          const ext = path.extname(trustedPath)
          const contentType = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.ico': 'image/x-icon',
            '.json': 'application/json',
            '.webmanifest': 'application/manifest+json'
          }[ext] || 'text/plain'

          res.writeHead(200, { 'Content-Type': contentType })
          fs.createReadStream(trustedPath).pipe(res)
          return
        }
      }

      // Default 404
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    })

    // Start server
    await new Promise((resolve) => {
      server.listen(PORT, resolve)
    })
  }, 30000)

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve)
      })
    }
    // Cleanup test directory
    if (distPath) {
      await execAsync(`rm -rf "${distPath}"`).catch(() => {})
    }
  })

  it('should serve the main page at /3dgame/ path', async () => {
    const response = await fetch(`${BASE_URL}/3dgame/`)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    
    const html = await response.text()
    expect(html).toContain('Ocean Adventure')
    expect(html).toContain('gameCanvas')
  })

  it('should serve JavaScript modules with correct paths', async () => {
    // First get the main page to extract the script URL
    const htmlResponse = await fetch(`${BASE_URL}/3dgame/`)
    const html = await htmlResponse.text()
    
    // Extract the main script URL
    const scriptMatch = html.match(/src="(\/3dgame\/assets\/index-[^"]+\.js)"/)
    expect(scriptMatch).toBeTruthy()
    
    const scriptUrl = scriptMatch[1]
    const jsResponse = await fetch(`${BASE_URL}${scriptUrl}`)
    
    expect(jsResponse.status).toBe(200)
    expect(jsResponse.headers.get('content-type')).toContain('application/javascript')
  })

  it('should serve the manifest file correctly', async () => {
    const response = await fetch(`${BASE_URL}/3dgame/manifest.webmanifest`)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/manifest+json')
    
    const manifest = await response.json()
    expect(manifest.start_url).toBe('/3dgame/')
  })

  it('should handle SPA routing with 404.html fallback', async () => {
    const response = await fetch(`${BASE_URL}/3dgame/some/deep/route`)
    
    expect(response.status).toBe(200) // 404.html should be served as 200
    
    const html = await response.text()
    expect(html).toContain('/3dgame/')
    expect(html).toContain('window.location.replace')
  })

  it('should serve static assets correctly', async () => {
    const faviconResponse = await fetch(`${BASE_URL}/3dgame/favicon.ico`)
    expect(faviconResponse.status).toBe(200)
    
    const registerSWResponse = await fetch(`${BASE_URL}/3dgame/registerSW.js`)
    expect(registerSWResponse.status).toBe(200)
    expect(registerSWResponse.headers.get('content-type')).toContain('application/javascript')
  })
})