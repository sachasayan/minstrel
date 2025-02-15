import { Project, ProjectFragment } from '@/types'

export const projectFromFragment = (projectFragment: ProjectFragment): Project => {
  return {
    ...projectFragment,
    files: [],
    summary: '',
    year: 0,
    totalWordCount: 0,
    criticSuggestions: []
  } as Project
}
