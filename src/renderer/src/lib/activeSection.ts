import { ActiveSection } from '@/types'

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

export const isOverviewSection = (section: ActiveSection): section is { kind: 'overview' } =>
  section?.kind === 'overview'

export const isChapterSection = (
  section: ActiveSection
): section is { kind: 'chapter'; title: string; index: number; chapterId?: string } =>
  section?.kind === 'chapter'

export const isArtifactSection = (
  section: ActiveSection
): section is { kind: 'artifact'; title: string } => section?.kind === 'artifact'

export const activeSectionKey = (section: ActiveSection): string => {
  if (!section) return 'none'
  if (section.kind === 'overview') return 'overview'
  if (section.kind === 'artifact') return `artifact:${section.title}`
  return `chapter:${section.chapterId ?? 'none'}:${section.index}:${section.title}`
}
