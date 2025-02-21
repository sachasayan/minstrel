import settings from 'electron-settings'
import * as os from 'os'
import { ipcMain } from 'electron'
interface AppSettings {
  api?: string
  apiKey?: string
  workingRootDirectory?: string | null
}

export const loadAppSettings = async (_event): Promise<AppSettings> => {
  const appSettings: any = (await settings.get('settings')) || {}

  // Expand tilde in workingRootDirectory
  if (typeof appSettings?.workingRootDirectory === 'string') {
    appSettings.workingRootDirectory = appSettings.workingRootDirectory.replace('~', os.homedir())
  }

  return appSettings as AppSettings
}

export const saveAppSettings = async (_event, config: AppSettings) => {
  await settings.set('settings', {
    api: config.api as any,
    apiKey: config.apiKey as any,
    workingRootDirectory: config.workingRootDirectory as any
  })
}

export const registerSettingsHandlers = () => {
  ipcMain.handle('get-app-settings', loadAppSettings)
  ipcMain.handle('save-app-settings', saveAppSettings)
}
