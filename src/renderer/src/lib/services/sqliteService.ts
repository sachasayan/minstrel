import { ProjectFragment, Project } from '@/types'

/**
 * Initializes a new SQLite project file
 * @param projectPath Path to save the project file
 * @param project Project data to initialize
 * @returns Promise resolving to success status
 */
export const initSqliteProject = async (projectPath: string, project: Project): Promise<boolean> => {
  try {
    // Prepare metadata for the SQLite database
    const metadata = {
      title: project.title,
      genre: project.genre,
      summary: project.summary,
      author: 'Sacha',
      year: project.year,
      writingSample: project.writingSample,
      wordCountTarget: project.wordCountTarget,
      wordCountCurrent: project.wordCountCurrent,
      expertSuggestions: project.expertSuggestions
    }

    const result = await window.electron.ipcRenderer.invoke('init-sqlite-project', projectPath, metadata)

    if (!result.success) {
      console.error('Failed to initialize SQLite project:', result.error)
      return false
    }

    // After initializing, save the full project data (including files)
    // Ensure the project object passed includes the files array
    const projectToSave = { ...project, projectPath: projectPath } // Ensure path is correct
    return await saveSqliteProject(projectToSave)
  } catch (error) {
    console.error('Failed to initialize SQLite project:', error)
    return false
  }
}

/**
 * Saves a project to SQLite format
 * @param project Project data to save
 * @returns Promise resolving to success status
 */
export const saveSqliteProject = async (project: Project): Promise<boolean> => {
  console.log('Saving SQLite project...')

  if (!project?.projectPath || !project?.files) {
    console.warn('Cannot save project: project details are missing.')
    return false
  }

  try {
    // Pass the full project object, including files, to the backend
    const result = await window.electron.ipcRenderer.invoke('save-sqlite-project', project.projectPath, project)

    if (!result.success) {
      console.error('Failed to save SQLite project:', result.error)
      return false
    }

    console.log('SQLite project saved successfully:', project.title)
    return true
  } catch (error) {
    console.error('Failed to save SQLite project:', error)
    return false
  }
}

/**
 * Gets project fragment metadata from a SQLite file
 * @param projectPath Path to the project file
 * @returns Promise resolving to project fragment metadata or null if loading fails
 */
export const getSqliteProjectFragmentMeta = async (projectPath: string): Promise<ProjectFragment | null> => {
  try {
    // The backend handler 'get-sqlite-project-meta' now returns null on error
    const metadata = await window.electron.ipcRenderer.invoke('get-sqlite-project-meta', projectPath)

    // If metadata is null (because backend failed), return null
    if (metadata === null) {
      console.warn(`IPC handler returned null for project metadata: ${projectPath}`)
      return null
    }

    // Ensure the returned object looks like a ProjectFragment (basic check)
    if (typeof metadata === 'object' && metadata !== null && 'title' in metadata && 'projectPath' in metadata) {
       return metadata as ProjectFragment
    } else {
       console.warn(`Invalid metadata structure received for project: ${projectPath}`, metadata)
       return null
    }

  } catch (e) {
    // Catch errors invoking the IPC handler itself
    console.error(`Error invoking get-sqlite-project-meta for ${projectPath}:`, e)
    return null // Return null on IPC invocation error
  }
}

/**
 * Loads a full project from a SQLite file
 * @param projectFragment Project fragment with path information
 * @returns Promise resolving to full project data
 */
export const loadSqliteProject = async (projectFragment: ProjectFragment): Promise<Project> => {
  try {
    const project = await window.electron.ipcRenderer.invoke('load-sqlite-project', projectFragment.projectPath)
    // Add basic validation if needed
    if (!project || typeof project !== 'object') {
        throw new Error('Invalid project data received from backend.')
    }
    return project as Project
  } catch (e) {
    console.error(`Error loading SQLite project ${projectFragment.projectPath}:`, e)
    // Re-throw the specific error from backend if available, or a generic one
    throw new Error(`Could not load project details for ${projectFragment.title}.`)
  }
}

/**
 * Fetches all SQLite projects from a directory
 * @param rootDir Directory to search for projects
 * @returns Promise resolving to array of valid project fragments
 */
export const fetchSqliteProjects = async (rootDir: string | null): Promise<ProjectFragment[]> => {
  if (!!rootDir) {
    try {
      const directoryItems = await window.electron.ipcRenderer.invoke('read-directory', rootDir)
      // Ensure directoryItems is an array before filtering
      if (!Array.isArray(directoryItems)) {
          console.error('Read-directory did not return an array:', directoryItems)
          return []
      }

      const filesList = directoryItems
        .filter((item) => item && item.type === 'file' && item.name.endsWith('.mns'))
        .map((item) => item.name)

      // Use Promise.allSettled to handle potential nulls from getSqliteProjectFragmentMeta
      const results = await Promise.allSettled(
        filesList.map((file) => getSqliteProjectFragmentMeta(`${rootDir}/${file}`))
      )

      // Filter out failed promises and null results, then extract the valid fragments
      const projectsList = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<ProjectFragment>).value)

      // Log errors for rejected promises or null values
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to process project fragment for ${filesList[index]}:`, result.reason);
        } else if (result.status === 'fulfilled' && result.value === null) {
          console.warn(`Skipped loading project fragment for ${filesList[index]} due to null metadata.`);
        }
      });


      return projectsList
    } catch (error) {
        console.error("Failed to fetch SQLite projects:", error);
        return []; // Return empty array on error during directory read or processing
    }
  }
  return [] // Return empty array if rootDir is null or empty
}
