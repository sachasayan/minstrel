import { Project, ProjectFile } from '@/types'

const normalizeLineEndings = (value: string): string => value.replace(/\r\n/g, '\n')

const trimEdgeNewlines = (value: string): string => value.replace(/^\n+/, '').replace(/\n+$/, '')

export const STORY_FILE_TYPE = 'story'
export const STORY_FILE_TITLE = 'Story'

export const isStoryFile = (file: Pick<ProjectFile, 'title' | 'type'> | null | undefined): boolean => {
  if (!file) return false
  return file.type === STORY_FILE_TYPE || file.title === STORY_FILE_TITLE
}

export const getChaptersFromStoryContent = (storyContent: string): { title: string; index: number }[] => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')
  const chapters: { title: string; index: number }[] = []

  lines.forEach((line, index) => {
    if (/^#\s+\S+/.test(line.trim())) {
      const title = line.trim().replace(/^#\s+/, '')
      chapters.push({ title, index })
    }
  })

  return chapters
}

export const calculateWordCount = (content: string): number => {
  if (!content) return 0
  return content.trim().split(/\s+/).filter(word => word.length > 0).length
}

export const getChapterWordCounts = (storyContent: string): { title: string; wordCount: number; content: string }[] => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')
  const chapters: { title: string; contentLines: string[] }[] = []
  
  let currentChapter: { title: string; contentLines: string[] } | null = null

  lines.forEach((line) => {
    if (/^#\s+\S+/.test(line.trim())) {
      const title = line.trim().replace(/^#\s+/, '')
      currentChapter = { title, contentLines: [] }
      chapters.push(currentChapter)
    } else if (currentChapter) {
      currentChapter.contentLines.push(line)
    }
  })

  return chapters.map(c => ({
    title: c.title,
    content: c.contentLines.join('\n'),
    wordCount: calculateWordCount(c.contentLines.join('\n'))
  }))
}

export const normalizeProjectStoryContent = (project: Project): Project => {
  const files = Array.isArray(project.files) ? project.files : []
  const storyFile = files.find((file) => isStoryFile(file))
  const nonStoryFiles = files.filter((file) => !isStoryFile(file))

  const storyContent =
    typeof storyFile?.content === 'string' && storyFile.content.trim().length > 0
      ? normalizeLineEndings(storyFile.content)
      : typeof project.storyContent === 'string' && project.storyContent.trim().length > 0
      ? normalizeLineEndings(project.storyContent)
      : '' // Default to empty if no story content

  return {
    ...project,
    storyContent,
    files: nonStoryFiles
  }
}

export const buildPersistableProject = (project: Project): Project => {
  const normalizedProject = normalizeProjectStoryContent(project)
  const nonStoryFiles = normalizedProject.files.filter((file) => !isStoryFile(file))
  const storyFile: ProjectFile = {
    title: STORY_FILE_TITLE,
    content: normalizedProject.storyContent,
    type: STORY_FILE_TYPE,
    sort_order: 0,
    hasEdits: false
  }

  return {
    ...normalizedProject,
    files: [storyFile, ...nonStoryFiles]
  }
}
