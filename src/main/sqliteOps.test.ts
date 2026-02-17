import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  handleInitSqliteProject,
  handleSaveSqliteProject,
  handleLoadSqliteProject,
  handleGetSqliteProjectMeta
} from './sqliteOps'
import Database from 'better-sqlite3'
import * as fs from 'fs/promises'

// Mock electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn()
  }
}))

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
  constants: {
    R_OK: 4
  }
}))

// We'll use a real in-memory database for testing
// But we need to mock the Database constructor to return our in-memory instance
vi.mock('better-sqlite3', () => {
  const ActualDatabase = require('better-sqlite3')
  return {
    default: vi.fn()
  }
})

describe('sqliteOps', () => {
  let mockDb: any

  beforeEach(() => {
    vi.clearAllMocks()
    const ActualDatabase = require('better-sqlite3')
    mockDb = new ActualDatabase(':memory:')
    mockDb.close = vi.fn()
    vi.mocked(Database).mockImplementation(() => {
      return mockDb
    })
  })

  afterEach(() => {
    // Only close if it was actually created as a real DB
    // Since we mock close to no-op, we should probably close the underlying one here
    // but better-sqlite3 will handle it as it's in-memory.
  })

  describe('handleInitSqliteProject', () => {
    it('should initialize a database with tables and metadata', async () => {
      const metadata = { title: 'Test Project', genre: 'Fantasy' }
      const result = await handleInitSqliteProject({}, 'test.db', metadata)

      expect(result.success).toBe(true)
      expect(fs.mkdir).toHaveBeenCalled()

      // Verify tables exist
      const tables = mockDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
      const tableNames = tables.map((t: any) => t.name)
      expect(tableNames).toContain('metadata')
      expect(tableNames).toContain('files')
      expect(tableNames).toContain('chat_history')

      // Verify metadata
      const savedMetadata = mockDb.prepare('SELECT key, value FROM metadata').all()
      expect(savedMetadata).toHaveLength(2)
      expect(savedMetadata).toContainEqual({ key: 'title', value: '"Test Project"' })
    })

    it('should handle errors during initialization', async () => {
      vi.mocked(Database).mockImplementationOnce(() => {
        throw new Error('DB Error')
      })
      const result = await handleInitSqliteProject({}, 'test.db', {})
      expect(result.success).toBe(false)
      expect(result.error).toContain('DB Error')
    })
  })

  describe('handleSaveSqliteProject', () => {
    it('should save project metadata, files, and chat history', async () => {
      const project = {
        title: 'Saved Project',
        genre: 'Sci-Fi',
        files: [
          { title: 'Chapter 1', content: 'Content 1', type: 'chapter', sort_order: 1 },
          { title: 'Outline', content: 'Outline content', type: 'outline', sort_order: 0 }
        ],
        chatHistory: [
          { sender: 'user', text: 'Hello', timestamp: '2023-01-01T00:00:00Z' }
        ]
      }

      const result = await handleSaveSqliteProject({}, 'test.db', project)
      expect(result.success).toBe(true)

      // Verify metadata
      const titleRow = mockDb.prepare("SELECT value FROM metadata WHERE key='title'").get()
      expect(JSON.parse(titleRow.value)).toBe('Saved Project')

      // Verify files (non-chapter)
      const files = mockDb.prepare('SELECT title, type FROM files').all()
      expect(files).toHaveLength(1)
      expect(files[0].title).toBe('Outline')

      // Verify chat history
      const chat = mockDb.prepare('SELECT text FROM chat_history').all()
      expect(chat).toHaveLength(1)
      expect(chat[0].text).toBe('Hello')
    })

    it('should rollback on error', async () => {
      // Mock exec to throw when trying to BEGIN or DELETE
      const originalExec = mockDb.exec.bind(mockDb)
      mockDb.exec = vi.fn().mockImplementation((sql) => {
        if (sql.includes('DELETE FROM metadata')) throw new Error('Transaction Error')
        return originalExec(sql)
      })

      const result = await handleSaveSqliteProject({}, 'test.db', { title: 'Fail' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Transaction Error')
    })
  })

  describe('handleGetSqliteProjectMeta', () => {
    it('should return project metadata', async () => {
      // Seed the DB
      mockDb.exec(`
        CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT);
        INSERT INTO metadata (key, value) VALUES ('title', '"Test Title"'), ('genre', '"Fantasy"');
      `)

      const meta = await handleGetSqliteProjectMeta({}, 'test.db')
      expect(meta).toEqual({
        title: 'Test Title',
        genre: 'Fantasy',
        projectPath: 'test.db'
      })
    })

    it('should return null if metadata table is missing or empty', async () => {
      // We need to ensure metadata table doesn't exist or is empty
      // By default our mockDb is empty, but handleGetSqliteProjectMeta doesn't create tables
      const meta = await handleGetSqliteProjectMeta({}, 'test.db')
      expect(meta).toBeNull()
    })
  })

  describe('handleLoadSqliteProject', () => {
    it('should load a full project structure', async () => {
      // Seed the DB
      mockDb.exec(`
        CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY, title TEXT, content TEXT, type TEXT, sort_order INTEGER);
        CREATE TABLE IF NOT EXISTS chat_history (id INTEGER PRIMARY KEY, sender TEXT, text TEXT, timestamp TEXT, metadata TEXT);
        
        INSERT INTO metadata (key, value) VALUES ('title', '"Loaded Project"'), ('genre', '"Mystery"'), ('wordCountTarget', '50000');
        INSERT INTO files (title, content, type, sort_order) VALUES ('Notes', 'Some notes', 'note', 1);
        INSERT INTO chat_history (sender, text, timestamp) VALUES ('ai', 'Hello there', '2023-01-01T00:00:00Z');
      `)

      const project = await handleLoadSqliteProject({}, 'test.db')
      expect(project.title).toBe('Loaded Project')
      expect(project.genre).toBe('Mystery')
      expect(project.files).toHaveLength(1)
      expect(project.files[0].title).toBe('Notes')
      expect(project.chatHistory).toHaveLength(1)
    })
  })
})
