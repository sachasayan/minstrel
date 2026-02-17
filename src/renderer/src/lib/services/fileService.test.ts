import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getProjectFragmentMeta,
  fetchProjects,
  fetchProjectDetails,
  saveProject,
  isSqliteFormat
} from './fileService'

// Mock dependencies
vi.mock('./sqliteService', () => ({
  loadSqliteProject: vi.fn(),
  saveSqliteProject: vi.fn()
}))

import { loadSqliteProject, saveSqliteProject } from './sqliteService'

// Mock Electron window global
const mockInvoke = vi.fn()
;(global as any).window = {
  electron: {
    ipcRenderer: {
      invoke: mockInvoke
    }
  }
}

// Mock DOMParser for decodeHtmlEntities (used internally or tested if exported)
;(global as any).DOMParser = class {
  parseFromString(html: string) {
    return {
      documentElement: { textContent: html } // Simple mock
    }
  }
}

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isSqliteFormat', () => {
    it('should identify .mns files', () => {
      expect(isSqliteFormat('test.mns')).toBe(true)
      expect(isSqliteFormat('TEST.MNS')).toBe(true)
      expect(isSqliteFormat('test.md')).toBe(false)
    })
  })

  describe('getProjectFragmentMeta', () => {
    it('should handle SQLite files via IPC', async () => {
      mockInvoke.mockResolvedValueOnce({
        title: 'SQLite Project',
        wordCountCurrent: 100,
        coverImageBase64: 'abc',
        coverImageMimeType: 'image/png'
      })
      
      const meta = await getProjectFragmentMeta('test.mns')
      expect(meta?.title).toBe('SQLite Project')
      expect(meta?.cover).toContain('data:image/png;base64,abc')
      expect(mockInvoke).toHaveBeenCalledWith('get-sqlite-project-meta', 'test.mns')
    })

    it('should handle Markdown files by parsing content', async () => {
      const mockMd = '----Metadata.json\n{"title": "MD Project", "wordCountCurrent": 50}\n----'
      mockInvoke.mockResolvedValueOnce(mockMd)
      
      const meta = await getProjectFragmentMeta('test.md')
      expect(meta?.title).toBe('MD Project')
      expect(meta?.wordCountCurrent).toBe(50)
      expect(mockInvoke).toHaveBeenCalledWith('read-file', 'test.md')
    })

    it('should return null if essential metadata is missing', async () => {
      mockInvoke.mockResolvedValueOnce('invalid content')
      const meta = await getProjectFragmentMeta('test.md')
      expect(meta).toBeNull()
    })
  })

  describe('fetchProjects', () => {
    it('should fetch and parse multiple projects concurrently', async () => {
      mockInvoke.mockResolvedValueOnce([
        { name: 'p1.mns', type: 'file' },
        { name: 'p2.md', type: 'file' }
      ])
      // Mock SQLite meta
      mockInvoke.mockResolvedValueOnce({ title: 'P1' })
      // Mock MD content
      mockInvoke.mockResolvedValueOnce('----Metadata.json\n{"title": "P2"}\n----')
      
      const projects = await fetchProjects('/root')
      expect(projects).toHaveLength(2)
      expect(projects[0].title).toBe('P1')
      expect(projects[1].title).toBe('P2')
    })
  })

  describe('fetchProjectDetails', () => {
    it('should delegate to sqliteService for .mns files', async () => {
      const fragment = { projectPath: 'test.mns', title: 'P1' } as any
      const mockProject = { title: 'P1', files: [] }
      vi.mocked(loadSqliteProject).mockResolvedValueOnce(mockProject as any)
      
      const project = await fetchProjectDetails(fragment)
      expect(project.title).toBe('P1')
      expect(loadSqliteProject).toHaveBeenCalledWith(fragment)
    })

    it('should parse Markdown file into Project object', async () => {
      const fragment = { projectPath: 'test.md', title: 'P1' } as any
      const mockMd = `
----Metadata.json
{"title": "P1", "wordCountCurrent": 10}
----
----Chapter 1
# Chapter 1
Once upon a time...
      `
      mockInvoke.mockResolvedValueOnce(mockMd)
      
      const project = await fetchProjectDetails(fragment)
      expect(project.title).toBe('P1')
      // Chapters are moved to storyContent and removed from files array during normalization
      expect(project.storyContent).toContain('Once upon a time')
      expect(project.files).toHaveLength(0) 
    })
  })

  describe('saveProject', () => {
    it('should save existing SQLite project directly', async () => {
      const project = { projectPath: 'test.mns', title: 'P1', files: [] } as any
      vi.mocked(saveSqliteProject).mockResolvedValueOnce(true)
      
      const result = await saveProject(project)
      expect(result.success).toBe(true)
      expect(saveSqliteProject).toHaveBeenCalled()
    })

    it('should convert MD to SQLite on save and delete original', async () => {
      const project = { projectPath: 'test.md', title: 'P1', files: [] } as any
      vi.mocked(saveSqliteProject).mockResolvedValueOnce(true)
      mockInvoke.mockResolvedValueOnce({ success: true }) // delete-file
      
      const result = await saveProject(project)
      expect(result.success).toBe(true)
      expect(result.finalPath).toBe('test.mns')
      expect(mockInvoke).toHaveBeenCalledWith('delete-file', 'test.md')
    })
  })
})
