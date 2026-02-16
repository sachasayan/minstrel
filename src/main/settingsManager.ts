import settings from 'electron-settings'
import { ipcMain } from 'electron'
import { resolvePath } from './pathUtils'
import {
  DEFAULT_HIGH_PREFERENCE_MODEL_ID,
  DEFAULT_LOW_PREFERENCE_MODEL_ID,
  DEFAULT_PROVIDER
} from '../shared/constants'

interface AppSettings {
  api?: string
  workingRootDirectory?: string | null
  highPreferenceModelId?: string
  lowPreferenceModelId?: string
  // Provider configuration
  provider?: string
  googleApiKey?: string
  deepseekApiKey?: string
  zaiApiKey?: string
  openaiApiKey?: string
}

export const loadAppSettings = async (): Promise<AppSettings> => {
  const appSettings: any = (await settings.get('settings')) || {}

  // Expand tilde in workingRootDirectory
  if (typeof appSettings?.workingRootDirectory === 'string') {
    appSettings.workingRootDirectory = resolvePath(appSettings.workingRootDirectory)
  }

  // Set defaults for model IDs if they don't exist
  if (appSettings.highPreferenceModelId === undefined) {
    appSettings.highPreferenceModelId = DEFAULT_HIGH_PREFERENCE_MODEL_ID
  }
  if (appSettings.lowPreferenceModelId === undefined) {
    appSettings.lowPreferenceModelId = DEFAULT_LOW_PREFERENCE_MODEL_ID
  }

  // Set default provider if not exists
  if (appSettings.provider === undefined) {
    appSettings.provider = DEFAULT_PROVIDER
  }

  // Ensure other fields have defaults if missing (to match expected type on load)
  if (appSettings.api === undefined) appSettings.api = ''
  if (appSettings.workingRootDirectory === undefined) appSettings.workingRootDirectory = null
  if (appSettings.googleApiKey === undefined) appSettings.googleApiKey = ''
  if (appSettings.deepseekApiKey === undefined) appSettings.deepseekApiKey = ''
  if (appSettings.zaiApiKey === undefined) appSettings.zaiApiKey = ''
  if (appSettings.openaiApiKey === undefined) appSettings.openaiApiKey = ''

  return appSettings as AppSettings
}

export const saveAppSettings = async (config: AppSettings) => {
  // Provide defaults for potentially undefined values to satisfy electron-settings types
  const settingsToSave = {
    api: config.api ?? '', // Default to empty string if undefined
    workingRootDirectory: config.workingRootDirectory ?? null, // Default to null if undefined
    highPreferenceModelId: config.highPreferenceModelId ?? DEFAULT_HIGH_PREFERENCE_MODEL_ID,
    lowPreferenceModelId: config.lowPreferenceModelId ?? DEFAULT_LOW_PREFERENCE_MODEL_ID,
    // Provider configuration
    provider: config.provider ?? DEFAULT_PROVIDER,
    googleApiKey: config.googleApiKey ?? '',
    deepseekApiKey: config.deepseekApiKey ?? '',
    zaiApiKey: config.zaiApiKey ?? '',
    openaiApiKey: config.openaiApiKey ?? ''
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
