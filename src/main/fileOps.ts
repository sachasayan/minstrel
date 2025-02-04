import { ipcMain } from 'electron'
import * as os from 'os'
import * as fs from 'fs/promises'

const homedir = os.homedir()

export const handleReadDirectory = async (event, dirPath) => {
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

export const handleReadFile = async (event, filePath) => {
  const resolvedPath = filePath.replace('~', homedir) // Resolve "~" to user's home directory
  console.log('resolvedPath', resolvedPath)
  try {
    const content = await fs.readFile(resolvedPath, 'utf-8')
    return content
  } catch (error) {
    console.error('Failed to read file:', error)
    return ''
  }
}

export const handleWriteFile = async (event, filePath, content) => {
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

export const registerFileOpsHandlers = () => {
  ipcMain.handle('read-directory', handleReadDirectory)
  ipcMain.handle('read-file', handleReadFile)
  ipcMain.handle('write-file', handleWriteFile)
}
