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

const isChapterTitle = (title: string | null | undefined): boolean => {
  if (!title) return false
  return /^chapter\b/i.test(title.trim())
}

const isChapterFileRecord = (file: { title?: string | null; type?: string | null }): boolean => {
  return file.type === 'chapter' || isChapterTitle(file.title)
}

const isStoryFileRecord = (file: { title?: string | null; type?: string | null }): boolean => {
  return file.type === 'story' || file.title === 'Story'
}

const serializeLegacyChapters = (
  chapterFiles: Array<{ title?: string | null; content?: string | null }>
): string => {
  if (!Array.isArray(chapterFiles) || chapterFiles.length === 0) {
    return '# Chapter 1\n\n'
  }

  return chapterFiles
    .map((chapter, index) => {
      const title = chapter.title?.trim() || `Chapter ${index + 1}`
      const content = (chapter.content ?? '').replace(/\r\n/g, '\n').replace(/^\n+/, '').replace(/\n+$/, '')
      return content.length > 0 ? `# ${title}\n\n${content}` : `# ${title}`
    })
    .join('\n\n')
}

// SQL for creating tables if they don't exist
const CREATE_TABLES_SQL = `
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
    type TEXT NOT NULL, -- e.g., 'outline', 'chapter'
    sort_order INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Chat history table
  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    metadata TEXT -- Flexible metadata column as JSON string
  );
`

// Initialize a new SQLite database for a project
export const handleInitSqliteProject = async (_event, filePath: string, metadata: any) => {
  const resolvedPath = resolvePath(filePath)
  let db
  try {
    // Ensure directory exists
    const dir = path.dirname(resolvedPath)
    await fs.mkdir(dir, { recursive: true })

    db = new Database(resolvedPath)

    db.exec(CREATE_TABLES_SQL)

    // Insert metadata (excluding potentially large base64 data during init)
    const initialMetadata = { ...metadata }
    delete initialMetadata.coverImageBase64 // Don't save base64 on initial create

    const insertMetadata = db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)')
    const insertMetadataTransaction = db.transaction((meta) => {
      for (const [key, value] of Object.entries(meta)) {
        insertMetadata.run(key, JSON.stringify(value))
      }
    })

    insertMetadataTransaction(initialMetadata)

    return { success: true }
  } catch (error) {
    console.error(`Failed to initialize SQLite project at ${resolvedPath}:`, error)
    return { success: false, error: String(error) }
  } finally {
    if (db && db.open) {
      db.close()
    }
  }
}

// Save project to SQLite database - Reverted project type to 'any'
export const handleSaveSqliteProject = async (_event, filePath: string, project: any) => {
  const resolvedPath = resolvePath(filePath)

  let db
  try {
    // Ensure directory exists before opening/creating the database
    const dir = path.dirname(resolvedPath)
    await fs.mkdir(dir, { recursive: true })

    // Open the database (creates if not exists)
    db = new Database(resolvedPath)

    // Ensure tables exist - crucial for first save/conversion
    db.exec(CREATE_TABLES_SQL)

    // --- Begin Transaction ---
    db.exec('BEGIN')

    // 1. Update metadata (including cover image data)
    // Access properties assuming 'project' has the correct structure
    const metadataToSave = {
      title: project.title,
      genre: project.genre,
      summary: project.summary,
      author: 'Sacha', // Still hardcoded
      year: project.year,
      wordCountTarget: project.wordCountTarget,
      wordCountCurrent: project.wordCountCurrent,
      expertSuggestions: project.expertSuggestions,
      coverImageBase64: project.coverImageBase64,
      coverImageMimeType: project.coverImageMimeType,
      dialogueAnalysis: project.dialogueAnalysis,
      wordCountHistorical: project.wordCountHistorical ?? [],
      storyContent: project.storyContent ?? ''
    }
    const insertMetadata = db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)')
    db.exec('DELETE FROM metadata') // Clear existing metadata
    // Explicitly purge deprecated metadata keys on save for legacy projects.
    db.prepare('DELETE FROM metadata WHERE key = ?').run('writingSample')
    for (const [key, value] of Object.entries(metadataToSave)) {
      if (value !== undefined) {
        const valueToStore = key === 'coverImageBase64' && value !== null ? value : JSON.stringify(value ?? null)
        insertMetadata.run(key, valueToStore)
      }
    }

    // 2. Clear existing files and insert new ones (Ancillary files only)
    db.exec('DELETE FROM files')
    const insertFile = db.prepare(`
      INSERT INTO files (title, content, type, sort_order)
      VALUES (?, ?, ?, ?)
    `)
    // Use 'any' for file type as ProjectFile type is not available in main process context
    if (Array.isArray(project.files)) {
      for (const file of project.files as any[]) {
        const fileType = file.type ?? 'unknown'
        // NEVER save Chapters or "Story" blocks as individual file rows anymore.
        // They are already contained in the storyContent metadata.
        if (isChapterFileRecord(file) || isStoryFileRecord(file)) {
          continue
        }
        const sortOrder = file.sort_order ?? 0
        insertFile.run(file.title, file.content, fileType, sortOrder)
      }
    }

    // 3. Clear existing chat history and insert new messages
    db.exec('DELETE FROM chat_history')
    if (Array.isArray(project.chatHistory)) {
      const insertChatMessage = db.prepare(`
        INSERT INTO chat_history (sender, text, timestamp, metadata)
        VALUES (?, ?, ?, ?)
      `)
      // Use 'any' for message type
      for (const message of project.chatHistory as any[]) {
        const timestamp = message.timestamp || null
        const metadataJson = message.metadata ? JSON.stringify(message.metadata) : null
        insertChatMessage.run(message.sender, message.text, timestamp, metadataJson)
      }
    }

    // --- Commit Transaction ---
    db.exec('COMMIT')

    return { success: true }
  } catch (error) {
    console.error(`Failed to save SQLite project at ${resolvedPath}:`, error)
    // --- Rollback Transaction on Error ---
    if (db && db.inTransaction) {
      db.exec('ROLLBACK')
    }
    return { success: false, error: String(error) }
  } finally {
    if (db && db.open) {
      db.close()
    }
  }
}

/**
 * Internal helper to load project metadata from a SQLite database.
 * This function returns the full metadata object including the project path.
 */
const getProjectMetaInternal = async (filePath: string) => {
  const resolvedPath = resolvePath(filePath)
  let db
  try {
    // Check if file exists before trying to open
    await fs.access(resolvedPath, fs.constants.R_OK) // Check read access
    db = new Database(resolvedPath, { readonly: true, fileMustExist: true }) // Ensure file exists

    // Get all metadata
    const metadataRows = db.prepare("SELECT key, value FROM metadata WHERE key != 'storyContent'").all()
    if (!metadataRows || metadataRows.length === 0) {
      console.warn(`No metadata found for project ${filePath}`)
      return null // Return null if no metadata rows found
    }

    // Reduce metadata rows into a single object
    // Parse JSON values where appropriate, keep base64 as string
    const metadata = metadataRows.reduce((acc, row) => {
      try {
        if (row.key === 'coverImageBase64') {
          acc[row.key] = row.value
        } else {
          // Attempt to parse other values as JSON
          try {
            acc[row.key] = JSON.parse(row.value)
          } catch {
            acc[row.key] = row.value
          }
        }
      } catch (e) {
        console.warn(`Error processing metadata key '${row.key}' for project ${filePath}:`, e)
        acc[row.key] = row.value
      }
      return acc
    }, {})

    // Check for essential metadata keys needed for a fragment
    if (!metadata.title) {
      console.warn(`Essential metadata 'title' missing for project ${filePath}`)
      return null // Return null if essential data is missing
    }

    // Ensure the project path is included in the metadata as expected by the frontend
    metadata.projectPath = filePath

    // Return the full metadata object
    return metadata
  } catch (error) {
    // Log the error but return null instead of throwing
    console.error(`Failed to get SQLite project metadata for ${resolvedPath}:`, error)
    return null // Return null on any error
  } finally {
    if (db && db.open) {
      db.close()
    }
  }
}

// Load project metadata from SQLite database
export const handleGetSqliteProjectMeta = async (_event, filePath: string) => {
  return getProjectMetaInternal(filePath)
}

// Load metadata for multiple SQLite projects in bulk
export const handleGetSqliteProjectsMeta = async (_event, filePaths: string[]) => {
  // Process all files in parallel
  return Promise.all(filePaths.map((filePath) => getProjectMetaInternal(filePath)))
}

// Load full project from SQLite database
export const handleLoadSqliteProject = async (_event, filePath: string) => {
  const resolvedPath = resolvePath(filePath)
  let db
  try {
    // Check if file exists before trying to open
    await fs.access(resolvedPath, fs.constants.R_OK)
    // Open read-write to allow potential deletion of skeleton rows
    db = new Database(resolvedPath, { fileMustExist: true })

    // Ensure tables exist before reading (important for older files)
    db.exec(CREATE_TABLES_SQL)

    // Delete any lingering skeleton rows from older versions
    try {
      db.exec("DELETE FROM files WHERE type = 'skeleton'")
    } catch (deleteError) {
      // Log error but continue loading if deletion fails (table might not exist yet etc.)
      console.warn(`Could not delete skeleton rows for project ${filePath}:`, deleteError)
    }

    // Get metadata (including base64 data)
    const metadataRows = db.prepare('SELECT key, value FROM metadata').all()
    const projectMetadata = metadataRows.reduce((acc, row) => {
      try {
        // Parse everything except base64 string
        if (row.key !== 'coverImageBase64') {
          acc[row.key] = JSON.parse(row.value)
        } else {
          acc[row.key] = row.value
        }
      } catch (e) {
        console.warn(`Failed to parse metadata key '${row.key}' for project ${filePath}:`, e)
        acc[row.key] = row.value
      }
      return acc
    }, {})

    // Get files, including type and sort_order
    const files = db
      .prepare(
        `
      SELECT title, content, type, sort_order
      FROM files
      ORDER BY sort_order ASC
    `
      )
      .all() // Ensure ASC order

    // Map loaded data to ProjectFile structure, including new fields
    const projectFiles = files.map((file) => ({
      title: file.title,
      content: file.content,
      type: file.type, // Map type
      sort_order: file.sort_order, // Map sort_order
      hasEdits: false // Default to no edits on load
    }))

    // Get chat history
    const chatHistoryRows = db
      .prepare(
        `
      SELECT id, sender, text, timestamp, metadata
      FROM chat_history
      ORDER BY timestamp ASC, id ASC
    `
      )
      .all() // Use id as secondary sort for stability

    const chatHistory = chatHistoryRows.map((row) => {
      let parsedMetadata = null
      if (row.metadata) {
        try {
          parsedMetadata = JSON.parse(row.metadata)
        } catch (e) {
          console.warn(`Failed to parse chat metadata for message id ${row.id} in project ${filePath}:`, e)
          // Keep metadata as original string or null if parsing fails
          parsedMetadata = row.metadata
        }
      }
      return {
        // id: row.id, // Include id if needed in ChatMessage type
        sender: row.sender,
        text: row.text,
        timestamp: row.timestamp,
        metadata: parsedMetadata
      }
    })

    // Construct the final Project object, ensuring type compatibility
    // The monolith storyContent from metadata is now the absolute source of truth.
    // However, for legacy projects, we fallback to reconstructing from chapter rows if needed.
    const legacyChapterFiles = projectFiles.filter((file) => isChapterFileRecord(file))
    const storyFile = projectFiles.find((file) => isStoryFileRecord(file))
    const nonChapterFiles = projectFiles.filter((file) => !isChapterFileRecord(file) && !isStoryFileRecord(file))
    
    const storyContent = 
       (projectMetadata.storyContent && projectMetadata.storyContent.trim().length > 0)
       ? projectMetadata.storyContent
       : (storyFile?.content && storyFile.content.trim().length > 0)
         ? storyFile.content
         : serializeLegacyChapters(legacyChapterFiles)

    const loadedProject = {
      // Spread required ProjectFragment fields first
      projectPath: filePath,
      title: projectMetadata.title ?? 'Untitled', // Provide default
      genre: projectMetadata.genre ?? 'science-fiction', // Provide default
      wordCountTarget: projectMetadata.wordCountTarget ?? 0, // Provide default
      wordCountCurrent: projectMetadata.wordCountCurrent ?? 0, // Provide default
      // Spread remaining metadata
      ...projectMetadata,

      storyContent,
      files: nonChapterFiles,
      chatHistory: chatHistory,
      knowledgeGraph: null // Assuming this is still null on load
    }
    // Remove potential 'any' type from spread if needed
    delete (loadedProject as any).key // Remove potential leftover key from reduce
    delete (loadedProject as any).value // Remove potential leftover value from reduce

    return loadedProject
  } catch (error) {
    console.error(`Failed to load SQLite project from ${resolvedPath}:`, error)
    throw new Error('Could not load project details.') // Still throw for full load failure
  } finally {
    // Close the potentially read-write connection
    if (db && db.open) {
      db.close()
    }
  }
}

export const registerSqliteOpsHandlers = () => {
  ipcMain.handle('init-sqlite-project', handleInitSqliteProject)
  ipcMain.handle('save-sqlite-project', handleSaveSqliteProject)
  ipcMain.handle('get-sqlite-project-meta', handleGetSqliteProjectMeta)
  ipcMain.handle('get-sqlite-projects-meta', handleGetSqliteProjectsMeta)
  ipcMain.handle('load-sqlite-project', handleLoadSqliteProject)
}
