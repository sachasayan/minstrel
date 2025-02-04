import { ElectronAPI } from '@electron-toolkit/preload';
import { dialog } from 'electron';

declare module '@electron-toolkit/preload' {
  interface ElectronAPI {
    dialog: typeof dialog;
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}
