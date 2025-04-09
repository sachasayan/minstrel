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

    // Create and initialize the database
    db = new Database(resolvedPath)

    // Create tables
    db.exec(CREATE_TABLES_SQL)

    // Insert metadata (excluding potentially large base64 data during init)
    const initialMetadata = { ...metadata };
    delete initialMetadata.coverImageBase64; // Don't save base64 on initial create

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
    db.exec('BEGIN');

    // 1. Update metadata (including cover image data)
    // Access properties assuming 'project' has the correct structure
    const metadataToSave = {
      title: project.title,
      genre: project.genre,
      summary: project.summary,
      author: 'Sacha', // Still hardcoded
      year: project.year,
      writingSample: project.writingSample,
      wordCountTarget: project.wordCountTarget,
      wordCountCurrent: project.wordCountCurrent,
      expertSuggestions: project.expertSuggestions,
      coverImageBase64: project.coverImageBase64,
      coverImageMimeType: project.coverImageMimeType,
      dialogueAnalysis: project.dialogueAnalysis
    }
    const insertMetadata = db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)')
    db.exec('DELETE FROM metadata'); // Clear existing metadata
    for (const [key, value] of Object.entries(metadataToSave)) {
        if (value !== undefined) {
             const valueToStore = (key === 'coverImageBase64' && value !== null) ? value : JSON.stringify(value ?? null);
             insertMetadata.run(key, valueToStore)
        }
    }

    // 2. Clear existing files and insert new ones
    db.exec('DELETE FROM files')
    const insertFile = db.prepare(`
      INSERT INTO files (title, content, type, sort_order)
      VALUES (?, ?, ?, ?)
    `)
    if (Array.isArray(project.files)) {
      let sortOrder = 0
      // Use 'any' for item types within loops as ProjectFile type is not available
      const outline = project.files.find((e: any) => e.title.includes('Outline'))
      if (outline) {
        insertFile.run(outline.title, outline.content, 'outline', sortOrder++)
      }
      const chapters = project.files.filter((e: any) => e.title.includes('Chapter'))
      chapters.forEach((chapter: any) => {
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
      // Use 'any' for message type
      for (const message of project.chatHistory as any[]) {
        const timestamp = message.timestamp || null;
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
    if (db && db.open) {
      db.close()
    }
  }
}

// Load project metadata from SQLite database
// This function now returns the full metadata object needed by the frontend service
export const handleGetSqliteProjectMeta = async (_event, filePath: string) => {
  const resolvedPath = resolvePath(filePath)
  let db
  try {
    // Check if file exists before trying to open
    await fs.access(resolvedPath, fs.constants.R_OK) // Check read access
    db = new Database(resolvedPath, { readonly: true, fileMustExist: true }) // Ensure file exists

    // Get all metadata
    const metadataRows = db.prepare('SELECT key, value FROM metadata').all()
    if (!metadataRows || metadataRows.length === 0) {
      console.warn(`No metadata found for project ${filePath}`)
      return null; // Return null if no metadata rows found
    }

    // Reduce metadata rows into a single object
    // Parse JSON values where appropriate, keep base64 as string
    const metadata = metadataRows.reduce((acc, row) => {
      try {
        if (row.key === 'coverImageBase64') {
          acc[row.key] = row.value; // Keep base64 as string
        } else {
          // Attempt to parse other values as JSON
          try {
              acc[row.key] = JSON.parse(row.value);
          } catch {
              acc[row.key] = row.value; // Keep as string if JSON parse fails
          }
        }
      } catch (e) {
        console.warn(`Error processing metadata key '${row.key}' for project ${filePath}:`, e)
        acc[row.key] = row.value // Keep raw value on error
      }
      return acc
    }, {})

    // Check for essential metadata keys needed for a fragment
    if (!metadata.title) {
       console.warn(`Essential metadata 'title' missing for project ${filePath}`)
       return null; // Return null if essential data is missing
    }

    // Return the full metadata object; frontend service will construct the fragment
    return metadata;

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
    // Open read-write to allow potential deletion of skeleton rows
    db = new Database(resolvedPath, { fileMustExist: true })

    // Ensure tables exist before reading (important for older files)
    db.exec(CREATE_TABLES_SQL)

    // Delete any lingering skeleton rows from older versions
    try {
        db.exec("DELETE FROM files WHERE type = 'skeleton'");
    } catch (deleteError) {
        // Log error but continue loading if deletion fails (table might not exist yet etc.)
        console.warn(`Could not delete skeleton rows for project ${filePath}:`, deleteError);
    }


    // Get metadata (including base64 data)
    const metadataRows = db.prepare('SELECT key, value FROM metadata').all()
    const projectMetadata = metadataRows.reduce((acc, row) => {
       try {
         // Parse everything except base64 string
         if (row.key !== 'coverImageBase64') {
            acc[row.key] = JSON.parse(row.value)
         } else {
            acc[row.key] = row.value; // Keep base64 as string
         }
      } catch (e) {
        console.warn(`Failed to parse metadata key '${row.key}' for project ${filePath}:`, e)
        acc[row.key] = row.value // Keep as string if parsing fails
      }
      return acc
    }, {})

    // Get files (Skeleton rows are already deleted or never existed)
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


    // Construct the final Project object, ensuring type compatibility
    // Return type is implicitly 'any' here, but structure should match Project
    const loadedProject = {
      // Spread required ProjectFragment fields first
      projectPath: filePath,
      title: projectMetadata.title ?? 'Untitled', // Provide default
      genre: projectMetadata.genre ?? 'science-fiction', // Provide default
      wordCountTarget: projectMetadata.wordCountTarget ?? 0, // Provide default
      wordCountCurrent: projectMetadata.wordCountCurrent ?? 0, // Provide default
      // Spread remaining metadata
      ...projectMetadata,
      // Add files and chat history
      files: projectFiles,
      chatHistory: chatHistory,
      knowledgeGraph: null // Assuming this is still null on load
    };
    // Remove potential 'any' type from spread if needed
    delete (loadedProject as any).key; // Remove potential leftover key from reduce
    delete (loadedProject as any).value; // Remove potential leftover value from reduce

    return loadedProject;

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
