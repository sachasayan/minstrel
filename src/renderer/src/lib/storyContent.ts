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
    // Relaxed regex: just look for H1 headers. 
    // We don't strictly require non-whitespace immediately following the space.
    if (/^#\s+/.test(line.trim())) {
      const title = line.trim().replace(/^#\s+/, '').trim()
      if (title) {
        chapters.push({ title, index })
      }
    }
  })

  return chapters
}

export const calculateWordCount = (content: string): number => {
  if (!content) return 0

  // Optimized word count using regex exec to avoid creating large arrays of strings
  const regex = /\S+/g
  let count = 0
  while (regex.exec(content) !== null) {
    count++
  }
  return count
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

  return chapters.map((c) => ({
    title: c.title,
    content: c.contentLines.join('\n'),
    wordCount: calculateWordCount(c.contentLines.join('\n'))
  }))
}

export const normalizeProjectStoryContent = (project: Project): Project => {
  const files = Array.isArray(project.files) ? project.files : []
  // Filter out any individual chapter files OR the legacy "Story" file from the files list.
  // They should not be managed as separate files anymore.
  const ancillaryFiles = files.filter((file) => !isStoryFile(file) && file.type !== 'chapter')

  return {
    ...project,
    storyContent: normalizeLineEndings(project.storyContent || ''),
    files: ancillaryFiles
  }
}

export const buildPersistableProject = (project: Project): Project => {
  // We no longer need to reconstruct a "Story" file in the files array.
  // The persistence layer (sqliteOps) handles the project object directly.
  return normalizeProjectStoryContent(project)
}

const findChapterStartIndex = (lines: string[], title: string): number => {
  const normalizedTitle = title.trim().toLowerCase()
  // Escape potential regex special characters in the title
  const escapedTitle = normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // Pattern matches the title at the start of an H1,
  // optionally followed by a separator (colon, dash, dot, space) or end of line.
  const pattern = new RegExp(`^#\\s+${escapedTitle}(\\s*[:\\-.—\\s]|$)`, 'i')

  return lines.findIndex((line) => pattern.test(line.trim()))
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
  const contentToInsert = /^#\s+/.test(newContent.trim()) ? newContent.trim() : `# ${chapterTitle}\n\n${newContent.trim()}`

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

  return [beforeText, beforeText ? '\n\n' : '', contentToInsert, afterText ? '\n\n' : '', afterText].join('')
}
