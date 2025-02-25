import { ProjectFragment, Project, ProjectFile } from '@/types'
import { profile } from 'console'





export const getProjectMetadata = async (directory: string): Promise<Project> => {
  try {
    const fileContent = await window.electron.ipcRenderer.invoke('read-file', `${directory}/${directory.split('/').at(-1)}.md`)
    const metadata = JSON.parse(fileContent.split('----').find(e => e.startsWith("Metadata.json")).split('.json')[1])
    return {
      id: `${directory}`,
      title: metadata?.title || '',
      fullPath: `${directory}`,
      genre: metadata?.genre || 'science-fiction',
      writingSample: metadata?.writingSample || '',
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
    const fileContent = await window.electron.ipcRenderer.invoke('read-file', `${directory}/${directory.split('/').at(-1)}.md`)
    const metadata = JSON.parse(fileContent.split('----').find(e => e.startsWith("Metadata.json")).split('.json')[1])

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
    const foldersList = projectDirs.filter((item) => item.type === 'folder').map((item) => item.name)

    const projectsList = await Promise.all(foldersList.map((directory) => getProjectFragmentMeta(`${rootDir}/${directory}`)))

    return projectsList
  }
  return []
}

export const fetchProjectDetails = async (projectFragment: ProjectFragment): Promise<Project> => {
  const fileContent = await window.electron.ipcRenderer.invoke('read-file', `${projectFragment.fullPath}/${projectFragment.fullPath.split('/').at(-1)}.md`)
  const metadata = JSON.parse(fileContent.split('----').find(e => e.startsWith("Metadata.json")).split('.json')[1])
  const projectFiles = fileContent.split('----').filter(e => !e.startsWith("Metadata.json")).map(e => ({type: 'file', name: e.split('.md')[0]+'.md', content: e.split('.md')[1]}))
  console.log(projectFiles)
  const chapterList = await Promise.all(
    projectFiles
      .filter((item) => item.type === 'file' && item.name.endsWith('.md'))
      .map(async (item) => {
        return {
          title: item.name,
          content: item.content,
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
      console.error('Failed to create project directory:', mkdirResult.error)
      return false
    }

    const metadata = {
      title: project.title,
      genre: project.genre,
      summary: project.summary,
      author: 'Sacha',
      year: project.year,
      writingSample: project.writingSample,
      totalWordCount: project.totalWordCount,
      expertSuggestions: project.expertSuggestions
    }

    // Write the metadata file
    let fileContents = ['----Metadata.json\n', JSON.stringify(metadata, null, 2)].join('')

    // Write skeleton (conditionally)
    fileContents += project.files.find((e) => e.title == 'Skeleton.md') ? '\n----Skeleton.md\n' + project.files.find((e) => e.title == 'Skeleton.md')?.content : ''
    // Write outline (conditionally)
    fileContents += project.files.find((e) => e.title == 'Outline.md') ? '\n----Outline.md\n' + project.files.find((e) => e.title == 'Outline.md')?.content : ''

    fileContents += project.files
      .filter((e) => e.title.startsWith('Chapter'))
      .sort()
      .map((file, i) => `\n----Chapter-${[i + 1]}.md\n${file.content}`)
      .join()

    const writeResult = await window.electron.ipcRenderer.invoke('write-file', `${project.fullPath}/${project.title}.md`, fileContents)
    if (!writeResult.success) {
      console.error('Failed to write file:', writeResult.error)
      return false
    }
    console.log('File saved successfully' + project.title)

    return true
  } catch (error) {
    console.error('Failed to save project:', error)
    return false
  }
}
