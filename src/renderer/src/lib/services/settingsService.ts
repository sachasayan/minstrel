import { AppSettings } from '@/types'
import { DEFAULT_LOW_PREFERENCE_MODEL_ID } from '@shared/constants'

export const defaultSettings: AppSettings = {
  workingRootDirectory: '~/Documents/minstrel'
}

export const loadAppSettings = async () => {
  const settings = await window.electron.ipcRenderer.invoke('get-app-settings')
  return settings
}

export const saveAppSettings = async (config: AppSettings) => {
  await window.electron.ipcRenderer.invoke('save-app-settings', config)
  return config
}
