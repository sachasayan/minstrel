import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as path from 'path'
import { resolvePath, isPathSafe } from './pathUtils'

// Mock os.homedir()
vi.mock('os', async (importOriginal) => {
  const original = await importOriginal<typeof import('os')>()
  return {
    ...original,
    homedir: vi.fn(() => '/home/user')
  }
})

describe('pathUtils', () => {
  const homedir = '/home/user'

  describe('resolvePath', () => {
    it('should expand tilde to homedir', () => {
      const result = resolvePath('~/documents/story.txt')
      expect(result).toBe(path.resolve(homedir, 'documents/story.txt'))
    })

    it('should return absolute path for relative path', () => {
      const result = resolvePath('documents/story.txt')
      expect(result).toBe(path.resolve('documents/story.txt'))
    })

    it('should resolve .. segments', () => {
      const result = resolvePath('~/documents/../secret.txt')
      expect(result).toBe(path.resolve(homedir, 'secret.txt'))
    })

    it('should handle empty or non-string input', () => {
      expect(resolvePath('')).toBe('')
      expect(resolvePath(null as any)).toBe('')
    })
  })

  describe('isPathSafe', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should allow paths in homedir', () => {
      const safePath = path.join(homedir, 'projects/my-book.minstrel')
      expect(isPathSafe(safePath)).toBe(true)
    })

    it('should disallow sensitive paths in homedir', () => {
      const sshPath = path.join(homedir, '.ssh/id_rsa')
      const awsPath = path.join(homedir, '.aws/credentials')
      expect(isPathSafe(sshPath)).toBe(false)
      expect(isPathSafe(awsPath)).toBe(false)
    })

    it('should disallow system paths on Unix', () => {
      if (process.platform !== 'win32') {
        expect(isPathSafe('/etc/passwd')).toBe(false)
        expect(isPathSafe('/var/log/syslog')).toBe(false)
        expect(isPathSafe('/usr/bin/node')).toBe(false)
      }
    })

    it('should allow common mount points on Unix', () => {
      if (process.platform !== 'win32') {
        expect(isPathSafe('/Volumes/ExternalDrive/story.txt')).toBe(true)
        expect(isPathSafe('/media/user/USB/story.txt')).toBe(true)
        expect(isPathSafe('/mnt/data/story.txt')).toBe(true)
      }
    })

    it('should handle Windows system paths if on Windows', () => {
      if (process.platform === 'win32') {
        expect(isPathSafe('C:\\Windows\\System32\\config')).toBe(false)
        expect(isPathSafe('C:\\Program Files\\Nodejs\\node.exe')).toBe(false)
        expect(isPathSafe('D:\\MyDocuments\\story.txt')).toBe(true)
      }
    })

    it('should return false for empty or non-absolute paths', () => {
      expect(isPathSafe('')).toBe(false)
      expect(isPathSafe('relative/path')).toBe(false)
    })
  })
})
