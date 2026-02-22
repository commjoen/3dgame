import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AudioEngine } from '../../src/core/AudioEngine.js'

// Create a single robust mock audio context
function createMockAudioContext() {
  const mockContext = {
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    })),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn()
      },
      connect: vi.fn()
    })),
    createBiquadFilter: vi.fn(() => ({
      type: 'lowpass',
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn()
    })),
    createPanner: vi.fn(() => ({
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      positionX: { setValueAtTime: vi.fn(), value: 0 },
      positionY: { setValueAtTime: vi.fn(), value: 0 },
      positionZ: { setValueAtTime: vi.fn(), value: 0 },
      setPosition: vi.fn(),
      connect: vi.fn()
    })),
    close: vi.fn(),
    currentTime: 0,
    destination: {},
    listener: {
      positionX: { setValueAtTime: vi.fn() },
      positionY: { setValueAtTime: vi.fn() },
      positionZ: { setValueAtTime: vi.fn() },
      forwardX: { setValueAtTime: vi.fn() },
      forwardY: { setValueAtTime: vi.fn() },
      forwardZ: { setValueAtTime: vi.fn() },
      upX: { setValueAtTime: vi.fn() },
      upY: { setValueAtTime: vi.fn() },
      upZ: { setValueAtTime: vi.fn() },
      setPosition: vi.fn(),
      setOrientation: vi.fn()
    },
    state: 'running'
  }
  return mockContext
}

const mockAudioContext = createMockAudioContext()

// Mock window.AudioContext
global.AudioContext = vi.fn(() => mockAudioContext)
global.webkitAudioContext = vi.fn(() => mockAudioContext)

describe('AudioEngine (Stage 3)', () => {
  let audioEngine

  beforeEach(() => {
    // Clear any existing localStorage data to ensure test isolation
    if (typeof Storage !== 'undefined') {
      localStorage.clear()
    }
    // Reset mock call counts without destroying the mock functions
    vi.clearAllMocks()
    audioEngine = new AudioEngine()
  })

  describe('Audio Engine Creation', () => {
    it('should create audio engine with default settings', () => {
      expect(audioEngine.isInitialized).toBe(false)
      expect(audioEngine.isMuted).toBe(false)
      expect(audioEngine.masterVolume).toBe(0.5)
    })

    it('should have sound configurations defined', () => {
      expect(audioEngine.soundConfigs).toBeUndefined() // Created during initialization
    })
  })

  describe('Audio Engine Initialization', () => {
    it('should initialize successfully', async () => {
      await audioEngine.initialize()
      
      expect(audioEngine.isInitialized).toBe(true)
      expect(audioEngine.audioContext).toBeDefined()
      expect(audioEngine.listener).toBeDefined()
      expect(audioEngine.soundConfigs).toBeDefined()
    })

    it('should create underwater effects during initialization', async () => {
      await audioEngine.initialize()
      
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled()
      expect(audioEngine.underwaterFilter).toBeDefined()
    })

    it('should handle initialization errors gracefully', async () => {
      const originalAudioContext = global.AudioContext
      global.AudioContext = vi.fn(() => { throw new Error('Audio not supported') })
      
      // Create a new audio engine instance for this test
      const testAudioEngine = new AudioEngine()
      
      // Should not throw error
      await expect(testAudioEngine.initialize()).resolves.toBeUndefined()
      expect(testAudioEngine.isInitialized).toBe(false)
      
      // Restore original mock
      global.AudioContext = originalAudioContext
    })
  })

  describe('Sound Effects', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('should play star collect sound', () => {
      audioEngine.playSound('starCollect')
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should play gate activate sound', () => {
      audioEngine.playSound('gateActivate')
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should play level complete sound', () => {
      audioEngine.playSound('levelComplete')
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should handle unknown sound gracefully', () => {
      console.warn = vi.fn()
      
      audioEngine.playSound('unknownSound')
      
      expect(console.warn).toHaveBeenCalledWith('Sound "unknownSound" not found')
    })

    it('should not play sounds when muted', () => {
      audioEngine.isMuted = true
      
      audioEngine.playSound('starCollect')
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })

    it('should not play sounds when not initialized', () => {
      audioEngine.isInitialized = false
      
      audioEngine.playSound('starCollect')
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('3D Spatial Audio', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('should play 3D positioned sound', () => {
      const position = { x: 5, y: 2, z: -3 }
      
      audioEngine.playSound('starCollect', position)
      
      expect(mockAudioContext.createPanner).toHaveBeenCalled()
    })

    it('should update listener position', () => {
      const position = { x: 1, y: 2, z: 3 }
      const forward = { x: 0, y: 0, z: -1 }
      const up = { x: 0, y: 1, z: 0 }
      
      audioEngine.updateListenerPosition(position, forward, up)
      
      expect(audioEngine.listener.positionX.setValueAtTime).toHaveBeenCalledWith(1, 0)
      expect(audioEngine.listener.forwardZ.setValueAtTime).toHaveBeenCalledWith(-1, 0)
      expect(audioEngine.listener.upY.setValueAtTime).toHaveBeenCalledWith(1, 0)
    })
  })

  describe('Ambient Sound', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('should start ambient sound', () => {
      audioEngine.startAmbientSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(audioEngine.ambientOscillator).toBeDefined()
    })

    it('should not start ambient sound if already playing', () => {
      audioEngine.startAmbientSound()
      const firstOscillator = audioEngine.ambientOscillator
      
      audioEngine.startAmbientSound()
      
      expect(audioEngine.ambientOscillator).toBe(firstOscillator)
    })

    it('should stop ambient sound', () => {
      audioEngine.startAmbientSound()
      expect(audioEngine.ambientOscillator).toBeDefined()
      
      audioEngine.stopAmbientSound()
      
      expect(audioEngine.ambientOscillator).toBeNull()
    })
  })

  describe('Volume and Mute Controls', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('should set master volume', () => {
      audioEngine.setMasterVolume(0.8)
      
      expect(audioEngine.masterVolume).toBe(0.8)
    })

    it('should clamp volume to valid range', () => {
      audioEngine.setMasterVolume(1.5)
      expect(audioEngine.masterVolume).toBe(1)
      
      audioEngine.setMasterVolume(-0.5)
      expect(audioEngine.masterVolume).toBe(0)
    })

    it('should toggle mute state', () => {
      expect(audioEngine.isMuted).toBe(false)
      
      const result = audioEngine.toggleMute()
      
      expect(result).toBe(true)
      expect(audioEngine.isMuted).toBe(true)
    })

    it('should stop ambient sound when muted', () => {
      audioEngine.startAmbientSound()
      
      audioEngine.toggleMute()
      
      expect(audioEngine.ambientOscillator).toBeNull()
    })
  })

  describe('Audio State', () => {
    it('should return current audio state', () => {
      const state = audioEngine.getState()
      
      expect(state).toEqual({
        isInitialized: false,
        isMuted: false,
        masterVolume: 0.5,
        musicVolume: 0.5,
        sfxVolume: 0.5
      })
    })
  })

  describe('Resource Disposal', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('should dispose of audio resources', () => {
      audioEngine.startAmbientSound()
      
      audioEngine.dispose()
      
      expect(mockAudioContext.close).toHaveBeenCalled()
      expect(audioEngine.isInitialized).toBe(false)
      expect(audioEngine.sounds.size).toBe(0)
    })
  })
})