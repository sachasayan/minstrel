import { ActiveSection, Project } from '@/types'
import { getChaptersFromStoryContent } from '@/lib/storyContent'

export const makeOverviewSection = (): ActiveSection => ({ kind: 'overview' })

export const makeArtifactSection = (title: string): ActiveSection => ({
  kind: 'artifact',
  title
})

export const makeChapterSection = (title: string, index: number, chapterId?: string): ActiveSection => ({
  kind: 'chapter',
  title,
  index,
  chapterId
})

export const isOverviewSection = (section: ActiveSection): section is { kind: 'overview' } => section?.kind === 'overview'

export const isChapterSection = (section: ActiveSection): section is { kind: 'chapter'; title: string; index: number; chapterId?: string } => section?.kind === 'chapter'

export const isArtifactSection = (section: ActiveSection): section is { kind: 'artifact'; title: string } => section?.kind === 'artifact'

export const activeSectionKey = (section: ActiveSection): string => {
  if (!section) return 'none'
  if (section.kind === 'overview') return 'overview'
  if (section.kind === 'artifact') return `artifact:${section.title}`
  return `chapter:${section.chapterId ?? 'none'}:${section.index}:${section.title}`
}

export const findDefaultProjectSection = (project: Project | undefined | null): ActiveSection => {
  if (!project?.storyContent) return makeArtifactSection('Outline')

  const chapters = getChaptersFromStoryContent(project.storyContent)
  if (chapters.length === 0) return makeArtifactSection('Outline')

  return makeChapterSection(chapters[0].title, 0, chapters[0].id)
}

export const resolveProjectSection = (project: Project | undefined | null, savedSection: ActiveSection | undefined | null): ActiveSection => {
  const fallback = findDefaultProjectSection(project)

  if (!savedSection) return fallback

  if (savedSection.kind === 'overview') {
    return makeOverviewSection()
  }

  if (savedSection.kind === 'artifact') {
    if (savedSection.title === 'Outline') {
      return makeArtifactSection('Outline')
    }
    return fallback
  }

  const chapters = getChaptersFromStoryContent(project?.storyContent ?? '')
  if (chapters.length === 0) return fallback

  const matchedChapter = (savedSection.chapterId ? chapters.find((chapter) => chapter.id === savedSection.chapterId) : undefined) ?? chapters[savedSection.index]

  if (!matchedChapter) return fallback

  return makeChapterSection(matchedChapter.title, matchedChapter.index, matchedChapter.id)
}
