import { ProjectFragment, Project, ProjectFile } from '@/types'

export const getProjectMetadata = async (directory: string): Promise<Project> => {
  try {
    const metadataContent = await window.electron.ipcRenderer.invoke(
      'read-file',
      `${directory}/metadata.json`
    )
    const metadata = JSON.parse(metadataContent)
    return {
      id: `${directory}`,
      title: metadata?.title || '',
      fullPath: `${directory}`,
      genre: metadata?.genre || 'science-fiction',
      cover: '',
      summary: metadata?.summary || '',
      year: metadata?.year || 0,
      totalWordCount: metadata?.totalWordCount || 0,
      expertSuggestions: metadata?.expertSuggestions || [],
      files: []
    } as Project
  } catch (e) {
    console.error('Error reading or parsing metadata.json:', e)
    throw new Error('Could not load project metadata.')
  }
}

export const getProjectFragmentMeta = async (directory: string): Promise<ProjectFragment> => {
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
      cover: ''
    } as ProjectFragment
  } catch (e) {
    console.error('Error reading or parsing metadata.json:', e)
    throw new Error('Could not load project fragment metadata.')
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
  console.log('Saving project...')
  if (!project?.fullPath || !project?.files) {
    console.warn('Cannot save project: project details are missing.')
    return false
  }

  try {
    // Create the project directory if it doesn't exist
    const mkdirResult = await window.electron.ipcRenderer.invoke('make-directory', project.fullPath)
    if (!mkdirResult.success) {
      console.error('Failed to create project directory:', mkdirResult.error);
      return false;
    }

    const metadata = {
      "title": project.title,
      "genre": project.genre,
      "summary": project.summary,
      "author": "Sacha",
      "year": project.year,
      "totalWordCount": project.totalWordCount,
      "expertSuggestions": project.expertSuggestions
    }

    // Write the metadata file
    const writeMetadataResult = await window.electron.ipcRenderer.invoke(
      'write-file',
      `${project.fullPath}/metadata.json`,
      JSON.stringify(metadata, null, 2)
    )
    if (!writeMetadataResult.success) {
      console.error('Failed to write metadata file:', writeMetadataResult.error);
      return false;
    }

    for (const file of project.files) {
      if (file.hasEdits) {
        const writeResult = await window.electron.ipcRenderer.invoke(
          'write-file',
          `${project.fullPath}/${file.title}`,
          file.content
        )
        if (!writeResult.success) {
          console.error('Failed to write file:', writeResult.error);
          return false;
        }
        console.log('File saved successfully' + file.title)
      }
    }
    return true
  } catch (error) {
    console.error('Failed to save project:', error)
    return false
  }
}
