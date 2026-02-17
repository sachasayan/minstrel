import { Project, ProjectFile } from '@/types'

const normalizeLineEndings = (value: string): string => value.replace(/\r\n/g, '\n')

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
  // Filter out the main story file AND any individual chapter files
  const ancillaryFiles = files.filter((file) => !isStoryFile(file) && file.type !== 'chapter')

  const storyContent =
    typeof storyFile?.content === 'string' && storyFile.content.trim().length > 0
      ? normalizeLineEndings(storyFile.content)
      : typeof project.storyContent === 'string' && project.storyContent.trim().length > 0
      ? normalizeLineEndings(project.storyContent)
      : '' // Default to empty if no story content

  return {
    ...project,
    storyContent,
    files: ancillaryFiles
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

const findChapterStartIndex = (lines: string[], title: string): number => {
  const normalizedTitle = title.trim().toLowerCase()
  
  return lines.findIndex((line) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('# ')) return false
    
    const lineTitle = trimmed.replace(/^#\s+/, '').trim().toLowerCase()
    
    // Exact match or matches the start with a separator (colon or space)
    return lineTitle === normalizedTitle || 
           lineTitle.startsWith(normalizedTitle + ':') ||
           lineTitle.startsWith(normalizedTitle + ' ')
  })
}

export const extractChapterContent = (storyContent: string, chapterTitle: string): string | null => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')
  
  const startIndex = findChapterStartIndex(lines, chapterTitle)
  if (startIndex === -1) return null

  let endIndex = -1
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (/^#\s+/.test(lines[i].trim())) {
      endIndex = i
      break
    }
  }

  const contentLines = lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex)
  return contentLines.join('\n').trim()
}

export const replaceChapterContent = (storyContent: string, chapterTitle: string, newContent: string): string => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')
  
  const startIndex = findChapterStartIndex(lines, chapterTitle)

  // Ensure content starts with a header if it doesn't already have one
  const contentToInsert = /^#\s+/.test(newContent.trim()) 
    ? newContent.trim() 
    : `# ${chapterTitle}\n\n${newContent.trim()}`

  if (startIndex === -1) {
    // If chapter doesn't exist, append it
    return `${normalized.trim()}\n\n${contentToInsert}`
  }

  let endIndex = -1
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (/^#\s+/.test(lines[i].trim())) {
      endIndex = i
      break
    }
  }

  // Replace everything from startIndex to endIndex (exclusive of endIndex)
  const before = lines.slice(0, startIndex)
  const after = endIndex === -1 ? [] : lines.slice(endIndex)
  
  // Clean up potential double newlines
  const beforeText = before.join('\n').trim()
  const afterText = after.join('\n').trim()

  return [
    beforeText,
    beforeText ? '\n\n' : '',
    contentToInsert,
    afterText ? '\n\n' : '',
    afterText
  ].join('')
}
