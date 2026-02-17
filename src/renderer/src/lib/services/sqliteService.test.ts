import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  initSqliteProject,
  saveSqliteProject,
  loadSqliteProject,
  fetchSqliteProjects
} from './sqliteService'
import { Project, ProjectFragment } from '@/types'

// Mock Electron window global
const mockInvoke = vi.fn()
;(global as any).window = {
  electron: {
    ipcRenderer: {
      invoke: mockInvoke
    }
  }
}

describe('sqliteService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initSqliteProject', () => {
    it('should initialize and then save the project', async () => {
      const project: Project = {
        title: 'New Project',
        projectPath: 'test.mns',
        files: []
      } as any
      
      mockInvoke.mockResolvedValueOnce({ success: true }) // init-sqlite-project
      mockInvoke.mockResolvedValueOnce({ success: true }) // save-sqlite-project
      
      const result = await initSqliteProject('test.mns', project)
      
      expect(result).toBe(true)
      expect(mockInvoke).toHaveBeenCalledTimes(2)
      expect(mockInvoke).toHaveBeenNthCalledWith(1, 'init-sqlite-project', 'test.mns', expect.objectContaining({ title: 'New Project' }))
    })

    it('should return false if init-sqlite-project fails', async () => {
      mockInvoke.mockResolvedValueOnce({ success: false, error: 'Fail' })
      const result = await initSqliteProject('test.mns', {} as any)
      expect(result).toBe(false)
      expect(mockInvoke).toHaveBeenCalledTimes(1)
    })
  })

  describe('saveSqliteProject', () => {
    it('should invoke save-sqlite-project IPC', async () => {
      const project: Project = { projectPath: 'test.mns', title: 'Test' } as any
      mockInvoke.mockResolvedValueOnce({ success: true })
      
      const result = await saveSqliteProject(project)
      expect(result).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('save-sqlite-project', 'test.mns', expect.any(Object))
    })

    it('should return false if projectPath is missing', async () => {
      const result = await saveSqliteProject({} as any)
      expect(result).toBe(false)
      expect(mockInvoke).not.toHaveBeenCalled()
    })
  })

  describe('loadSqliteProject', () => {
    it('should invoke load-sqlite-project IPC', async () => {
      const fragment: ProjectFragment = { projectPath: 'test.mns' } as any
      const mockProject = { title: 'Loaded' }
      mockInvoke.mockResolvedValueOnce(mockProject)
      
      const result = await loadSqliteProject(fragment)
      expect(result).toEqual(mockProject)
      expect(mockInvoke).toHaveBeenCalledWith('load-sqlite-project', 'test.mns')
    })
  })

  describe('fetchSqliteProjects', () => {
    it('should fetch all projects from directory using bulk fetch', async () => {
      const rootDir = '/root'
      mockInvoke.mockResolvedValueOnce([{ name: 'p1.mns', type: 'file' }]) // read-directory
      mockInvoke.mockResolvedValueOnce([{ title: 'P1', projectPath: '/root/p1.mns' }]) // get-sqlite-projects-meta
      
      const projects = await fetchSqliteProjects(rootDir)
      expect(projects).toHaveLength(1)
      expect(projects[0].title).toBe('P1')
      expect(mockInvoke).toHaveBeenCalledWith('get-sqlite-projects-meta', ['/root/p1.mns'])
    })

    it('should filter out invalid metadata from results', async () => {
      mockInvoke.mockResolvedValueOnce([{ name: 'p1.mns', type: 'file' }])
      mockInvoke.mockResolvedValueOnce([null, { title: 'Valid', projectPath: '/p.mns' }])
      
      const projects = await fetchSqliteProjects('/root')
      expect(projects).toHaveLength(1)
      expect(projects[0].title).toBe('Valid')
    })

    it('should return empty array if rootDir is null', async () => {
      const projects = await fetchSqliteProjects(null)
      expect(projects).toEqual([])
      expect(mockInvoke).not.toHaveBeenCalled()
    })
  })
})
