// Test setup file for vitest
import { vi } from 'vitest'

// Mock WebGL context for testing
const mockWebGLContext = {
  canvas: {},
  getExtension: vi.fn(),
  getParameter: vi.fn(),
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  createProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  useProgram: vi.fn(),
  createBuffer: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  getUniformLocation: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  drawArrays: vi.fn(),
  viewport: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  enable: vi.fn(),
  depthFunc: vi.fn(),
  blendFunc: vi.fn()
}

// Mock HTMLCanvasElement
global.HTMLCanvasElement = class HTMLCanvasElement {
  constructor() {
    this.width = 800
    this.height = 600
  }
  
  getContext(type) {
    if (type === 'webgl' || type === 'webgl2') {
      return mockWebGLContext
    }
    return null
  }
  
  addEventListener() {}
  removeEventListener() {}
}

// Mock document.getElementById
global.document = {
  ...global.document,
  getElementById: vi.fn((id) => {
    if (id === 'gameCanvas') {
      return new HTMLCanvasElement()
    }
    return {
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      },
      textContent: ''
    }
  })
}

// Mock window.requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16) // 60fps
})

// Mock performance.now
global.performance = {
  now: vi.fn(() => Date.now())
}

// Mock navigator for mobile detection
Object.defineProperty(global.navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  configurable: true
})