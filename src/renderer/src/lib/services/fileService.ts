import { ProjectFragment, Project, ProjectFile } from '@/types'
import {
  fetchSqliteProjects,
  getSqliteProjectFragmentMeta, // This now returns Promise<ProjectFragment | null>
  loadSqliteProject,
  saveSqliteProject,
  initSqliteProject
} from './sqliteService'

export function decodeHtmlEntities(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.documentElement.textContent;
}

/**
 * Determines if a file path is for the new SQLite format (.mns)
 * @param path File path to check
 * @returns True if the file is SQLite format, false otherwise
 */
export const isSqliteFormat = (path: string): boolean => {
  // Added check for null/undefined path
  return typeof path === 'string' && path.toLowerCase().endsWith('.mns')
}

/**
 * Gets project fragment metadata from a project file (.md or .mns)
 * @param projectPath Path to the project file
 * @returns Promise resolving to project fragment metadata or null if loading/parsing fails
 */
export const getProjectFragmentMeta = async (projectPath: string): Promise<ProjectFragment | null> => {
  // Route to appropriate handler based on file extension
  if (isSqliteFormat(projectPath)) {
    // getSqliteProjectFragmentMeta now correctly returns ProjectFragment | null
    return await getSqliteProjectFragmentMeta(projectPath)
  }

  // Original Markdown format handler
  try {
    const fileContent = await window.electron.ipcRenderer.invoke('read-file', `${projectPath}`)
    // Added null check for fileContent match result
    const metadataMatch = fileContent?.match(/----Metadata\.json([\s\S]+?)----/i) // Optional chaining for fileContent
    if (!metadataMatch || !metadataMatch[1]) {
      console.warn(`Metadata section not found in Markdown file: ${projectPath}`)
      return null // Return null if metadata not found
    }
    const metadata = JSON.parse(metadataMatch[1])

    // Basic check for essential data
    if (!metadata?.title) {
        console.warn(`Essential metadata 'title' missing in Markdown file: ${projectPath}`)
        return null; // Return null if title is missing
    }

    return {
      title: metadata.title,
      wordCountCurrent: metadata.wordCountCurrent ?? 0, // Default if missing
      wordCountTarget: metadata.wordCountTarget ?? 0, // Default if missing
      projectPath: projectPath,
      genre: metadata?.genre || 'science-fiction',
      cover: ''
    } as ProjectFragment
  } catch (e) {
    console.error(`Error reading or parsing metadata for ${projectPath}:`, e)
    return null // Return null on error
  }
}

export const fetchProjects = async (rootDir: string | null): Promise<ProjectFragment[]> => {
  if (!!rootDir) {
    try {
      // Fetch both Markdown and SQLite projects
      // Both helper functions now return only valid ProjectFragment[]
      const markdownProjects = await fetchMarkdownProjects(rootDir)
      const sqliteProjects = await fetchSqliteProjects(rootDir)

      // Combine the results
      return [...markdownProjects, ...sqliteProjects]
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return []; // Return empty array on error
    }
  }
  return []
}

// Helper function to fetch only Markdown projects
const fetchMarkdownProjects = async (rootDir: string): Promise<ProjectFragment[]> => {
  try {
    const directoryItems = await window.electron.ipcRenderer.invoke('read-directory', rootDir)
     if (!Array.isArray(directoryItems)) {
          console.error('Read-directory did not return an array:', directoryItems)
          return []
      }

    const filesList = directoryItems
      .filter((item) => item && item.type === 'file' && item.name.endsWith('.md'))
      .map((item) => item.name)

    // Use Promise.allSettled to handle potential errors/nulls in getProjectFragmentMeta
    const results = await Promise.allSettled(
      filesList.map((file) => getProjectFragmentMeta(`${rootDir}/${file}`)) // This now returns ProjectFragment | null
    )

    // Filter out rejected promises AND null results from fulfilled promises, then extract values
    const projectsList = results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<ProjectFragment>).value);

    // Log errors for rejected promises or null values
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to process Markdown project fragment for ${filesList[index]}:`, result.reason);
      } else if (result.status === 'fulfilled' && result.value === null) {
         console.warn(`Skipped loading Markdown project fragment for ${filesList[index]} due to missing/invalid metadata.`);
      }
    });

    return projectsList
  } catch (error) {
    console.error("Failed to fetch Markdown projects:", error);
    return []; // Return empty array on error
  }
}

export const fetchProjectDetails = async (projectFragment: ProjectFragment): Promise<Project> => {
  // Route to appropriate handler based on file extension
  if (isSqliteFormat(projectFragment.projectPath)) {
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

    const projectFiles = [...fileContent.matchAll(/----([\s\S]+?)\n# (.+?)\n([\s\S]+?)(?=----|$)/ig)].map(m => ({ name: m[2], content: m[3].trim() }))
    console.log(projectFiles)
    const chapterList = projectFiles
      .map((item) => {
        return {
          title: item.name,
          content: item.content,
          hasEdits: false
        } as ProjectFile
      })
    console.log(chapterList)

    return {
      ...metadata,
      projectPath: projectFragment.projectPath,
      files: chapterList,
      knowledgeGraph: null
    } as Project
  } catch (error) {
    console.error(`Failed to fetch project details for ${projectFragment.projectPath}:`, error)
    // Re-throw or handle as appropriate, maybe return a default Project structure or null
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
export const saveProject = async (project: Project): Promise<{ success: boolean, finalPath: string | null }> => {
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
    // Handle conversion from .md to .mns
    console.log('Converting Markdown project to SQLite:', originalPath)
    const newPath = originalPath.replace(/\.md$/i, '.mns')
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
