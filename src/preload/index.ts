import { contextBridge, ipcRenderer, SaveDialogOptions } from 'electron'

type SelectDirectoryOperation = 'import' | 'export' | 'save'

// Narrow, allowlisted bridge to main process.
const api = {
  readDirectory: (dirPath: string) => ipcRenderer.invoke('read-directory', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  makeDirectory: (dirPath: string) => ipcRenderer.invoke('make-directory', dirPath),
  selectDirectory: (operation: SelectDirectoryOperation) =>
    ipcRenderer.invoke('select-directory', operation),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  showSaveDialog: (options: SaveDialogOptions) => ipcRenderer.invoke('show-save-dialog', options),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  initSqliteProject: (filePath: string, metadata: unknown) =>
    ipcRenderer.invoke('init-sqlite-project', filePath, metadata),
  saveSqliteProject: (filePath: string, project: unknown) =>
    ipcRenderer.invoke('save-sqlite-project', filePath, project),
  getSqliteProjectMeta: (filePath: string) => ipcRenderer.invoke('get-sqlite-project-meta', filePath),
  getSqliteProjectsMeta: (filePaths: string[]) => ipcRenderer.invoke('get-sqlite-projects-meta', filePaths),
  loadSqliteProject: (filePath: string) => ipcRenderer.invoke('load-sqlite-project', filePath),
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  saveAppSettings: (config: unknown) => ipcRenderer.invoke('save-app-settings', config),
  triggerSafeStoragePrompt: () => ipcRenderer.invoke('trigger-safe-storage-prompt'),
  getProcessVersions: () => ({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
