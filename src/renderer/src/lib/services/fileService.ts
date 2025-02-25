import { ProjectFragment, Project, ProjectFile } from '@/types'
import { stringToProjectFile } from '@/lib/nlpUtils'

export function decodeHtmlEntities(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.documentElement.textContent;
}

export const getProjectFragmentMeta = async (projectPath: string): Promise<ProjectFragment> => {
  try {
    const fileContent = await window.electron.ipcRenderer.invoke('read-file', `${projectPath}`)
    const metadata = JSON.parse(
      fileContent.match(/----Metadata\.json([\s\S]+?)----/i)?.[1]
    )


    return {
      title: metadata.title,
      projectPath: projectPath,
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
    const filesList = projectDirs.filter((item) => item.type === 'file' && item.name.endsWith('.md')).map((item) => item.name)
    const projectsList = await Promise.all(filesList.map((file) => getProjectFragmentMeta(`${rootDir}/${file}`)))

    return projectsList
  }
  return []
}

export const fetchProjectDetails = async (projectFragment: ProjectFragment): Promise<Project> => {
  const fileContent = await window.electron.ipcRenderer.invoke('read-file', projectFragment.projectPath)

  const metadata = JSON.parse(
    fileContent.match(/----Metadata\.json([\s\S]+?)----/i)?.[1]
  )
  const projectFiles = [...fileContent.matchAll(/----([\s\S]+?)\n# (.+?)\n([\s\S]+?)(?=----|$)/ig)].map(m => ({name: m[2], content: m[3].trim()}) )
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
    files: chapterList
  } as Project
}

export const saveProject = async (project: Project): Promise<boolean> => {
  console.log('Saving project...')
  console.log(project)
  if (!project?.projectPath || !project?.files) {
    console.warn('Cannot save project: project details are missing.')
    return false
  }

  try {
    // Create the project directory if it doesn't exist
    // const mkdirResult = await window.electron.ipcRenderer.invoke('make-directory', project.projectPath)
    // if (!mkdirResult.success) {
    //   console.error('Failed to create project directory:', mkdirResult.error)
    //   return false
    // }

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
    const skeleton = project.files.find((e) => e.title.indexOf('Skeleton') != -1)
    if (skeleton){
      fileContents +=  '\n----Skeleton\n# ' + skeleton.title + '\n\n' + decodeHtmlEntities(skeleton.content)
    }

    // Write outline (conditionally)
    const outline = project.files.find((e) => e.title.indexOf('Outline') != -1)
    if (outline){
      fileContents +=  '\n----Outline\n# ' + outline.title + '\n\n' + decodeHtmlEntities(outline.content)
    }


    fileContents += project.files
      .filter((e) => e.title.indexOf('Chapter') != -1)
      .map((file, i) => `\n----Chapter-${[i + 1]}\n# ${file.title}\n\n${decodeHtmlEntities(file.content)}`)
      .join('')

    const writeResult = await window.electron.ipcRenderer.invoke('write-file', `${project.projectPath}`, fileContents)
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
