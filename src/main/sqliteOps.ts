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
    type TEXT NOT NULL,
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

    // Create and initialize the database
    db = new Database(resolvedPath)

    // Create tables
    db.exec(CREATE_TABLES_SQL)

    // Insert metadata
    const insertMetadata = db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)')
    const insertMetadataTransaction = db.transaction((metadata) => {
      for (const [key, value] of Object.entries(metadata)) {
        insertMetadata.run(key, JSON.stringify(value))
      }
    })

    insertMetadataTransaction(metadata)

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

// Save project to SQLite database
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
    db.exec('BEGIN');

    // 1. Update metadata
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
    for (const [key, value] of Object.entries(metadata)) {
      insertMetadata.run(key, JSON.stringify(value ?? null))
    }

    // 2. Clear existing files and insert new ones
    db.exec('DELETE FROM files')
    const insertFile = db.prepare(`
      INSERT INTO files (title, content, type, sort_order)
      VALUES (?, ?, ?, ?)
    `)
    if (Array.isArray(project.files)) {
      let sortOrder = 0
      const skeleton = project.files.find((e) => e.title.indexOf('Skeleton') !== -1)
      if (skeleton) {
        insertFile.run(skeleton.title, skeleton.content, 'skeleton', sortOrder++)
      }
      const outline = project.files.find((e) => e.title.indexOf('Outline') !== -1)
      if (outline) {
        insertFile.run(outline.title, outline.content, 'outline', sortOrder++)
      }
      const chapters = project.files.filter((e) => e.title.indexOf('Chapter') !== -1)
      chapters.forEach((chapter) => {
        insertFile.run(chapter.title, chapter.content, 'chapter', sortOrder++)
      })
    }

    // 3. Clear existing chat history and insert new messages
    db.exec('DELETE FROM chat_history')
    if (Array.isArray(project.chatHistory)) {
      const insertChatMessage = db.prepare(`
        INSERT INTO chat_history (sender, text, timestamp, metadata)
        VALUES (?, ?, ?, ?)
      `)
      for (const message of project.chatHistory) {
        // Use message timestamp if available, otherwise let DB default (NULL -> CURRENT_TIMESTAMP)
        const timestamp = message.timestamp || null;
        // Stringify metadata if it exists, otherwise null
        const metadataJson = message.metadata ? JSON.stringify(message.metadata) : null;
        insertChatMessage.run(message.sender, message.text, timestamp, metadataJson)
      }
    }

    // --- Commit Transaction ---
    db.exec('COMMIT');

    return { success: true }
  } catch (error) {
    console.error(`Failed to save SQLite project at ${resolvedPath}:`, error)
    // --- Rollback Transaction on Error ---
    if (db && db.inTransaction) {
      db.exec('ROLLBACK');
    }
    return { success: false, error: String(error) }
  } finally {
    // Ensure database connection is closed even if errors occur
    if (db && db.open) { // Check if db is initialized and open
      db.close()
    }
  }
}

// Load project metadata from SQLite database
export const handleGetSqliteProjectMeta = async (_event, filePath: string) => {
  const resolvedPath = resolvePath(filePath)
  let db
  try {
    // Check if file exists before trying to open
    await fs.access(resolvedPath, fs.constants.R_OK) // Check read access
    db = new Database(resolvedPath, { readonly: true, fileMustExist: true }) // Ensure file exists

    // Get metadata
    const metadataRows = db.prepare('SELECT key, value FROM metadata').all()
    if (!metadataRows || metadataRows.length === 0) {
      // Handle case where metadata table is empty or query fails unexpectedly
      console.warn(`No metadata found for project ${filePath}`)
      // Depending on requirements, might return null or a default structure
      // For now, let it proceed, but check for essential keys later
    }

    const metadata = metadataRows.reduce((acc, row) => {
      try {
        acc[row.key] = JSON.parse(row.value)
      } catch (e) {
        console.warn(`Failed to parse metadata key '${row.key}' for project ${filePath}:`, e)
        acc[row.key] = row.value // Keep as string if parsing fails
      }
      return acc
    }, {})

    // Check for essential metadata keys needed for a fragment
    if (!metadata.title) {
       console.warn(`Essential metadata 'title' missing for project ${filePath}`)
       // Cannot form a valid fragment without a title
       return null; // Return null if essential data is missing
    }


    return {
      title: metadata.title,
      // Provide defaults if optional fields are missing
      wordCountCurrent: metadata.wordCountCurrent ?? 0,
      wordCountTarget: metadata.wordCountTarget ?? 0,
      projectPath: filePath,
      genre: metadata.genre || 'science-fiction',
      cover: ''
    }
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

// Load full project from SQLite database
export const handleLoadSqliteProject = async (_event, filePath: string) => {
  const resolvedPath = resolvePath(filePath)
  let db
  try {
    // Check if file exists before trying to open
    await fs.access(resolvedPath, fs.constants.R_OK)
    // Open read-write initially to ensure tables can be created if missing
    db = new Database(resolvedPath, { fileMustExist: true })

    // Ensure tables exist before reading (important for older files)
    db.exec(CREATE_TABLES_SQL)

    // Get metadata
    const metadataRows = db.prepare('SELECT key, value FROM metadata').all()
    const projectMetadata = metadataRows.reduce((acc, row) => {
       try {
        acc[row.key] = JSON.parse(row.value)
      } catch (e) {
        console.warn(`Failed to parse metadata key '${row.key}' for project ${filePath}:`, e)
        acc[row.key] = row.value // Keep as string if parsing fails
      }
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
      hasEdits: false // Default to no edits on load
    }))

    // Get chat history
    const chatHistoryRows = db.prepare(`
      SELECT id, sender, text, timestamp, metadata
      FROM chat_history
      ORDER BY timestamp ASC, id ASC
    `).all() // Use id as secondary sort for stability

    const chatHistory = chatHistoryRows.map(row => {
      let parsedMetadata = null;
      if (row.metadata) {
        try {
          parsedMetadata = JSON.parse(row.metadata);
        } catch (e) {
          console.warn(`Failed to parse chat metadata for message id ${row.id} in project ${filePath}:`, e);
          // Keep metadata as original string or null if parsing fails
          parsedMetadata = row.metadata;
        }
      }
      return {
        // id: row.id, // Include id if needed in ChatMessage type
        sender: row.sender,
        text: row.text,
        timestamp: row.timestamp,
        metadata: parsedMetadata
      };
    });


    return {
      ...projectMetadata,
      projectPath: filePath,
      files: projectFiles,
      chatHistory: chatHistory, // Include loaded chat history
      knowledgeGraph: null // Assuming this is still null on load
    }
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
  ipcMain.handle('load-sqlite-project', handleLoadSqliteProject)
}
