import { AppSettings } from '@/types'
import { bridge } from '@/lib/bridge'

export const defaultSettings: AppSettings = {
  workingRootDirectory: '~/Documents/minstrel',
  writingSample: '',
  writingStyleDescription: ''
}

export const loadAppSettings = async () => {
  const settings = await bridge.getAppSettings()
  return settings
}

export const saveAppSettings = async (config: AppSettings) => {
  await bridge.saveAppSettings(config)
  return config
}
