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

    // After initializing, save the full project
    return await saveSqliteProject(project)
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
 * @returns Promise resolving to project fragment metadata
 */
export const getSqliteProjectFragmentMeta = async (projectPath: string): Promise<ProjectFragment> => {
  try {
    const metadata = await window.electron.ipcRenderer.invoke('get-sqlite-project-meta', projectPath)
    return metadata as ProjectFragment
  } catch (e) {
    console.error('Error reading SQLite project metadata:', e)
    throw new Error('Could not load project fragment metadata.')
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
    return project as Project
  } catch (e) {
    console.error('Error loading SQLite project:', e)
    throw new Error('Could not load project details.')
  }
}

/**
 * Fetches all SQLite projects from a directory
 * @param rootDir Directory to search for projects
 * @returns Promise resolving to array of project fragments
 */
export const fetchSqliteProjects = async (rootDir: string | null): Promise<ProjectFragment[]> => {
  if (!!rootDir) {
    const projectDirs = await window.electron.ipcRenderer.invoke('read-directory', rootDir)
    const filesList = projectDirs
      .filter((item) => item.type === 'file' && item.name.endsWith('.mns'))
      .map((item) => item.name)

    const projectsList = await Promise.all(
      filesList.map((file) => getSqliteProjectFragmentMeta(`${rootDir}/${file}`))
    )

    return projectsList
  }
  return []
}
