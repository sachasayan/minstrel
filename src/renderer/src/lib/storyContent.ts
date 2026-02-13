import { Project, ProjectFile } from '@/types'

const normalizeLineEndings = (value: string): string => value.replace(/\r\n/g, '\n')

const trimEdgeNewlines = (value: string): string => value.replace(/^\n+/, '').replace(/\n+$/, '')

export const STORY_FILE_TYPE = 'story'
export const STORY_FILE_TITLE = 'Story'

export const isChapterTitle = (title: string | null | undefined): boolean => {
  if (!title) return false
  return /^chapter\b/i.test(title.trim())
}

export const isChapterFile = (file: Pick<ProjectFile, 'title' | 'type'> | null | undefined): boolean => {
  if (!file) return false
  return file.type === 'chapter' || isChapterTitle(file.title)
}

export const isStoryFile = (file: Pick<ProjectFile, 'title' | 'type'> | null | undefined): boolean => {
  if (!file) return false
  return file.type === STORY_FILE_TYPE || file.title === STORY_FILE_TITLE
}

export const parseStoryContentToChapterFiles = (storyContent: string): ProjectFile[] => {
  const normalized = normalizeLineEndings(storyContent ?? '')
  const lines = normalized.split('\n')
  const chapterHeadingIndexes: number[] = []

  lines.forEach((line, index) => {
    if (/^#\s+\S+/.test(line.trim())) {
      chapterHeadingIndexes.push(index)
    }
  })

  if (chapterHeadingIndexes.length === 0) {
    return [
      {
        title: 'Chapter 1',
        content: trimEdgeNewlines(normalized),
        type: 'chapter',
        sort_order: 1,
        hasEdits: false
      }
    ]
  }

  return chapterHeadingIndexes.map((lineIndex, index) => {
    const nextLineIndex = chapterHeadingIndexes[index + 1] ?? lines.length
    const headingLine = lines[lineIndex]?.trim() ?? ''
    const title = headingLine.replace(/^#{1,6}\s+/, '').trim() || `Chapter ${index + 1}`
    const content = trimEdgeNewlines(lines.slice(lineIndex + 1, nextLineIndex).join('\n'))

    return {
      title,
      content,
      type: 'chapter',
      sort_order: index + 1,
      hasEdits: false
    }
  })
}

export const serializeChapterFilesToStoryContent = (chapterFiles: ProjectFile[]): string => {
  if (!Array.isArray(chapterFiles) || chapterFiles.length === 0) {
    return '# Chapter 1\n\n'
  }

  const sections = chapterFiles.map((chapter, index) => {
    const title = chapter.title?.trim() || `Chapter ${index + 1}`
    const content = trimEdgeNewlines(normalizeLineEndings(chapter.content ?? ''))
    return content.length > 0 ? `# ${title}\n\n${content}` : `# ${title}`
  })

  return sections.join('\n\n')
}

const buildVirtualChaptersFromStoryContent = (
  storyContent: string,
  existingChapterFiles: ProjectFile[] = [],
  markEditedTitles: Set<string> = new Set()
): ProjectFile[] => {
  const existingByTitle = new Map(existingChapterFiles.map((file) => [file.title, file]))
  return parseStoryContentToChapterFiles(storyContent).map((chapter, index) => {
    const existing = existingByTitle.get(chapter.title)
    return {
      ...chapter,
      type: 'chapter',
      sort_order: index + 1,
      hasEdits: markEditedTitles.has(chapter.title) || existing?.hasEdits || false
    }
  })
}

export const normalizeProjectStoryContent = (project: Project): Project => {
  const files = Array.isArray(project.files) ? project.files : []
  const chapterFiles = files.filter((file) => isChapterFile(file))
  const storyFile = files.find((file) => isStoryFile(file))
  const nonChapterFiles = files.filter((file) => !isChapterFile(file) && !isStoryFile(file))

  const storyContent =
    typeof storyFile?.content === 'string' && storyFile.content.trim().length > 0
      ? normalizeLineEndings(storyFile.content)
      : typeof project.storyContent === 'string' && project.storyContent.trim().length > 0
      ? normalizeLineEndings(project.storyContent)
      : serializeChapterFilesToStoryContent(chapterFiles)

  const virtualChapterFiles = buildVirtualChaptersFromStoryContent(storyContent, chapterFiles)

  return {
    ...project,
    storyContent,
    files: [...nonChapterFiles, ...virtualChapterFiles]
  }
}

export const rebuildProjectFilesFromStoryContent = (
  project: Project,
  markEditedTitles: Set<string> = new Set()
): ProjectFile[] => {
  const files = Array.isArray(project.files) ? project.files : []
  const chapterFiles = files.filter((file) => isChapterFile(file))
  const nonChapterFiles = files.filter((file) => !isChapterFile(file) && !isStoryFile(file))
  const storyContent = normalizeLineEndings(project.storyContent ?? '')

  return [...nonChapterFiles, ...buildVirtualChaptersFromStoryContent(storyContent, chapterFiles, markEditedTitles)]
}

export const buildPersistableProject = (project: Project): Project => {
  const normalizedProject = normalizeProjectStoryContent(project)
  const nonChapterFiles = normalizedProject.files.filter((file) => !isChapterFile(file) && !isStoryFile(file))
  const storyFile: ProjectFile = {
    title: STORY_FILE_TITLE,
    content: normalizedProject.storyContent,
    type: STORY_FILE_TYPE,
    sort_order: 0,
    hasEdits: false
  }

  return {
    ...normalizedProject,
    files: [storyFile, ...nonChapterFiles]
  }
}
