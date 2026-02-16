import { dialog, ipcMain, OpenDialogOptions } from 'electron'
import * as fs from 'fs/promises'
import { resolvePath } from './pathUtils'

export const handleReadDirectory = async (_event, dirPath) => {
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

export const handleReadFile = async (_event, filePath) => {
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

export const handleWriteFile = async (_event, filePath, content) => {
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

export const handleSelectDirectory = async (_event, operation) => {
  // Define the correct type for properties based on OpenDialogOptions['properties']
  const properties: OpenDialogOptions['properties'] = operation === 'export' ? ['openDirectory', 'createDirectory'] : ['openDirectory']

  const result = await dialog.showOpenDialog({
    properties: properties // Now correctly typed
  })
  if (result.canceled) {
    return null
  } else {
    // Ensure filePaths exists and has elements before accessing
    return result.filePaths && result.filePaths.length > 0 ? result.filePaths[0] : null
  }
}

export const handleMakeDirectory = async (_event, dirPath) => {
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
export const handleDeleteFile = async (_event, filePath) => {
  const resolvedPath = resolvePath(filePath)
  if (!resolvedPath) return { success: false, error: 'Invalid file path provided.' }

  console.log('Deleting file at:', resolvedPath)
  try {
    await fs.unlink(resolvedPath)
    console.log('File deleted successfully:', resolvedPath)
    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to delete file:', error)
    // Check for specific errors like file not found (ENOENT) if needed
    // if (error.code === 'ENOENT') {
    //   return { success: true }; // Or false depending on desired behavior if file doesn't exist
    // }
    return { success: false, error: String(error) }
  }
}

export const registerFileOpsHandlers = () => {
  ipcMain.handle('read-directory', handleReadDirectory)
  ipcMain.handle('read-file', handleReadFile)
  ipcMain.handle('write-file', handleWriteFile)
  ipcMain.handle('make-directory', handleMakeDirectory)
  ipcMain.handle('select-directory', handleSelectDirectory)
  ipcMain.handle('delete-file', handleDeleteFile) // Register the new handler
}
