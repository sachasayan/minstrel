import { dialog, ipcMain } from 'electron'
import * as os from 'os'
import * as fs from 'fs/promises'

const homedir = os.homedir()

export const handleReadDirectory = async (_event, dirPath) => {
  if (typeof dirPath !== 'string') {
    console.error('dirPath is not a string:', dirPath)
    return []
  }
  const resolvedPath = dirPath.replace('~', homedir) // Resolve "~" to user's home directory
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
  const resolvedPath = filePath.replace('~', homedir) // Resolve "~" to user's home directory
  try {
    const content = await fs.readFile(resolvedPath, 'utf-8')
    return content
  } catch (error) {
    console.error('Failed to read file:', error)
    return ''
  }
}

export const handleWriteFile = async (_event, filePath, content) => {
  const resolvedPath = filePath.replace('~', homedir) // Resolve "~" to user's home directory
  console.log('resolvedPath', resolvedPath)
  try {
    await fs.writeFile(resolvedPath, content, 'utf-8')
    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to write file:', error)
    return { success: false, error: String(error) }
  }
}

export const handleSelectDirectory = async (_event, operation) => {
  const properties = operation === 'export' ? ['openDirectory', 'createDirectory'] : ['openDirectory']
  const result = await dialog.showOpenDialog({
    properties: properties
  })
  if (result.canceled) {
    return null
  } else {
    return result.filePaths[0]
  }
}

export const handleMakeDirectory = async (_event, dirPath) => {
  const resolvedPath = dirPath.replace('~', homedir) // Resolve "~"
  console.log('Making directory at:', resolvedPath)
  try {
    await fs.mkdir(resolvedPath, { recursive: true })
    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to create directory:', error)
    return { success: false, error: String(error) }
  }
}

export const registerFileOpsHandlers = () => {
  ipcMain.handle('read-directory', handleReadDirectory)
  ipcMain.handle('read-file', handleReadFile)
  ipcMain.handle('write-file', handleWriteFile)
  ipcMain.handle('make-directory', handleMakeDirectory)
  ipcMain.handle('select-directory', handleSelectDirectory)
}
