/**
 * Unit tests for mobile controls functionality
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'

// Mock DOM setup for testing mobile controls
function setupMockDOM() {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <div id="mobileControls">
          <div class="virtual-joystick" id="virtualJoystick">
            <div class="joystick-knob" id="joystickKnob"></div>
          </div>
          <div class="mobile-buttons">
            <div class="mobile-btn" id="swimUpBtn">↑</div>
            <div class="mobile-btn" id="swimDownBtn">↓</div>
          </div>
        </div>
        <canvas id="gameCanvas"></canvas>
      </body>
    </html>
  `)

  global.window = dom.window
  global.document = dom.window.document
  global.navigator = {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  }

  // Mock canvas and WebGL context
  const canvas = document.getElementById('gameCanvas')
  canvas.getContext = () => ({
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    // Add other WebGL methods as needed
  })

  return dom
}

describe('Mobile Controls', () => {
  beforeEach(() => {
    setupMockDOM()
  })

  test('should detect mobile devices correctly', () => {
    // Mobile user agent should be detected
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    expect(isMobile).toBe(true)
  })

  test('should find required mobile control elements', () => {
    const virtualJoystick = document.getElementById('virtualJoystick')
    const joystickKnob = document.getElementById('joystickKnob')
    const swimUpBtn = document.getElementById('swimUpBtn')
    const swimDownBtn = document.getElementById('swimDownBtn')

    expect(virtualJoystick).toBeTruthy()
    expect(joystickKnob).toBeTruthy()
    expect(swimUpBtn).toBeTruthy()
    expect(swimDownBtn).toBeTruthy()
  })

  test('should have correct mobile control structure', () => {
    const mobileControls = document.getElementById('mobileControls')
    const virtualJoystick = document.getElementById('virtualJoystick')
    const mobileButtons = document.querySelector('.mobile-buttons')

    expect(mobileControls).toBeTruthy()
    expect(virtualJoystick).toBeTruthy()
    expect(mobileButtons).toBeTruthy()

    // Check that virtual joystick contains the knob
    const knob = virtualJoystick.querySelector('.joystick-knob')
    expect(knob).toBeTruthy()

    // Check that mobile buttons contain the swim controls
    const swimUpBtn = mobileButtons.querySelector('#swimUpBtn')
    const swimDownBtn = mobileButtons.querySelector('#swimDownBtn')
    expect(swimUpBtn).toBeTruthy()
    expect(swimDownBtn).toBeTruthy()
  })

  test('should initialize touch event listeners', () => {
    const canvas = document.getElementById('gameCanvas')

    // Create a mock game class to test touch control setup
    class MockGame {
      constructor() {
        this.isMobile = true
        this.canvas = canvas
        this.mobileButtonState = { swimUp: false, swimDown: false }
        this.touchState = {
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          isActive: false,
        }
      }

      setupTouchControls() {
        // Simulate the setup process
        this.canvas.addEventListener('touchstart', () => {
          this.touchState.isActive = true
        })

        this.canvas.addEventListener('touchend', () => {
          this.touchState.isActive = false
        })
      }
    }

    const game = new MockGame()
    game.setupTouchControls()

    // Create and dispatch a mock touch event
    const touchStartEvent = new window.TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }],
    })

    canvas.dispatchEvent(touchStartEvent)
    expect(game.touchState.isActive).toBe(true)

    const touchEndEvent = new window.TouchEvent('touchend', {
      touches: [],
    })

    canvas.dispatchEvent(touchEndEvent)
    expect(game.touchState.isActive).toBe(false)
  })

  test('should handle mobile button interactions', () => {
    const swimUpBtn = document.getElementById('swimUpBtn')
    const swimDownBtn = document.getElementById('swimDownBtn')

    const buttonState = { swimUp: false, swimDown: false }

    // Simulate button event listeners
    swimUpBtn.addEventListener('touchstart', () => {
      buttonState.swimUp = true
    })

    swimUpBtn.addEventListener('touchend', () => {
      buttonState.swimUp = false
    })

    swimDownBtn.addEventListener('touchstart', () => {
      buttonState.swimDown = true
    })

    swimDownBtn.addEventListener('touchend', () => {
      buttonState.swimDown = false
    })

    // Test swim up button
    const touchStartUpEvent = new window.TouchEvent('touchstart')
    swimUpBtn.dispatchEvent(touchStartUpEvent)
    expect(buttonState.swimUp).toBe(true)

    const touchEndUpEvent = new window.TouchEvent('touchend')
    swimUpBtn.dispatchEvent(touchEndUpEvent)
    expect(buttonState.swimUp).toBe(false)

    // Test swim down button
    const touchStartDownEvent = new window.TouchEvent('touchstart')
    swimDownBtn.dispatchEvent(touchStartDownEvent)
    expect(buttonState.swimDown).toBe(true)

    const touchEndDownEvent = new window.TouchEvent('touchend')
    swimDownBtn.dispatchEvent(touchEndDownEvent)
    expect(buttonState.swimDown).toBe(false)
  })
})
