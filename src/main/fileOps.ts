import { dialog, ipcMain, IpcMainInvokeEvent, OpenDialogOptions, SaveDialogOptions } from 'electron'
import * as fs from 'fs/promises'
import { approveDirectoryPath, approveFilePath, assertPathAuthorized, normalizeUserPath } from './pathAccess'

export const handleReadDirectory = async (_event: IpcMainInvokeEvent, dirPath: string) => {
  try {
    const resolvedPath = assertPathAuthorized(dirPath, 'read-directory')
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true })
    return entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? 'folder' : 'file'
    }))
  } catch (error) {
    console.error('Failed to read directory:', error)
    return []
  }
}

export const handleReadFile = async (_event: IpcMainInvokeEvent, filePath: string) => {
  try {
    const resolvedPath = assertPathAuthorized(filePath, 'read-file')
    const content = await fs.readFile(resolvedPath, 'utf-8')
    return content
  } catch (error) {
    console.error('Failed to read file:', error)
    return ''
  }
}

export const handleWriteFile = async (_event: IpcMainInvokeEvent, filePath: string, content: string) => {
  try {
    const resolvedPath = assertPathAuthorized(filePath, 'write-file')
    console.log('Writing file to:', resolvedPath)
    await fs.writeFile(resolvedPath, content, 'utf-8')
    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to write file:', error)
    return { success: false, error: String(error) }
  }
}

export const handleSelectDirectory = async (_event: IpcMainInvokeEvent, operation: string) => {
  const isExport = operation === 'export'
  const isSave = operation === 'save'

  const properties: OpenDialogOptions['properties'] = isExport || isSave ? ['openDirectory', 'createDirectory'] : ['openDirectory']

  const title = isExport ? 'Choose export folder' : isSave ? 'Choose where to save your project' : 'Select folder'

  const result = await dialog.showOpenDialog({
    title,
    properties
  })
  if (result.canceled) {
    return null
  } else {
    if (!result.filePaths || result.filePaths.length === 0) return null
    const selectedPath = approveDirectoryPath(result.filePaths[0])
    return selectedPath || null
  }
}

export const handleMakeDirectory = async (_event: IpcMainInvokeEvent, dirPath: string) => {
  try {
    const resolvedPath = assertPathAuthorized(dirPath, 'make-directory')
    console.log('Making directory at:', resolvedPath)
    await fs.mkdir(resolvedPath, { recursive: true })
    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to create directory:', error)
    return { success: false, error: String(error) }
  }
}

// New handler for deleting a file
export const handleDeleteFile = async (_event: IpcMainInvokeEvent, filePath: string) => {
  let resolvedPath = ''
  try {
    resolvedPath = assertPathAuthorized(filePath, 'delete-file')
    console.log('Deleting file at:', resolvedPath)
    await fs.unlink(resolvedPath)
    console.log('File deleted successfully:', resolvedPath)
    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log('File to delete not found, treating as success:', resolvedPath)
      return { success: true }
    }
    console.error('Failed to delete file:', error)
    return { success: false, error: String(error) }
  }
}

export const handleShowSaveDialog = async (_event: IpcMainInvokeEvent, options: SaveDialogOptions) => {
  const result = await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) {
    return null
  }
  // Ensure the extension is always .mns
  const filePath = result.filePath.endsWith('.mns') ? result.filePath : `${result.filePath}.mns`
  const normalized = normalizeUserPath(filePath)
  const approved = approveFilePath(normalized)
  return approved || null
}

export const handleOpenFileDialog = async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Minstrel Project',
    properties: ['openFile'],
    filters: [{ name: 'Minstrel Projects', extensions: ['mns'] }]
  })
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  const approved = approveFilePath(result.filePaths[0])
  return approved || null
}

export const registerFileOpsHandlers = () => {
  ipcMain.handle('read-directory', handleReadDirectory)
  ipcMain.handle('read-file', handleReadFile)
  ipcMain.handle('write-file', handleWriteFile)
  ipcMain.handle('make-directory', handleMakeDirectory)
  ipcMain.handle('select-directory', handleSelectDirectory)
  ipcMain.handle('delete-file', handleDeleteFile)
  ipcMain.handle('show-save-dialog', handleShowSaveDialog)
  ipcMain.handle('open-file-dialog', handleOpenFileDialog)
}
