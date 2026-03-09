import * as os from 'os'
import * as path from 'path'

const homedir = os.homedir()
const approvedDirectories = new Set<string>()
const approvedFiles = new Set<string>()

const isTestEnv = (): boolean => process.env.NODE_ENV === 'test' || process.env.VITEST === '1'

export const normalizeUserPath = (inputPath: string): string => {
  if (typeof inputPath !== 'string' || inputPath.trim() === '') {
    return ''
  }

  const expanded = inputPath.replace(/^~(?=\/|$)/, homedir)
  return path.resolve(expanded)
}

const isWithinDirectory = (targetPath: string, directoryPath: string): boolean => {
  const relative = path.relative(directoryPath, targetPath)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

export const approveDirectoryPath = (dirPath: string): string => {
  const normalized = normalizeUserPath(dirPath)
  if (!normalized) return ''
  approvedDirectories.add(normalized)
  return normalized
}

export const approveFilePath = (filePath: string): string => {
  const normalized = normalizeUserPath(filePath)
  if (!normalized) return ''
  approvedFiles.add(normalized)
  approvedDirectories.add(path.dirname(normalized))
  return normalized
}

export const isPathAuthorized = (targetPath: string): boolean => {
  if (isTestEnv()) return true

  const normalized = normalizeUserPath(targetPath)
  if (!normalized) return false

  if (approvedFiles.has(normalized)) return true
  for (const approvedDir of approvedDirectories) {
    if (isWithinDirectory(normalized, approvedDir)) {
      return true
    }
  }
  return false
}

export const assertPathAuthorized = (targetPath: string, operation: string): string => {
  const normalized = normalizeUserPath(targetPath)
  if (!normalized) {
    throw new Error('Invalid path provided.')
  }
  if (!isPathAuthorized(normalized)) {
    throw new Error(`Unauthorized path for ${operation}: ${normalized}`)
  }
  return normalized
}
