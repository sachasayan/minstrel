import * as path from 'path'
import * as os from 'os'
import { loadAppSettings } from './settingsManager'

const homedir = os.homedir()

/**
 * Resolves a file path, expanding '~' and ensuring it is absolute.
 */
export const resolvePath = (filePath: string): string => {
  if (typeof filePath !== 'string' || !filePath) {
    return ''
  }
  // Standardize the path and handle tilde at the start
  const expandedPath = filePath.replace(/^~(?=$|\/|\\)/, homedir)
  return path.resolve(expandedPath)
}

/**
 * Checks if a child path is within a parent directory.
 */
export const isPathInside = (parent: string, child: string): boolean => {
  const relative = path.relative(parent, child)
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

/**
 * Validates that a project path is within the allowed workingRootDirectory.
 * Defaults to ~/Documents/minstrel if no workingRootDirectory is set.
 */
export const validateProjectPath = async (filePath: string): Promise<boolean> => {
  const resolvedPath = resolvePath(filePath)
  if (!resolvedPath) return false

  const settings = await loadAppSettings()
  let workingRootDir = settings.workingRootDirectory ? resolvePath(settings.workingRootDirectory) : null

  if (!workingRootDir) {
    // Default to Documents/minstrel if not set
    workingRootDir = resolvePath('~/Documents/minstrel')
  }

  return isPathInside(workingRootDir, resolvedPath)
}
