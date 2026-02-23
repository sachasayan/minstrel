import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleReadDirectory,
  handleReadFile,
  handleWriteFile,
  handleSelectDirectory,
  handleMakeDirectory,
  handleDeleteFile
} from './fileOps'
import { dialog } from 'electron'
import * as fs from 'fs/promises'

// Mock electron
vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn()
  },
  ipcMain: {
    handle: vi.fn()
  }
}))

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  unlink: vi.fn()
}))

// Mock os.homedir
vi.mock('os', () => ({
  homedir: () => '/Users/test'
}))

describe('fileOps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleReadDirectory', () => {
    it('should read directory and map entries', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'file1.txt', isDirectory: () => false },
        { name: 'folder1', isDirectory: () => true }
      ] as any)

      const result = await handleReadDirectory({} as any, '/some/path')
      expect(result).toEqual([
        { name: 'file1.txt', type: 'file' },
        { name: 'folder1', type: 'folder' }
      ])
      expect(fs.readdir).toHaveBeenCalledWith('/some/path', { withFileTypes: true })
    })

    it('should resolve ~ to homedir', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([])
      await handleReadDirectory({} as any, '~/path')
      expect(fs.readdir).toHaveBeenCalledWith('/Users/test/path', expect.anything())
    })

    it('should return empty array on error', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Read error'))
      const result = await handleReadDirectory({} as any, '/error/path')
      expect(result).toEqual([])
    })
  })

  describe('handleReadFile', () => {
    it('should read file content', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('content')
      const result = await handleReadFile({} as any, '/file.txt')
      expect(result).toBe('content')
    })

    it('should return empty string on error', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'))
      const result = await handleReadFile({} as any, '/file.txt')
      expect(result).toBe('')
    })
  })

  describe('handleWriteFile', () => {
    it('should write file and return success', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      const result = await handleWriteFile({} as any, '/file.txt', 'hello')
      expect(result).toEqual({ success: true })
      expect(fs.writeFile).toHaveBeenCalledWith('/file.txt', 'hello', 'utf-8')
    })

    it('should return error on failure', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write error'))
      const result = await handleWriteFile({} as any, '/file.txt', 'hello')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Write error')
    })
  })

  describe('handleMakeDirectory', () => {
    it('should create directory and return success', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      const result = await handleMakeDirectory({} as any, '/new/dir')
      expect(result).toEqual({ success: true })
      expect(fs.mkdir).toHaveBeenCalledWith('/new/dir', { recursive: true })
    })

    it('should return error on failure', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Mkdir error'))
      const result = await handleMakeDirectory({} as any, '/new/dir')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Mkdir error')
    })
  })

  describe('handleSelectDirectory', () => {
    it('should return selected path for import', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({ canceled: false, filePaths: ['/selected/path'] })
      const result = await handleSelectDirectory({} as any, 'import')
      expect(result).toBe('/selected/path')
      expect(dialog.showOpenDialog).toHaveBeenCalledWith({
        title: 'Select folder',
        properties: ['openDirectory']
      })
    })

    it('should return selected path for export', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({ canceled: false, filePaths: ['/selected/path'] })
      const result = await handleSelectDirectory({} as any, 'export')
      expect(result).toBe('/selected/path')
      expect(dialog.showOpenDialog).toHaveBeenCalledWith({
        title: 'Choose export folder',
        properties: ['openDirectory', 'createDirectory']
      })
    })

    it('should return null if canceled', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({ canceled: true, filePaths: [] })
      const result = await handleSelectDirectory({} as any, 'import')
      expect(result).toBeNull()
    })
  })

  describe('handleDeleteFile', () => {
    it('should delete file and return success', async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined)
      const result = await handleDeleteFile({} as any, '/file.txt')
      expect(result.success).toBe(true)
    })

    it('should return success if file not found (ENOENT)', async () => {
      const error = new Error('Not found')
      ;(error as any).code = 'ENOENT'
      vi.mocked(fs.unlink).mockRejectedValue(error)
      const result = await handleDeleteFile({} as any, '/missing.txt')
      expect(result.success).toBe(true)
    })

    it('should return error on other failures', async () => {
      vi.mocked(fs.unlink).mockRejectedValue(new Error('Unlink error'))
      const result = await handleDeleteFile({} as any, '/file.txt')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unlink error')
    })
  })
})
