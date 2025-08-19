/**
 * Audio Engine for Ocean Adventure
 *
 * Handles underwater ambient sounds, sound effects, and 3D spatial audio
 * using Web Audio API for immersive underwater experience.
 */

export class AudioEngine {
  constructor() {
    this.audioContext = null
    this.listener = null
    this.sounds = new Map()
    this.isInitialized = false
    this.isMuted = false
    this.masterVolume = 0.5
    
    // Audio settings
    this.underwaterFilterFrequency = 800 // Low-pass filter for underwater effect
    this.reverbAmount = 0.3
    
    console.log('🔊 AudioEngine created')
  }
  
  /**
   * Initialize the audio system
   * Note: Must be called after user interaction due to browser autoplay policies
   */
  async initialize() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create audio listener for 3D spatial audio
      this.listener = this.audioContext.listener
      
      // Create master gain node for volume control
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime)
      this.masterGain.connect(this.audioContext.destination)
      
      // Create underwater effect chain
      this.createUnderwaterEffects()
      
      // Load basic sound effects (using simple oscillators for now - avoiding file dependencies)
      this.createSoundEffects()
      
      this.isInitialized = true
      console.log('✅ AudioEngine initialized successfully')
      
    } catch (error) {
      console.warn('⚠️ AudioEngine initialization failed:', error)
      // Graceful fallback - game continues without audio
    }
  }
  
  /**
   * Create underwater audio effects (reverb, low-pass filter)
   */
  createUnderwaterEffects() {
    if (!this.audioContext) return
    
    // Low-pass filter for muffled underwater sound
    this.underwaterFilter = this.audioContext.createBiquadFilter()
    this.underwaterFilter.type = 'lowpass'
    this.underwaterFilter.frequency.setValueAtTime(
      this.underwaterFilterFrequency, 
      this.audioContext.currentTime
    )
    this.underwaterFilter.Q.setValueAtTime(1, this.audioContext.currentTime)
    
    // Connect filter to master gain
    this.underwaterFilter.connect(this.masterGain)
    
    console.log('🌊 Underwater audio effects created')
  }
  
  /**
   * Create basic sound effects using oscillators
   * This avoids external file dependencies while providing audio feedback
   */
  createSoundEffects() {
    if (!this.audioContext) return
    
    // Pre-define sound configurations
    this.soundConfigs = {
      starCollect: {
        type: 'sine',
        frequency: 880,
        duration: 0.3,
        volume: 0.3
      },
      gateActivate: {
        type: 'triangle', 
        frequency: 220,
        duration: 1.0,
        volume: 0.4
      },
      levelComplete: {
        type: 'square',
        frequency: 440,
        duration: 2.0,
        volume: 0.5
      },
      ambient: {
        type: 'sine',
        frequency: 60,
        duration: -1, // Continuous
        volume: 0.1
      }
    }
    
    console.log('🎵 Sound effects configured')
  }
  
  /**
   * Play a sound effect
   */
  playSound(soundName, position = null) {
    if (!this.isInitialized || this.isMuted || !this.audioContext) {
      return
    }
    
    const config = this.soundConfigs[soundName]
    if (!config) {
      console.warn(`Sound "${soundName}" not found`)
      return
    }
    
    try {
      // Create oscillator for the sound
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      // Configure oscillator
      oscillator.type = config.type
      oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime)
      
      // Configure volume with fade in/out
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(config.volume, this.audioContext.currentTime + 0.1)
      
      if (config.duration > 0) {
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + config.duration)
      }
      
      // Connect audio chain
      oscillator.connect(gainNode)
      
      // Add 3D positioning if position provided
      if (position) {
        const panner = this.audioContext.createPanner()
        panner.panningModel = 'HRTF'
        panner.setPosition(position.x, position.y, position.z)
        gainNode.connect(panner)
        panner.connect(this.underwaterFilter)
      } else {
        gainNode.connect(this.underwaterFilter)
      }
      
      // Start and stop the sound
      oscillator.start(this.audioContext.currentTime)
      if (config.duration > 0) {
        oscillator.stop(this.audioContext.currentTime + config.duration)
      }
      
      console.log(`🔊 Playing sound: ${soundName}`)
      
    } catch (error) {
      console.warn(`Failed to play sound "${soundName}":`, error)
    }
  }
  
  /**
   * Start ambient underwater sound
   */
  startAmbientSound() {
    if (!this.isInitialized || this.isMuted) return
    
    // Only start if not already playing
    if (this.ambientOscillator) return
    
    try {
      this.ambientOscillator = this.audioContext.createOscillator()
      this.ambientGain = this.audioContext.createGain()
      
      // Very low frequency for subtle ambient effect
      this.ambientOscillator.type = 'sine'
      this.ambientOscillator.frequency.setValueAtTime(40, this.audioContext.currentTime)
      
      // Low volume ambient sound
      this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.ambientGain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 2)
      
      // Connect and start
      this.ambientOscillator.connect(this.ambientGain)
      this.ambientGain.connect(this.underwaterFilter)
      this.ambientOscillator.start()
      
      console.log('🌊 Ambient underwater sound started')
      
    } catch (error) {
      console.warn('Failed to start ambient sound:', error)
    }
  }
  
  /**
   * Stop ambient underwater sound
   */
  stopAmbientSound() {
    if (this.ambientOscillator) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1)
        this.ambientOscillator.stop(this.audioContext.currentTime + 1)
        this.ambientOscillator = null
        this.ambientGain = null
        console.log('🔇 Ambient sound stopped')
      } catch (error) {
        console.warn('Error stopping ambient sound:', error)
      }
    }
  }
  
  /**
   * Update listener position for 3D audio (should be called each frame)
   */
  updateListenerPosition(position, forward, up) {
    if (!this.listener || !this.isInitialized) return
    
    try {
      if (this.listener.positionX) {
        // New Web Audio API approach
        this.listener.positionX.setValueAtTime(position.x, this.audioContext.currentTime)
        this.listener.positionY.setValueAtTime(position.y, this.audioContext.currentTime)
        this.listener.positionZ.setValueAtTime(position.z, this.audioContext.currentTime)
        
        this.listener.forwardX.setValueAtTime(forward.x, this.audioContext.currentTime)
        this.listener.forwardY.setValueAtTime(forward.y, this.audioContext.currentTime)
        this.listener.forwardZ.setValueAtTime(forward.z, this.audioContext.currentTime)
        
        this.listener.upX.setValueAtTime(up.x, this.audioContext.currentTime)
        this.listener.upY.setValueAtTime(up.y, this.audioContext.currentTime)
        this.listener.upZ.setValueAtTime(up.z, this.audioContext.currentTime)
      } else {
        // Fallback for older browsers
        this.listener.setPosition(position.x, position.y, position.z)
        this.listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z)
      }
    } catch (error) {
      // Silently ignore positioning errors
    }
  }
  
  /**
   * Set master volume
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime)
    }
  }
  
  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted
    
    if (this.isMuted) {
      this.stopAmbientSound()
    } else if (this.isInitialized) {
      this.startAmbientSound()
    }
    
    console.log(`🔊 Audio ${this.isMuted ? 'muted' : 'unmuted'}`)
    return this.isMuted
  }
  
  /**
   * Get current audio state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isMuted: this.isMuted,
      masterVolume: this.masterVolume
    }
  }
  
  /**
   * Dispose of audio resources
   */
  dispose() {
    this.stopAmbientSound()
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    this.sounds.clear()
    this.isInitialized = false
    
    console.log('🗑️ AudioEngine disposed')
  }
}