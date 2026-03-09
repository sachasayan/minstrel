import { Project, ProjectFragment, RecentProject } from '@/types'

type RecentProjectSource = Pick<
  ProjectFragment,
  'projectPath' | 'title' | 'genre' | 'cover' | 'coverImageMimeType' | 'wordCountCurrent'
> & Partial<Pick<Project, 'coverImageBase64'>>

export const buildRecentProjectEntry = (
  source: RecentProjectSource,
  lastOpenedAt = new Date().toISOString()
): RecentProject => {
  const cover =
    source.coverImageBase64 && source.coverImageMimeType
      ? `data:${source.coverImageMimeType};base64,${source.coverImageBase64}`
      : source.cover

  return {
    projectPath: source.projectPath,
    title: source.title,
    genre: source.genre,
    cover,
    coverImageMimeType: source.coverImageMimeType,
    wordCountCurrent: source.wordCountCurrent,
    lastOpenedAt
  }
}
