import { ipcMain } from 'electron'
import * as os from 'os'
import Database from 'better-sqlite3'
import * as path from 'path'
import * as fs from 'fs/promises'

const homedir = os.homedir()

// Helper function to resolve paths with home directory
const resolvePath = (filePath: string): string => {
  return filePath.replace('~', homedir)
}

// Initialize a new SQLite database for a project
export const handleInitSqliteProject = async (_event, filePath: string, metadata: any) => {
  const resolvedPath = resolvePath(filePath)

  try {
    // Ensure directory exists
    const dir = path.dirname(resolvedPath)
    await fs.mkdir(dir, { recursive: true })

    // Create and initialize the database
    const db = new Database(resolvedPath)

    // Create tables
    db.exec(`
      -- Metadata table for project information
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      -- Files table for project content
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Insert metadata
    const insertMetadata = db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)')
    const insertMetadataTransaction = db.transaction((metadata) => {
      for (const [key, value] of Object.entries(metadata)) {
        insertMetadata.run(key, JSON.stringify(value))
      }
    })

    insertMetadataTransaction(metadata)

    db.close()
    return { success: true }
  } catch (error) {
    console.error('Failed to initialize SQLite project:', error)
    return { success: false, error: String(error) }
  }
}

// Save project to SQLite database
export const handleSaveSqliteProject = async (_event, filePath: string, project: any) => {
  const resolvedPath = resolvePath(filePath)

  try {
    const db = new Database(resolvedPath)

    // Update metadata
    const metadata = {
      title: project.title,
      genre: project.genre,
      summary: project.summary,
      author: 'Sacha', // Hardcoded as in the original code
      year: project.year,
      writingSample: project.writingSample,
      wordCountTarget: project.wordCountTarget,
      wordCountCurrent: project.wordCountCurrent,
      expertSuggestions: project.expertSuggestions
    }

    const insertMetadata = db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)')
    const insertMetadataTransaction = db.transaction((metadata) => {
      for (const [key, value] of Object.entries(metadata)) {
        insertMetadata.run(key, JSON.stringify(value))
      }
    })

    insertMetadataTransaction(metadata)

    // Clear existing files and insert new ones
    db.exec('DELETE FROM files')

    const insertFile = db.prepare(`
      INSERT INTO files (title, content, type, sort_order)
      VALUES (?, ?, ?, ?)
    `)

    const insertFilesTransaction = db.transaction((files) => {
      let sortOrder = 0

      // Insert skeleton if it exists
      const skeleton = files.find((e) => e.title.indexOf('Skeleton') !== -1)
      if (skeleton) {
        insertFile.run(skeleton.title, skeleton.content, 'skeleton', sortOrder++)
      }

      // Insert outline if it exists
      const outline = files.find((e) => e.title.indexOf('Outline') !== -1)
      if (outline) {
        insertFile.run(outline.title, outline.content, 'outline', sortOrder++)
      }

      // Insert chapters
      const chapters = files.filter((e) => e.title.indexOf('Chapter') !== -1)
      chapters.forEach((chapter) => {
        insertFile.run(chapter.title, chapter.content, 'chapter', sortOrder++)
      })
    })

    insertFilesTransaction(project.files)

    db.close()
    return { success: true }
  } catch (error) {
    console.error('Failed to save SQLite project:', error)
    return { success: false, error: String(error) }
  }
}

// Load project metadata from SQLite database
export const handleGetSqliteProjectMeta = async (_event, filePath: string) => {
  const resolvedPath = resolvePath(filePath)

  try {
    const db = new Database(resolvedPath, { readonly: true })

    // Get metadata
    const metadataRows = db.prepare('SELECT key, value FROM metadata').all()
    const metadata = metadataRows.reduce((acc, row) => {
      acc[row.key] = JSON.parse(row.value)
      return acc
    }, {})

    db.close()

    return {
      title: metadata.title,
      wordCountCurrent: metadata.wordCountCurrent,
      wordCountTarget: metadata.wordCountTarget,
      projectPath: filePath,
      genre: metadata.genre || 'science-fiction',
      cover: ''
    }
  } catch (error) {
    console.error('Failed to get SQLite project metadata:', error)
    throw new Error('Could not load project fragment metadata.')
  }
}

// Load full project from SQLite database
export const handleLoadSqliteProject = async (_event, filePath: string) => {
  const resolvedPath = resolvePath(filePath)

  try {
    const db = new Database(resolvedPath, { readonly: true })

    // Get metadata
    const metadataRows = db.prepare('SELECT key, value FROM metadata').all()
    const metadata = metadataRows.reduce((acc, row) => {
      acc[row.key] = JSON.parse(row.value)
      return acc
    }, {})

    // Get files
    const files = db.prepare(`
      SELECT title, content, type
      FROM files
      ORDER BY sort_order
    `).all()

    const projectFiles = files.map(file => ({
      title: file.title,
      content: file.content,
      hasEdits: false
    }))

    db.close()

    return {
      ...metadata,
      projectPath: filePath,
      files: projectFiles,
      knowledgeGraph: null
    }
  } catch (error) {
    console.error('Failed to load SQLite project:', error)
    throw new Error('Could not load project details.')
  }
}

export const registerSqliteOpsHandlers = () => {
  ipcMain.handle('init-sqlite-project', handleInitSqliteProject)
  ipcMain.handle('save-sqlite-project', handleSaveSqliteProject)
  ipcMain.handle('get-sqlite-project-meta', handleGetSqliteProjectMeta)
  ipcMain.handle('load-sqlite-project', handleLoadSqliteProject)
}
