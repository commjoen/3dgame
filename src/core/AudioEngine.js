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
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)()

      // Create audio listener for 3D spatial audio
      this.listener = this.audioContext.listener

      // Create master gain node for volume control
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.setValueAtTime(
        this.masterVolume,
        this.audioContext.currentTime
      )
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
    if (!this.audioContext) {
      return
    }

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
   * Create enhanced sound effects using oscillators and filters
   * This avoids external file dependencies while providing rich audio feedback
   */
  createSoundEffects() {
    if (!this.audioContext) {
      return
    }

    // Enhanced sound configurations with more complex patterns
    this.soundConfigs = {
      starCollect: {
        type: 'sine',
        frequency: 880,
        duration: 0.4,
        volume: 0.3,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
        harmonics: [{ frequency: 1320, volume: 0.5 }, { frequency: 1760, volume: 0.3 }]
      },
      gateActivate: {
        type: 'triangle',
        frequency: 220,
        duration: 1.5,
        volume: 0.4,
        envelope: { attack: 0.2, decay: 0.3, sustain: 0.7, release: 0.5 },
        modulation: { frequency: 4, depth: 20 }
      },
      levelComplete: {
        type: 'square',
        frequency: 440,
        duration: 2.5,
        volume: 0.5,
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.4 },
        melody: [440, 554.37, 659.25, 880] // A4, C#5, E5, A5
      },
      swimming: {
        type: 'sine',
        frequency: 200,
        duration: 0.2,
        volume: 0.15,
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.05 }
      },
      underwater: {
        type: 'sine',
        frequency: 80,
        duration: -1, // Continuous
        volume: 0.12,
        envelope: { attack: 2.0, decay: 0, sustain: 1.0, release: 2.0 },
        modulation: { frequency: 0.3, depth: 5 }
      },
    }

    console.log('🎵 Enhanced sound effects configured')
  }

  /**
   * Play an enhanced sound effect with envelopes and harmonics
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
      const currentTime = this.audioContext.currentTime

      // Handle melody-based sounds (like levelComplete)
      if (config.melody) {
        this.playMelody(config, position)
        return
      }

      // Create main oscillator
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      // Configure oscillator
      oscillator.type = config.type
      oscillator.frequency.setValueAtTime(config.frequency, currentTime)

      // Add frequency modulation if specified
      if (config.modulation) {
        const lfo = this.audioContext.createOscillator()
        const lfoGain = this.audioContext.createGain()
        lfo.frequency.setValueAtTime(config.modulation.frequency, currentTime)
        lfoGain.gain.setValueAtTime(config.modulation.depth, currentTime)
        lfo.connect(lfoGain)
        lfoGain.connect(oscillator.frequency)
        lfo.start(currentTime)
        if (config.duration > 0) {
          lfo.stop(currentTime + config.duration)
        }
      }

      // Configure ADSR envelope
      const envelope = config.envelope || { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.2 }
      const attackTime = currentTime + envelope.attack
      const decayTime = attackTime + envelope.decay
      const sustainLevel = config.volume * envelope.sustain
      const releaseTime = config.duration > 0 ? currentTime + config.duration : currentTime + 1

      gainNode.gain.setValueAtTime(0, currentTime)
      gainNode.gain.linearRampToValueAtTime(config.volume, attackTime)
      gainNode.gain.linearRampToValueAtTime(sustainLevel, decayTime)
      gainNode.gain.setValueAtTime(sustainLevel, releaseTime - envelope.release)
      gainNode.gain.linearRampToValueAtTime(0, releaseTime)

      // Connect audio chain
      oscillator.connect(gainNode)

      // Add harmonics for richer sound
      const harmonicOscillators = []
      if (config.harmonics) {
        config.harmonics.forEach(harmonic => {
          const harmonicOsc = this.audioContext.createOscillator()
          const harmonicGain = this.audioContext.createGain()
          
          harmonicOsc.type = config.type
          harmonicOsc.frequency.setValueAtTime(harmonic.frequency, currentTime)
          harmonicGain.gain.setValueAtTime(harmonic.volume * config.volume, currentTime)
          harmonicGain.gain.linearRampToValueAtTime(0, releaseTime)
          
          harmonicOsc.connect(harmonicGain)
          harmonicGain.connect(gainNode)
          harmonicOsc.start(currentTime)
          
          if (config.duration > 0) {
            harmonicOsc.stop(releaseTime)
          }
          harmonicOscillators.push(harmonicOsc)
        })
      }

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
      oscillator.start(currentTime)
      if (config.duration > 0) {
        oscillator.stop(releaseTime)
      }

      console.log(`🔊 Playing enhanced sound: ${soundName}`)
    } catch (error) {
      console.warn(`Failed to play sound "${soundName}":`, error)
    }
  }

  /**
   * Play a melody sequence
   */
  playMelody(config, position = null) {
    const noteDuration = config.duration / config.melody.length
    
    config.melody.forEach((frequency, index) => {
      const startTime = this.audioContext.currentTime + (index * noteDuration)
      
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.type = config.type
      oscillator.frequency.setValueAtTime(frequency, startTime)
      
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(config.volume, startTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration - 0.05)
      
      oscillator.connect(gainNode)
      
      if (position) {
        const panner = this.audioContext.createPanner()
        panner.panningModel = 'HRTF'
        panner.setPosition(position.x, position.y, position.z)
        gainNode.connect(panner)
        panner.connect(this.underwaterFilter)
      } else {
        gainNode.connect(this.underwaterFilter)
      }
      
      oscillator.start(startTime)
      oscillator.stop(startTime + noteDuration)
    })
  }

  /**
   * Start enhanced ambient underwater sound with background music
   */
  startAmbientSound() {
    if (!this.isInitialized || this.isMuted) {
      return
    }

    // Only start if not already playing
    if (this.ambientOscillator) {
      return
    }

    try {
      // Create main ambient sound (underwater rumble)
      this.ambientOscillator = this.audioContext.createOscillator()
      this.ambientGain = this.audioContext.createGain()

      this.ambientOscillator.type = 'sine'
      this.ambientOscillator.frequency.setValueAtTime(
        60,
        this.audioContext.currentTime
      )

      // Gentle fade in
      this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.ambientGain.gain.linearRampToValueAtTime(
        0.08,
        this.audioContext.currentTime + 3.0
      )

      this.ambientOscillator.connect(this.ambientGain)
      this.ambientGain.connect(this.underwaterFilter)

      this.ambientOscillator.start()

      // Create background music layers
      this.createBackgroundMusic()

      console.log('🌊 Ambient underwater sound and music started')
    } catch (error) {
      console.warn('Failed to start ambient sound:', error)
    }
  }

  /**
   * Create layered background music using harmonic oscillators
   */
  createBackgroundMusic() {
    this.musicLayers = []

    // Musical notes in the key of A minor (underwater/mysterious feel)
    const musicNotes = [
      { frequency: 110, volume: 0.03, type: 'sine' },      // A2
      { frequency: 146.83, volume: 0.025, type: 'sine' },  // D3
      { frequency: 164.81, volume: 0.02, type: 'triangle' }, // E3
      { frequency: 220, volume: 0.015, type: 'sine' },     // A3
    ]

    musicNotes.forEach((note, index) => {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const lfo = this.audioContext.createOscillator() // Low frequency oscillator for modulation
      const lfoGain = this.audioContext.createGain()

      // Setup main oscillator
      oscillator.type = note.type
      oscillator.frequency.setValueAtTime(note.frequency, this.audioContext.currentTime)

      // Setup LFO for subtle frequency modulation
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.1 + index * 0.05, this.audioContext.currentTime) // Different rates for each layer
      lfoGain.gain.setValueAtTime(2, this.audioContext.currentTime) // Small modulation depth

      // Connect modulation
      lfo.connect(lfoGain)
      lfoGain.connect(oscillator.frequency)

      // Setup volume envelope with slow fade in
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(
        note.volume,
        this.audioContext.currentTime + 5.0 + index // Staggered entry
      )

      // Connect audio chain
      oscillator.connect(gainNode)
      gainNode.connect(this.underwaterFilter)

      // Start oscillators
      oscillator.start()
      lfo.start()

      this.musicLayers.push({ oscillator, gainNode, lfo, lfoGain })
    })
  }

  /**
   * Stop ambient underwater sound and background music
   */
  stopAmbientSound() {
    if (this.ambientOscillator) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + 1
        )
        this.ambientOscillator.stop(this.audioContext.currentTime + 1)
        this.ambientOscillator = null
        this.ambientGain = null
      } catch (error) {
        console.warn('Error stopping ambient sound:', error)
      }
    }

    // Stop background music layers
    if (this.musicLayers) {
      this.musicLayers.forEach(layer => {
        try {
          layer.gainNode.gain.linearRampToValueAtTime(
            0,
            this.audioContext.currentTime + 1
          )
          layer.oscillator.stop(this.audioContext.currentTime + 1)
          layer.lfo.stop(this.audioContext.currentTime + 1)
        } catch (error) {
          console.warn('Error stopping music layer:', error)
        }
      })
      this.musicLayers = null
    }

    console.log('🔇 Ambient sound and music stopped')
  }

  /**
   * Update listener position for 3D audio (should be called each frame)
   */
  updateListenerPosition(position, forward, up) {
    if (!this.listener || !this.isInitialized) {
      return
    }

    try {
      if (this.listener.positionX) {
        // New Web Audio API approach
        this.listener.positionX.setValueAtTime(
          position.x,
          this.audioContext.currentTime
        )
        this.listener.positionY.setValueAtTime(
          position.y,
          this.audioContext.currentTime
        )
        this.listener.positionZ.setValueAtTime(
          position.z,
          this.audioContext.currentTime
        )

        this.listener.forwardX.setValueAtTime(
          forward.x,
          this.audioContext.currentTime
        )
        this.listener.forwardY.setValueAtTime(
          forward.y,
          this.audioContext.currentTime
        )
        this.listener.forwardZ.setValueAtTime(
          forward.z,
          this.audioContext.currentTime
        )

        this.listener.upX.setValueAtTime(up.x, this.audioContext.currentTime)
        this.listener.upY.setValueAtTime(up.y, this.audioContext.currentTime)
        this.listener.upZ.setValueAtTime(up.z, this.audioContext.currentTime)
      } else {
        // Fallback for older browsers
        this.listener.setPosition(position.x, position.y, position.z)
        this.listener.setOrientation(
          forward.x,
          forward.y,
          forward.z,
          up.x,
          up.y,
          up.z
        )
      }
    } catch {
      // Silently ignore positioning errors
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume))

    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(
        this.masterVolume,
        this.audioContext.currentTime
      )
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
      masterVolume: this.masterVolume,
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
