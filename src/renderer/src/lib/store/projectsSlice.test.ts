import { describe, it, expect } from 'vitest'
import projectsReducer, { addChapter } from './projectsSlice'
import { ProjectState, Project } from '@/types'

describe('projectsSlice addChapter reducer', () => {
  const initialState: ProjectState = {
    projectHasLiveEdits: false,
    activeProject: null,
    pendingFiles: null
  }

  const mockProject: Project = {
    projectPath: '/test/path',
    title: 'Test Project',
    genre: 'fantasy',
    wordCountTarget: 50000,
    wordCountCurrent: 0,
    storyContent: '',
    files: [],
    summary: '',
    year: 2024,
    expertSuggestions: [],
    knowledgeGraph: null,
    chatHistory: []
  }

  it('should do nothing if activeProject is null', () => {
    const state = { ...initialState }
    const newState = projectsReducer(state, addChapter())
    expect(newState).toEqual(state)
  })

  it('should add Chapter 1 if storyContent is empty', () => {
    const state: ProjectState = {
      ...initialState,
      activeProject: { ...mockProject, storyContent: '' }
    }
    const newState = projectsReducer(state, addChapter())

    expect(newState.activeProject?.storyContent).toBe('# Chapter 1\n\n')
    expect(newState.projectHasLiveEdits).toBe(true)
  })

  it('should correctly increment chapter number', () => {
    const state: ProjectState = {
      ...initialState,
      activeProject: { ...mockProject, storyContent: '# Chapter 1\n\nSome content\n' }
    }
    const newState = projectsReducer(state, addChapter())

    expect(newState.activeProject?.storyContent).toBe('# Chapter 1\n\nSome content\n\n# Chapter 2\n\n')
  })

  it('should handle storyContent ending with a single newline', () => {
    const state: ProjectState = {
      ...initialState,
      activeProject: { ...mockProject, storyContent: '# Chapter 1\nContent\n' }
    }
    const newState = projectsReducer(state, addChapter())

    // Should add one newline to make it \n\n before the next #
    expect(newState.activeProject?.storyContent).toBe('# Chapter 1\nContent\n\n# Chapter 2\n\n')
  })

  it('should handle storyContent ending with double newlines', () => {
    const state: ProjectState = {
      ...initialState,
      activeProject: { ...mockProject, storyContent: '# Chapter 1\nContent\n\n' }
    }
    const newState = projectsReducer(state, addChapter())

    // Should add no extra newlines before the next #
    expect(newState.activeProject?.storyContent).toBe('# Chapter 1\nContent\n\n# Chapter 2\n\n')
  })

  it('should handle storyContent with no trailing newlines', () => {
    const state: ProjectState = {
      ...initialState,
      activeProject: { ...mockProject, storyContent: '# Chapter 1\nContent' }
    }
    const newState = projectsReducer(state, addChapter())

    // Should add two newlines before the next #
    expect(newState.activeProject?.storyContent).toBe('# Chapter 1\nContent\n\n# Chapter 2\n\n')
  })

  it('should count existing headers to determine next chapter number', () => {
    const state: ProjectState = {
      ...initialState,
      activeProject: {
        ...mockProject,
        storyContent: '# Chapter 1\nContent\n# Chapter 2\nContent\n# Chapter 3\nContent\n'
      }
    }
    const newState = projectsReducer(state, addChapter())

    expect(newState.activeProject?.storyContent).toContain('# Chapter 4\n\n')
  })
})
