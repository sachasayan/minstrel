import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onOpenProject: (callback: (path: string) => void) => () => void
    }
  }
}
