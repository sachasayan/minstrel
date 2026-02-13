import { Project, ProjectFragment } from '@/types'

export const projectFromFragment = (projectFragment: ProjectFragment): Project => {
  return {
    ...projectFragment,
    storyContent: '# Chapter 1\n\n',
    files: [],
    summary: '',
    year: 0,
    expertSuggestions: [],
    knowledgeGraph: null
  } as Project
}
