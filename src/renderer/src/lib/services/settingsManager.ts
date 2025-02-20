import { AppSettings } from '@/types'

export const defaultSettings: AppSettings = {
  api: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=GEMINI_API_KEY',
  apiKey: '',
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
