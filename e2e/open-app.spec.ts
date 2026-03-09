import { test, expect, _electron as electron } from '@playwright/test'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

test('opens the app to the intro screen', async () => {
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'minstrel-e2e-'))
  const electronApp = await electron.launch({
    args: ['.'],
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      CI: '1',
      HOME: homeDir,
      XDG_CONFIG_HOME: homeDir,
      XDG_DATA_HOME: homeDir
    }
  })

  try {
    const window = await electronApp.firstWindow()

    await expect(window.getByRole('heading', { name: 'Welcome to Minstrel' })).toBeVisible()
    await expect(window.getByText('Open', { exact: true })).toBeVisible()
    await expect(window.getByText('New', { exact: true })).toBeVisible()
  } finally {
    await electronApp.close()
    await fs.rm(homeDir, { recursive: true, force: true })
  }
})
