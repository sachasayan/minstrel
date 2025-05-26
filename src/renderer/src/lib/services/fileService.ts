import { ProjectFragment, Project, ProjectFile } from '@/types'
import { loadSqliteProject, saveSqliteProject, initSqliteProject } from './sqliteService'

export function decodeHtmlEntities(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.documentElement.textContent
}

/**
 * Determines if a file path is for the new SQLite format (.mns)
 * @param path File path to check
 * @returns True if the file is SQLite format, false otherwise
 */
export const isSqliteFormat = (path: string): boolean => {
  return typeof path === 'string' && path.toLowerCase().endsWith('.mns')
}

/**
 * Gets project fragment metadata from a project file (.md or .mns)
 * Constructs the cover data URL if image data is present.
 * @param projectPath Path to the project file
 * @returns Promise resolving to project fragment metadata or null if loading/parsing fails
 */
export const getProjectFragmentMeta = async (projectPath: string): Promise<ProjectFragment | null> => {
  // Route to appropriate handler based on file extension
  if (isSqliteFormat(projectPath)) {
    // Fetch the full metadata object from the backend (includes base64 potentially)
    // This IPC call now returns the full metadata object or null
    const fullMetadata = await window.electron.ipcRenderer.invoke('get-sqlite-project-meta', projectPath)

    if (!fullMetadata || !fullMetadata.title) {
      console.warn(`Failed to load or essential metadata missing for SQLite project: ${projectPath}`)
      return null
    }

    // Construct the cover data URL if possible
    let coverDataUrl = ''
    // Use the retrieved metadata directly
    if (fullMetadata.coverImageBase64 && fullMetadata.coverImageMimeType) {
      coverDataUrl = `data:${fullMetadata.coverImageMimeType};base64,${fullMetadata.coverImageBase64}`
    }

    // Construct the ProjectFragment
    return {
      title: fullMetadata.title,
      wordCountCurrent: fullMetadata.wordCountCurrent ?? 0,
      wordCountTarget: fullMetadata.wordCountTarget ?? 0,
      projectPath: projectPath,
      genre: fullMetadata.genre || 'science-fiction',
      cover: coverDataUrl, // Assign the generated data URL or empty string
      coverImageMimeType: fullMetadata.coverImageMimeType ?? null
    }
  } else {
    // Original Markdown format handler (doesn't support embedded covers)
    try {
      const fileContent = await window.electron.ipcRenderer.invoke('read-file', `${projectPath}`)
      const metadataMatch = fileContent?.match(/----Metadata\.json([\s\S]+?)----/i)
      if (!metadataMatch || !metadataMatch[1]) {
        console.warn(`Metadata section not found in Markdown file: ${projectPath}`)
        return null
      }
      const metadata = JSON.parse(metadataMatch[1])

      if (!metadata?.title) {
        console.warn(`Essential metadata 'title' missing in Markdown file: ${projectPath}`)
        return null
      }

      return {
        title: metadata.title,
        wordCountCurrent: metadata.wordCountCurrent ?? 0,
        wordCountTarget: metadata.wordCountTarget ?? 0,
        projectPath: projectPath,
        genre: metadata?.genre || 'science-fiction',
        cover: '', // No cover support for MD files here
        coverImageMimeType: null
      } as ProjectFragment // Cast needed as we add coverImageMimeType explicitly
    } catch (e) {
      console.error(`Error reading or parsing metadata for MD file ${projectPath}:`, e)
      return null
    }
  }
}

export const fetchProjects = async (rootDir: string | null): Promise<ProjectFragment[]> => {
  if (!!rootDir) {
    try {
      // Fetch directory items once
      const directoryItems = await window.electron.ipcRenderer.invoke('read-directory', rootDir)
      if (!Array.isArray(directoryItems)) {
        console.error('Read-directory did not return an array:', directoryItems)
        return []
      }

      // Get list of all potential project files
      const filesList = directoryItems.filter((item) => item && item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.mns'))).map((item) => item.name)

      // Process all files concurrently
      const results = await Promise.allSettled(filesList.map((file) => getProjectFragmentMeta(`${rootDir}/${file}`)))

      // Filter out failed promises and null results
      const projectsList = results.filter((result) => result.status === 'fulfilled' && result.value !== null).map((result) => (result as PromiseFulfilledResult<ProjectFragment>).value)

      // Log errors for rejected promises or null values
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to process project fragment for ${filesList[index]}:`, result.reason)
        } else if (result.status === 'fulfilled' && result.value === null) {
          console.warn(`Skipped loading project fragment for ${filesList[index]} due to missing/invalid metadata or load error.`)
        }
      })

      return projectsList
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      return [] // Return empty array on error
    }
  }
  return []
}

export const fetchProjectDetails = async (projectFragment: ProjectFragment): Promise<Project> => {
  // Route to appropriate handler based on file extension
  if (isSqliteFormat(projectFragment.projectPath)) {
    // loadSqliteProject returns the full Project object from backend
    return await loadSqliteProject(projectFragment)
  }

  // Original Markdown format handler
  try {
    const fileContent = await window.electron.ipcRenderer.invoke('read-file', projectFragment.projectPath)
    if (!fileContent) {
      throw new Error('Failed to read Markdown file content.')
    }

    const metadataMatch = fileContent.match(/----Metadata\.json([\s\S]+?)----/i)
    if (!metadataMatch || !metadataMatch[1]) {
      throw new Error('Metadata section not found in Markdown file.')
    }
    const metadata = JSON.parse(metadataMatch[1])

    const projectFiles = [...fileContent.matchAll(/----([\s\S]+?)\n# (.+?)\n([\s\S]+?)(?=----|$)/gi)].map((m) => ({ name: m[2], content: m[3].trim() }))
    // console.log(projectFiles)
    const chapterList = projectFiles.map((item) => {
      return {
        title: item.name,
        content: item.content,
        hasEdits: false
      } as ProjectFile
    })
    // console.log(chapterList)

    // Construct the Project object for MD files (no cover/chat support here)
    return {
      ...metadata,
      projectPath: projectFragment.projectPath,
      files: chapterList,
      knowledgeGraph: null,
      chatHistory: [], // Default to empty chat history for MD
      coverImageBase64: null,
      coverImageMimeType: null,
      // Ensure all ProjectFragment fields are present
      title: metadata.title,
      genre: metadata.genre || 'science-fiction',
      wordCountTarget: metadata.wordCountTarget ?? 0,
      wordCountCurrent: metadata.wordCountCurrent ?? 0,
      cover: '' // No cover for MD
    } as Project
  } catch (error) {
    console.error(`Failed to fetch project details for ${projectFragment.projectPath}:`, error)
    throw new Error(`Could not load project details for ${projectFragment.title}.`)
  }
}

/**
 * Saves the project. If the project is in Markdown format (.md),
 * it converts it to SQLite format (.mns) and deletes the original .md file.
 * Always saves to the .mns format.
 * @param project The project data to save.
 * @returns Promise resolving to an object { success: boolean, finalPath: string | null }
 */
export const saveProject = async (project: Project): Promise<{ success: boolean; finalPath: string | null }> => {
  if (!project?.projectPath || !project?.files) {
    console.warn('Cannot save project: project details are missing.')
    return { success: false, finalPath: null }
  }

  const originalPath = project.projectPath

  // Check if it's already SQLite format
  if (isSqliteFormat(originalPath)) {
    console.log('Saving existing SQLite project:', originalPath)
    try {
      const success = await saveSqliteProject(project)
      return { success: success, finalPath: success ? originalPath : null }
    } catch (error) {
      console.error(`Error saving existing SQLite project ${originalPath}:`, error)
      return { success: false, finalPath: null }
    }
  } else {
    console.log('Converting Markdown project to SQLite:', originalPath)
    const newPath = originalPath.replace(/\.md$/i, '.mns')
    // Ensure the project object being saved has the *new* path
    const projectToSave = {
      ...project,
      projectPath: newPath // Update path for saving
    }

    try {
      // Attempt to save to the new .mns path
      const saveSuccess = await saveSqliteProject(projectToSave)

      if (saveSuccess) {
        console.log('Successfully saved to new SQLite path:', newPath)
        // Attempt to delete the old .md file
        try {
          console.log('Attempting to delete original Markdown file:', originalPath)
          const deleteResult = await window.electron.ipcRenderer.invoke('delete-file', originalPath)
          if (deleteResult.success) {
            console.log('Successfully deleted original Markdown file:', originalPath)
          } else {
            // Log deletion error but don't fail the overall operation
            console.warn(`Failed to delete original Markdown file '${originalPath}':`, deleteResult.error)
          }
        } catch (deleteError) {
          // Log deletion error but don't fail the overall operation
          console.warn(`Error invoking delete-file for '${originalPath}':`, deleteError)
        }
        // Return success with the new path
        return { success: true, finalPath: newPath }
      } else {
        // saveSqliteProject failed
        console.error('Failed to save project to new SQLite path:', newPath)
        return { success: false, finalPath: null }
      }
    } catch (error) {
      // Catch errors during the save/delete process
      console.error('Error during project conversion/saving:', error)
      return { success: false, finalPath: null }
    }
  }
}

/**
 * Creates a new project with the SQLite format
 * @param projectPath Path to save the project file (should end with .mns)
 * @param project Project data to save
 * @returns Promise resolving to success status
 */
export const createSqliteProject = async (projectPath: string, project: Project): Promise<boolean> => {
  // Ensure the path has the correct extension
  const finalPath = projectPath.endsWith('.mns') ? projectPath : `${projectPath}.mns`

  // Update the project path
  const projectWithPath = {
    ...project,
    projectPath: finalPath
  }

  // Use initSqliteProject which now correctly handles initialization and first save
  return await initSqliteProject(finalPath, projectWithPath)
}
