import { test, expect, _electron as electron } from '@playwright/test'
import { resolve } from 'path'

test('launch app and check title', async () => {
  const electronApp = await electron.launch({
    args: [resolve(__dirname, '../out/main/index.js')],
    executablePath: resolve(__dirname, '../node_modules/.bin/electron')
  })

  const window = await electronApp.firstWindow()

  // Wait for the window to be visible
  await window.waitForSelector('body')

  // Check the title (if applicable) or a main element
  const title = await window.title()
  console.log('Window title:', title)

  // Check for the "Welcome to Minstrel" text in the renderer
  const welcomeText = window.locator('h1')
  await expect(welcomeText).toContainText('Welcome to Minstrel')

  await electronApp.close()
})
