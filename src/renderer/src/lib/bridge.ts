import type { SaveDialogOptions } from 'electron'

type Invoke = (channel: string, ...args: unknown[]) => Promise<any>

const getLegacyInvoke = (): Invoke | null => {
  const electronBridge = window?.electron
  if (!electronBridge?.ipcRenderer) return null
  const invoke = electronBridge?.ipcRenderer?.invoke
  return typeof invoke === 'function' ? invoke.bind(electronBridge.ipcRenderer) : null
}

const call = async (channel: string, ...args: unknown[]): Promise<any> => {
  const invoke = getLegacyInvoke()
  if (!invoke) {
    throw new Error(`IPC bridge unavailable for channel: ${channel}`)
  }
  return invoke(channel, ...args)
}

export const bridge = {
  readDirectory: (dirPath: string) =>
    typeof window.api?.readDirectory === 'function'
      ? window.api.readDirectory(dirPath)
      : call('read-directory', dirPath),
  readFile: (filePath: string) =>
    typeof window.api?.readFile === 'function'
      ? window.api.readFile(filePath)
      : call('read-file', filePath),
  writeFile: (filePath: string, content: string) =>
    typeof window.api?.writeFile === 'function'
      ? window.api.writeFile(filePath, content)
      : call('write-file', filePath, content),
  makeDirectory: (dirPath: string) =>
    typeof window.api?.makeDirectory === 'function'
      ? window.api.makeDirectory(dirPath)
      : call('make-directory', dirPath),
  selectDirectory: (operation: 'import' | 'export' | 'save') =>
    typeof window.api?.selectDirectory === 'function'
      ? window.api.selectDirectory(operation)
      : call('select-directory', operation),
  deleteFile: (filePath: string) =>
    typeof window.api?.deleteFile === 'function'
      ? window.api.deleteFile(filePath)
      : call('delete-file', filePath),
  showSaveDialog: (options: SaveDialogOptions) =>
    typeof window.api?.showSaveDialog === 'function'
      ? window.api.showSaveDialog(options)
      : call('show-save-dialog', options),
  openFileDialog: () =>
    typeof window.api?.openFileDialog === 'function'
      ? window.api.openFileDialog()
      : call('open-file-dialog'),
  initSqliteProject: (filePath: string, metadata: unknown) =>
    typeof window.api?.initSqliteProject === 'function'
      ? window.api.initSqliteProject(filePath, metadata)
      : call('init-sqlite-project', filePath, metadata),
  saveSqliteProject: (filePath: string, project: unknown) =>
    typeof window.api?.saveSqliteProject === 'function'
      ? window.api.saveSqliteProject(filePath, project)
      : call('save-sqlite-project', filePath, project),
  getSqliteProjectMeta: (filePath: string) =>
    typeof window.api?.getSqliteProjectMeta === 'function'
      ? window.api.getSqliteProjectMeta(filePath)
      : call('get-sqlite-project-meta', filePath),
  getSqliteProjectsMeta: (filePaths: string[]) =>
    typeof window.api?.getSqliteProjectsMeta === 'function'
      ? window.api.getSqliteProjectsMeta(filePaths)
      : call('get-sqlite-projects-meta', filePaths),
  loadSqliteProject: (filePath: string) =>
    typeof window.api?.loadSqliteProject === 'function'
      ? window.api.loadSqliteProject(filePath)
      : call('load-sqlite-project', filePath),
  getAppSettings: () =>
    typeof window.api?.getAppSettings === 'function'
      ? window.api.getAppSettings()
      : call('get-app-settings'),
  saveAppSettings: (config: unknown) =>
    typeof window.api?.saveAppSettings === 'function'
      ? window.api.saveAppSettings(config)
      : call('save-app-settings', config),
  triggerSafeStoragePrompt: () =>
    typeof window.api?.triggerSafeStoragePrompt === 'function'
      ? window.api.triggerSafeStoragePrompt()
      : call('trigger-safe-storage-prompt'),
  getProcessVersions: () => {
    if (typeof window.api?.getProcessVersions === 'function') {
      return window.api.getProcessVersions()
    }
    return {
      electron: window?.electron?.process?.versions?.electron,
      chrome: window?.electron?.process?.versions?.chrome,
      node: window?.electron?.process?.versions?.node
    }
  }
}
