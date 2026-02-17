import settings from 'electron-settings'
import * as os from 'os'
import { ipcMain, safeStorage } from 'electron'
import { DEFAULT_HIGH_PREFERENCE_MODEL_ID, DEFAULT_LOW_PREFERENCE_MODEL_ID, DEFAULT_PROVIDER } from '../shared/constants'

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

const SENSITIVE_KEYS: (keyof AppSettings)[] = ['googleApiKey', 'deepseekApiKey', 'zaiApiKey', 'openaiApiKey']

const ENCRYPTION_PREFIX = 'enc:'

/**
 * Encrypts a string value using Electron's safeStorage API.
 * Adds a prefix to identify the value as encrypted.
 */
export const encryptValue = (value: string): string => {
  if (!value || value.startsWith(ENCRYPTION_PREFIX) || !safeStorage.isEncryptionAvailable()) {
    return value
  }

  try {
    const encrypted = safeStorage.encryptString(value)
    return ENCRYPTION_PREFIX + encrypted.toString('base64')
  } catch (error) {
    console.error('Failed to encrypt setting:', error)
    return value
  }
}

/**
 * Decrypts a string value using Electron's safeStorage API if it has the encryption prefix.
 */
export const decryptValue = (value: string): string => {
  if (!value || !value.startsWith(ENCRYPTION_PREFIX) || !safeStorage.isEncryptionAvailable()) {
    return value
  }

  try {
    const encryptedData = value.substring(ENCRYPTION_PREFIX.length)
    const buffer = Buffer.from(encryptedData, 'base64')
    return safeStorage.decryptString(buffer)
  } catch (error) {
    console.error('Failed to decrypt setting. It might be corrupted or from another machine:', error)
    // If decryption fails, we return the original value (with prefix)
    // or we could return empty string, but returning the original allows
    // the user to see there's something there, even if it's garbage.
    // In practice, if it's an API key, garbage won't work anyway.
    return value
  }
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

  // Decrypt sensitive fields and check if migration is needed
  let needsMigration = false
  const encryptionAvailable = safeStorage.isEncryptionAvailable()

  for (const key of SENSITIVE_KEYS) {
    const value = appSettings[key]
    if (value && typeof value === 'string') {
      if (encryptionAvailable && !value.startsWith(ENCRYPTION_PREFIX)) {
        needsMigration = true
      }
      appSettings[key] = decryptValue(value)
    }
  }

  if (needsMigration) {
    // Proactively encrypt and save plaintext keys
    await saveAppSettings(appSettings)
  }

  return appSettings as AppSettings
}

export const saveAppSettings = async (config: AppSettings) => {
  // Provide defaults for potentially undefined values to satisfy electron-settings types
  const settingsToSave: any = {
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

  // Encrypt sensitive fields
  for (const key of SENSITIVE_KEYS) {
    if (settingsToSave[key]) {
      settingsToSave[key] = encryptValue(settingsToSave[key])
    }
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
