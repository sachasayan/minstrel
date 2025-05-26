import settings from 'electron-settings'
import * as os from 'os'
import { ipcMain } from 'electron'

// Default model IDs
const DEFAULT_HIGH_PREFERENCE_MODEL_ID = 'gemini-2.0-flash-thinking'
const DEFAULT_LOW_PREFERENCE_MODEL_ID = 'gemini-2.0-flash'

interface AppSettings {
  api?: string
  apiKey?: string
  workingRootDirectory?: string | null
  highPreferenceModelId?: string
  lowPreferenceModelId?: string
}

export const loadAppSettings = async (): Promise<AppSettings> => {
  const appSettings: any = (await settings.get('settings')) || {}

  // Expand tilde in workingRootDirectory
  if (typeof appSettings?.workingRootDirectory === 'string') {
    appSettings.workingRootDirectory = appSettings.workingRootDirectory.replace('~', os.homedir())
  }

  // Set defaults for model IDs if they don't exist
  if (appSettings.highPreferenceModelId === undefined) {
    appSettings.highPreferenceModelId = DEFAULT_HIGH_PREFERENCE_MODEL_ID
  }
  if (appSettings.lowPreferenceModelId === undefined) {
    appSettings.lowPreferenceModelId = DEFAULT_LOW_PREFERENCE_MODEL_ID
  }

  // Ensure other fields have defaults if missing (to match expected type on load)
  if (appSettings.api === undefined) appSettings.api = ''
  if (appSettings.apiKey === undefined) appSettings.apiKey = ''
  if (appSettings.workingRootDirectory === undefined) appSettings.workingRootDirectory = null

  return appSettings as AppSettings
}

export const saveAppSettings = async (config: AppSettings) => {
  // Provide defaults for potentially undefined values to satisfy electron-settings types
  const settingsToSave = {
    api: config.api ?? '', // Default to empty string if undefined
    apiKey: config.apiKey ?? '', // Default to empty string if undefined
    workingRootDirectory: config.workingRootDirectory ?? null, // Default to null if undefined
    highPreferenceModelId: config.highPreferenceModelId ?? DEFAULT_HIGH_PREFERENCE_MODEL_ID,
    lowPreferenceModelId: config.lowPreferenceModelId ?? DEFAULT_LOW_PREFERENCE_MODEL_ID
  }
  // Type assertion might be needed if electron-settings types are very strict,
  // but providing defaults should generally work.
  await settings.set('settings', settingsToSave as any) // Using 'as any' temporarily if strict typing persists as an issue
}

export const registerSettingsHandlers = () => {
  ipcMain.handle('get-app-settings', loadAppSettings)
  // Pass only the config argument from the event handler
  ipcMain.handle('save-app-settings', (_event, config) => saveAppSettings(config))
}
