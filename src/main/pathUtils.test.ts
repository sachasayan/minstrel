import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as path from 'path'
import * as os from 'os'
import { resolvePath, isPathInside, validateProjectPath } from './pathUtils'
import { loadAppSettings } from './settingsManager'

vi.mock('./settingsManager', () => ({
  loadAppSettings: vi.fn()
}))

describe('pathUtils', () => {
  const homedir = os.homedir()

  describe('resolvePath', () => {
    it('should expand tilde to home directory', () => {
      expect(resolvePath('~/test')).toBe(path.join(homedir, 'test'))
    })

    it('should resolve relative paths to absolute paths', () => {
      const resolved = resolvePath('test.db')
      expect(path.isAbsolute(resolved)).toBe(true)
      expect(resolved).toBe(path.resolve('test.db'))
    })

    it('should return empty string for invalid inputs', () => {
      expect(resolvePath('')).toBe('')
      expect(resolvePath(null as any)).toBe('')
    })
  })

  describe('isPathInside', () => {
    it('should return true if child is inside parent', () => {
      const parent = path.resolve('/base')
      const child = path.resolve('/base/sub/file.db')
      expect(isPathInside(parent, child)).toBe(true)
    })

    it('should return false if child is outside parent', () => {
      const parent = path.resolve('/base')
      const child = path.resolve('/other/file.db')
      expect(isPathInside(parent, child)).toBe(false)
    })

    it('should return false if child uses traversal to escape parent', () => {
      const parent = path.resolve('/base')
      // path.resolve resolves the .. before passing to isPathInside if we are not careful
      // But here child is already resolved.
      const child = path.resolve('/other/file.db')
      expect(isPathInside(parent, child)).toBe(false)
    })

    it('should return false if child is same as parent', () => {
        const parent = path.resolve('/base')
        const child = path.resolve('/base')
        expect(isPathInside(parent, child)).toBe(false)
    })
  })

  describe('validateProjectPath', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return true for path inside workingRootDirectory', async () => {
      const mockSettings = { workingRootDirectory: '~/Documents/minstrel' }
      vi.mocked(loadAppSettings).mockResolvedValue(mockSettings as any)

      const filePath = '~/Documents/minstrel/project.mns'
      expect(await validateProjectPath(filePath)).toBe(true)
    })

    it('should return false for path outside workingRootDirectory', async () => {
      const mockSettings = { workingRootDirectory: '~/Documents/minstrel' }
      vi.mocked(loadAppSettings).mockResolvedValue(mockSettings as any)

      const filePath = '/etc/passwd'
      expect(await validateProjectPath(filePath)).toBe(false)
    })

    it('should use default directory if workingRootDirectory is not set', async () => {
      vi.mocked(loadAppSettings).mockResolvedValue({ workingRootDirectory: null } as any)

      const filePath = '~/Documents/minstrel/myproject.mns'
      expect(await validateProjectPath(filePath)).toBe(true)

      const evilPath = '~/Documents/other/evil.mns'
      expect(await validateProjectPath(evilPath)).toBe(false)
    })
  })
})
