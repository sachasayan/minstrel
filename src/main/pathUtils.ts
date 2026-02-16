import * as path from 'path'
import * as os from 'os'

const homedir = os.homedir()

/**
 * Resolves a file path, handling tilde (~) expansion and ensuring it is an absolute path.
 * This helps prevent path traversal attacks by resolving '..' segments.
 */
export const resolvePath = (filePath: string): string => {
  if (typeof filePath !== 'string' || !filePath) {
    return ''
  }

  // Handle tilde expansion at the beginning of the path
  const substitutedPath = filePath.startsWith('~')
    ? path.join(homedir, filePath.slice(1))
    : filePath

  // Use path.resolve to get an absolute path and resolve any '..' segments
  return path.resolve(substitutedPath)
}

/**
 * Validates if a resolved absolute path is considered safe for the application to access.
 * It restricts access to the user's home directory and common non-system mount points.
 */
export const isPathSafe = (resolvedPath: string): boolean => {
  if (!resolvedPath) return false

  // Ensure we are working with an absolute path
  if (!path.isAbsolute(resolvedPath)) {
    return false
  }

  // Normalize for comparison
  const normalizedPath = path.normalize(resolvedPath)

  // 1. Allow anything in the home directory
  if (normalizedPath === homedir || normalizedPath.startsWith(homedir + path.sep)) {
    // Disallow sensitive subdirectories in home to prevent leakage of credentials
    const sensitiveInHome = [
      path.join(homedir, '.ssh'),
      path.join(homedir, '.aws'),
      path.join(homedir, '.gnupg'),
      path.join(homedir, '.bash_history'),
      path.join(homedir, '.zsh_history')
    ]

    if (sensitiveInHome.some(sensitivePath =>
      normalizedPath === sensitivePath || normalizedPath.startsWith(sensitivePath + path.sep)
    )) {
      return false
    }

    return true
  }

  // 2. Allow common external drive locations for macOS and Linux
  const safeBases = [
    '/Volumes', // macOS external drives
    '/media',   // Linux external drives
    '/mnt',     // Linux mounts
  ]

  if (safeBases.some(base =>
    normalizedPath === base || normalizedPath.startsWith(base + path.sep)
  )) {
    return true
  }

  // 3. Windows-specific safety checks
  if (process.platform === 'win32') {
    const lowerPath = normalizedPath.toLowerCase()

    // Disallow Windows system and program files
    const winForbidden = [
      'c:\\windows',
      'c:\\program files',
      'c:\\program files (x86)',
      'c:\\users\\all users',
      'c:\\programdata'
    ]

    if (winForbidden.some(forbidden =>
      lowerPath === forbidden || lowerPath.startsWith(forbidden + '\\')
    )) {
      return false
    }

    // Allow other drive letters (assuming they are data drives)
    if (/^[a-zA-Z]:\\/.test(normalizedPath)) {
      return true
    }
  }

  return false
}
