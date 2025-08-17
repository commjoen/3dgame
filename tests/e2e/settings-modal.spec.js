import { test, expect } from '@playwright/test'

test.describe('Settings Modal Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the game to load
    await page.waitForSelector('#gameCanvas')
    await page.waitForTimeout(2000)
  })

  test('should open and close settings modal with button', async ({ page }) => {
    const settingsButton = page.locator('#settingsButton')
    const settingsModal = page.locator('#settingsModal')
    const closeButton = page.locator('#closeSettings')
    
    // Settings button should be visible
    await expect(settingsButton).toBeVisible()
    
    // Modal should initially be hidden
    await expect(settingsModal).toBeHidden()
    
    // Click settings button to open modal
    await settingsButton.click()
    
    // Modal should now be visible
    await expect(settingsModal).toBeVisible()
    
    // Click close button to close modal
    await closeButton.click()
    
    // Modal should be hidden again
    await expect(settingsModal).toBeHidden()
  })

  test('should close settings modal when clicking background', async ({ page }) => {
    const settingsButton = page.locator('#settingsButton')
    const settingsModal = page.locator('#settingsModal')
    
    // Open modal
    await settingsButton.click()
    await expect(settingsModal).toBeVisible()
    
    // Click on modal background (not content)
    await settingsModal.click()
    
    // Modal should close
    await expect(settingsModal).toBeHidden()
  })

  test('should close settings modal with Escape key', async ({ page }) => {
    const settingsButton = page.locator('#settingsButton')
    const settingsModal = page.locator('#settingsModal')
    
    // Open modal
    await settingsButton.click()
    await expect(settingsModal).toBeVisible()
    
    // Press Escape key
    await page.keyboard.press('Escape')
    
    // Modal should close
    await expect(settingsModal).toBeHidden()
  })

  test('should display correct controls information', async ({ page }) => {
    const settingsButton = page.locator('#settingsButton')
    const settingsModal = page.locator('#settingsModal')
    
    // Open modal
    await settingsButton.click()
    await expect(settingsModal).toBeVisible()
    
    // Check for desktop controls
    await expect(page.locator('text=Desktop Controls:')).toBeVisible()
    await expect(page.locator('text=W/↑: Swim forward')).toBeVisible()
    await expect(page.locator('text=Space: Swim up')).toBeVisible()
    
    // Check for mobile controls
    await expect(page.locator('text=Mobile Controls:')).toBeVisible()
    await expect(page.locator('text=Virtual Joystick: Move around')).toBeVisible()
    
    // Check for objective
    await expect(page.locator('text=Objective:')).toBeVisible()
    await expect(page.locator('text=Collect all the golden stars')).toBeVisible()
  })
})

test.describe('Settings Modal Mobile Tests', () => {
  test.use({ 
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/12.0 Mobile/15A372 Safari/604.1',
    viewport: { width: 375, height: 667 }
  })

  test('should work with touch events on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#gameCanvas')
    await page.waitForTimeout(2000)
    
    const settingsButton = page.locator('#settingsButton')
    const settingsModal = page.locator('#settingsModal')
    const closeButton = page.locator('#closeSettings')
    
    // Settings button should be visible
    await expect(settingsButton).toBeVisible()
    
    // Modal should initially be hidden
    await expect(settingsModal).toBeHidden()
    
    // Tap settings button to open modal
    await settingsButton.tap()
    
    // Modal should now be visible
    await expect(settingsModal).toBeVisible()
    
    // Tap close button to close modal
    await closeButton.tap()
    
    // Modal should be hidden again
    await expect(settingsModal).toBeHidden()
  })

  test('should close modal with background tap on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#gameCanvas')
    await page.waitForTimeout(2000)
    
    const settingsButton = page.locator('#settingsButton')
    const settingsModal = page.locator('#settingsModal')
    
    // Open modal
    await settingsButton.tap()
    await expect(settingsModal).toBeVisible()
    
    // Tap on modal background
    await settingsModal.tap()
    
    // Modal should close
    await expect(settingsModal).toBeHidden()
  })
})