import type { SaveDialogOptions } from 'electron'

declare global {
  interface LegacyElectronApi {
    ipcRenderer?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<any>
    }
    process?: {
      versions?: {
        electron?: string
        chrome?: string
        node?: string
      }
    }
  }

  interface MinstrelApi {
    readDirectory: (dirPath: string) => Promise<Array<{ name: string; type: 'folder' | 'file' }>>
    readFile: (filePath: string) => Promise<string>
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
    makeDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>
    selectDirectory: (operation: 'import' | 'export' | 'save') => Promise<string | null>
    deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
    showSaveDialog: (options: SaveDialogOptions) => Promise<string | null>
    openFileDialog: () => Promise<string | null>
    initSqliteProject: (filePath: string, metadata: unknown) => Promise<{ success: boolean; error?: string }>
    saveSqliteProject: (filePath: string, project: unknown) => Promise<{ success: boolean; error?: string }>
    getSqliteProjectMeta: (filePath: string) => Promise<any>
    getSqliteProjectsMeta: (filePaths: string[]) => Promise<any[]>
    loadSqliteProject: (filePath: string) => Promise<any>
    getAppSettings: () => Promise<any>
    saveAppSettings: (config: unknown) => Promise<void>
    triggerSafeStoragePrompt: () => Promise<boolean>
    getProcessVersions: () => { electron?: string; chrome?: string; node?: string }
  }

  interface Window {
    api: MinstrelApi
    electron?: LegacyElectronApi
  }
}
