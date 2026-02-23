import { dialog, ipcMain, IpcMainInvokeEvent, OpenDialogOptions, SaveDialogOptions } from 'electron'
import * as os from 'os'
import * as fs from 'fs/promises'

const homedir = os.homedir()

// Helper function to resolve paths, handling '~'
const resolvePath = (filePath: string): string => {
  if (typeof filePath !== 'string') {
    console.error('Invalid path provided:', filePath)
    // Return a value or throw an error as appropriate for your error handling strategy
    // For now, returning an empty string to avoid crashing, but this should be handled robustly
    return ''
  }
  return filePath.replace('~', homedir)
}

export const handleReadDirectory = async (_event: IpcMainInvokeEvent, dirPath: string) => {
  const resolvedPath = resolvePath(dirPath)
  if (!resolvedPath) return []

  try {
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
  const resolvedPath = resolvePath(filePath)
  if (!resolvedPath) return ''

  try {
    const content = await fs.readFile(resolvedPath, 'utf-8')
    return content
  } catch (error) {
    console.error('Failed to read file:', error)
    return ''
  }
}

export const handleWriteFile = async (
  _event: IpcMainInvokeEvent,
  filePath: string,
  content: string
) => {
  const resolvedPath = resolvePath(filePath)
  if (!resolvedPath) return { success: false, error: 'Invalid file path provided.' }

  console.log('Writing file to:', resolvedPath)
  try {
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

  const properties: OpenDialogOptions['properties'] =
    isExport || isSave ? ['openDirectory', 'createDirectory'] : ['openDirectory']

  const title = isExport
    ? 'Choose export folder'
    : isSave
      ? 'Choose where to save your project'
      : 'Select folder'

  const result = await dialog.showOpenDialog({
    title,
    properties
  })
  if (result.canceled) {
    return null
  } else {
    return result.filePaths && result.filePaths.length > 0 ? result.filePaths[0] : null
  }
}

export const handleMakeDirectory = async (_event: IpcMainInvokeEvent, dirPath: string) => {
  const resolvedPath = resolvePath(dirPath)
  if (!resolvedPath) return { success: false, error: 'Invalid directory path provided.' }

  console.log('Making directory at:', resolvedPath)
  try {
    await fs.mkdir(resolvedPath, { recursive: true })
    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to create directory:', error)
    return { success: false, error: String(error) }
  }
}

// New handler for deleting a file
export const handleDeleteFile = async (_event: IpcMainInvokeEvent, filePath: string) => {
  const resolvedPath = resolvePath(filePath)
  if (!resolvedPath) return { success: false, error: 'Invalid file path provided.' }

  console.log('Deleting file at:', resolvedPath)
  try {
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

export const handleShowSaveDialog = async (
  _event: IpcMainInvokeEvent,
  options: SaveDialogOptions
) => {
  const result = await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) {
    return null
  }
  // Ensure the extension is always .mns
  const filePath = result.filePath.endsWith('.mns') ? result.filePath : `${result.filePath}.mns`
  return filePath
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
  return result.filePaths[0]
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
