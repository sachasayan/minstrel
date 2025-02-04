import { ProjectFragment, Project, ProjectFile } from '@/types'


export const getProjectMetadata = async (
  directory: string
): Promise<Project> => {
  try {
    const metadataContent = await window.electron.ipcRenderer.invoke(
      'read-file',
      `${directory}/metadata.json`
    )
    const metadata = JSON.parse(metadataContent)
    const outlineContent = await window.electron.ipcRenderer.invoke(
      'read-file',
      `${directory}/outline.md`
    )

    return {
      id: `${directory}`,
      title: metadata?.title || '',
      fullPath: `${directory}`,
      genre: metadata?.genre || 'science-fiction',
      cover: '',
      summary: metadata?.summary || '',
      year: metadata?.year || 0,
      totalWordCount: metadata?.totalWordCount || 0,
      criticSuggestions: metadata?.criticSuggestions || [],
      outline: outlineContent || [],
      files: []
    } as Project
  } catch (e) {
    console.error("Error reading or parsing metadata.json:", e);
    throw new Error("Could not load project metadata.");
  }
}


export const getProjectFragmentMeta = async (directory: string
): Promise<ProjectFragment> => {
  try {
    const metadataContent = await window.electron.ipcRenderer.invoke(
      'read-file',
      `${directory}/metadata.json`
    )
    const metadata = JSON.parse(metadataContent)

    return {
      id: `${directory}`,
      title: `${metadata.title}`,
      fullPath: `${directory}`,
      genre: metadata?.genre || 'science-fiction',
      cover: '',
    } as ProjectFragment
  } catch (e) {
    console.error("Error reading or parsing metadata.json:", e);
    throw new Error("Could not load project fragment metadata.");
  }
}

export const fetchProjects = async (rootDir: string | null): Promise<ProjectFragment[]> => {
  if (!!rootDir) {
    const projectDirs = await window.electron.ipcRenderer.invoke('read-directory', rootDir)
    const foldersList = projectDirs
      .filter((item) => item.type === 'folder')
      .map((item) => item.name)

    const projectsList = await Promise.all(
      foldersList.map((directory) => getProjectFragmentMeta(`${rootDir}/${directory}`))
    )

    return projectsList
  }
  return []
}

export const fetchProjectDetails = async (projectFragment: ProjectFragment): Promise<Project> => {
  const projectFiles = await window.electron.ipcRenderer.invoke(
    'read-directory',
    projectFragment.fullPath
  )
  const metadata = await getProjectMetadata(projectFragment.fullPath)
  const chapterList = await Promise.all(
    projectFiles
      .filter((item) => item.type === 'file' && item.name.endsWith('.md'))
      .map(async (item) => {
        const content = await window.electron.ipcRenderer.invoke(
          'read-file',
          `${projectFragment.fullPath}/${item.name}`
        )

        return {
          title: item.name,
          content: content,
          hasEdits: false
        } as ProjectFile
      })
  )
  return {
    ...metadata,
    files: chapterList
  } as Project

}


export const saveProject = async (project: Project): Promise<boolean> => {

  console.log("Saving project...");
  if (!project?.fullPath || !project?.files) {
    console.warn('Cannot save project: project details are missing.')
    return false
  }

  try {
    for (const file of project.files) {
      if (file.hasEdits) {
        await window.electron.ipcRenderer.invoke(
          'write-file',
          `${project.fullPath}/${file.title}`,
          file.content
        )
        console.log("File saved successfully"+file.title);
      }
    }
    return true
  } catch (error) {
    console.error('Failed to save project:', error)
    return false
  }
}
