import { Project, ProjectFile } from '@/types'

const normalizeLineEndings = (value: string): string => value.replace(/\r\n/g, '\n')

export const STORY_FILE_TYPE = 'story'
export const STORY_FILE_TITLE = 'Story'

export const isStoryFile = (file: Pick<ProjectFile, 'title' | 'type'> | null | undefined): boolean => {
  if (!file) return false
  return file.type === STORY_FILE_TYPE || file.title === STORY_FILE_TITLE
}

export const stripChapterId = (title: string): string => {
  return title.replace(/<!--\s*id:.*-->/, '').trim()
}

export const getChaptersFromStoryContent = (storyContent: string): { title: string; index: number; id?: string }[] => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')
  const chapters: { title: string; index: number; id?: string }[] = []

  lines.forEach((line, index) => {
    if (/^#\s+/.test(line.trim())) {
      const fullHeader = line.trim().replace(/^#\s+/, '').trim()
      const title = stripChapterId(fullHeader) || `Untitled Chapter ${chapters.length + 1}`
      const id = extractChapterId(fullHeader) || undefined
      chapters.push({ title, index, id })
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

export const getChapterWordCounts = (storyContent: string): { title: string; wordCount: number; content: string; id?: string }[] => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')
  const chapters: { title: string; contentLines: string[]; id?: string }[] = []

  let currentChapter: { title: string; contentLines: string[]; id?: string } | null = null

  lines.forEach((line) => {
    if (/^#\s+/.test(line.trim())) {
      const fullHeader = line.trim().replace(/^#\s+/, '')
      const title = stripChapterId(fullHeader) || `Untitled Chapter ${chapters.length + 1}`
      const id = extractChapterId(fullHeader) || undefined
      currentChapter = { title, contentLines: [], id }
      chapters.push(currentChapter)
    } else if (currentChapter) {
      currentChapter.contentLines.push(line)
    }
  })

  return chapters.map((c) => ({
    title: c.title,
    content: c.contentLines.join('\n'),
    wordCount: calculateWordCount(c.contentLines.join('\n')),
    id: c.id
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
  
  // Pattern matches the title at the start of an H1, optionally preceded by an ID comment,
  // and optionally followed by a separator (colon, dash, dot, space) or end of line.
  const pattern = new RegExp(`^#\\s+(<!--\\s*id:\\s*[a-zA-Z0-9-]+\\s*-->\\s*)?${escapedTitle}(\\s*[:\\-.—\\s]|$)`, 'i')

  return lines.findIndex((line) => pattern.test(line.trim()))
}

export const extractChapterId = (line: string): string | null => {
  const match = line.match(/<!--\s*id:\s*([a-zA-Z0-9-]+)\s*-->/)
  return match ? match[1] : null
}

export const findChapterById = (storyContent: string, chapterId: string): { title: string; content: string } | null => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')
  
  const startIndex = lines.findIndex(line => line.trim().startsWith('# ') && (line.includes(`id: ${chapterId}`) || line.includes(`${chapterId}`)))
  if (startIndex === -1) return null

  const title = stripChapterId(lines[startIndex].trim().replace(/^#\s+/, ''))
  const content = extractChapterContent(storyContent, '', chapterId) || ''
  
  return { title, content }
}

export const extractChapterContent = (storyContent: string, chapterTitle: string, chapterId?: string): string | null => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')

  let startIndex = -1
  if (chapterId) {
    startIndex = lines.findIndex(line => line.trim().startsWith('# ') && line.includes(`id: ${chapterId}`))
    // STRICT: If ID provided but not found, return null even if title match might exist
    if (startIndex === -1) return null
  } else {
    startIndex = findChapterStartIndex(lines, chapterTitle)
  }

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

export const replaceChapterContent = (storyContent: string, chapterTitle: string, newContent: string, chapterId?: string): string => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')

  let startIndex = -1
  if (chapterId) {
    startIndex = lines.findIndex(line => line.trim().startsWith('# ') && line.includes(`id: ${chapterId}`))
    // STRICT: If ID provided but not found, fail loudly (return original content)
    if (startIndex === -1) {
      console.error(`replaceChapterContent: Chapter with ID ${chapterId} not found in storyContent.`)
      return normalized
    }
  } else {
    startIndex = findChapterStartIndex(lines, chapterTitle)
  }

  // If no title provided but we found the chapter, extract the existing title to use in header fallback
  let effectiveTitle = chapterTitle
  if (!effectiveTitle && startIndex !== -1) {
    const existingHeader = lines[startIndex].trim().replace(/^#\s+/, '')
    effectiveTitle = stripChapterId(existingHeader)
  }

  // Ensure content starts with a header if it doesn't already have one
  let contentToInsert = /^#\s+/.test(newContent.trim()) ? newContent.trim() : `# ${effectiveTitle || 'Untitled Chapter'}\n\n${newContent.trim()}`
  
  // If we have an ID but it's not in the new content's header, inject it at the BEGINNING (after # )
  if (chapterId && !contentToInsert.includes(`id: ${chapterId}`)) {
    contentToInsert = contentToInsert.replace(/^(#\s+)(.*)/, `$1<!-- id: ${chapterId} --> $2`)
  }

  if (startIndex === -1) {
    // If chapter doesn't exist AND no ID was provided, append it.
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

export const ensureAllChaptersHaveIds = (storyContent: string): string => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')
  let changed = false

  const newLines = lines.map(line => {
    if (line.trim().startsWith('# ') && !line.includes('<!-- id:')) {
      const id = Math.random().toString(36).substring(2, 11) // Simple short ID
      changed = true
      return line.trim().replace(/^(#\s*)(.*)/, `$1<!-- id: ${id} --> $2`)
    }
    return line
  })

  return changed ? newLines.join('\n') : normalized
}
