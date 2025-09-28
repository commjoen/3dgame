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

    // Create a simple static server that simulates GitHub Pages
    server = http.createServer((req, res) => {
      // Handle the base path routing
      let filePath = req.url
      
      // GitHub Pages routing simulation
      if (filePath === '/3dgame/' || filePath === '/3dgame') {
        filePath = '/3dgame/index.html'
      }
      
      // Remove /3dgame prefix for file system access
      const cleanPath = filePath.replace('/3dgame', '')
      let fsPath = path.join(distPath, cleanPath === '/' ? 'index.html' : cleanPath)
      
      // --- Hardening: Normalize and confine fsPath to distPath root directory ---
      let safeFsPath = null;
      try {
        // Resolve fsPath and distPath as absolute canonical paths
        const fsPathResolved = fs.realpathSync(path.resolve(fsPath));
        const distRootResolved = fs.realpathSync(path.resolve(distPath));

        // Ensure fsPathResolved is within distRootResolved (avoid partial prefix issues)
        if (
          fsPathResolved !== distRootResolved &&
          !fsPathResolved.startsWith(distRootResolved + path.sep)
        ) {
          // Not allowed: path traversal attempt
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not Found')
          return
        }
        // Only use resolved path if validated
        safeFsPath = fsPathResolved;
      } catch (err) {
        // Path does not exist or could not resolve: serve 404 immediately
        // Try serving distPath/404.html instead
        try {
          const error404Path = path.join(distPath, '404.html');
          const error404PathResolved = fs.realpathSync(path.resolve(error404Path));
          const distRootResolved = fs.realpathSync(path.resolve(distPath));
          if (
            error404PathResolved !== distRootResolved &&
            !error404PathResolved.startsWith(distRootResolved + path.sep)
          ) {
            // 404.html is not in root: refuse as well
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('Not Found')
            return;
          }
          safeFsPath = error404PathResolved;
        } catch (err404) {
          // Even 404.html is missing; fail safe
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }
      }

      if (safeFsPath && fs.existsSync(safeFsPath)) {
        const stat = fs.statSync(safeFsPath)
        if (stat.isFile()) {
          const ext = path.extname(safeFsPath)
          const contentType = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.ico': 'image/x-icon',
            '.json': 'application/json',
            '.webmanifest': 'application/manifest+json'
          }[ext] || 'text/plain'

          res.writeHead(200, { 'Content-Type': contentType })
          fs.createReadStream(safeFsPath).pipe(res)
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