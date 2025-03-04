import { Project, ProjectFragment } from '@/types'

export const projectFromFragment = (projectFragment: ProjectFragment): Project => {
  return {
    ...projectFragment,
    files: [],
    summary: '',
    year: 0,
    writingSample: '',
    expertSuggestions: [],
    knowledgeGraph: null
  } as Project
}
