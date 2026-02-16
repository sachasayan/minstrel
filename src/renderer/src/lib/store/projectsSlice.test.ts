import { describe, it, expect } from 'vitest'
import projectsReducer, { updateFile } from './projectsSlice'
import { ProjectState, Project, Genre } from '@/types'

describe('projectsSlice reducer', () => {
  const initialState: ProjectState = {
    projectHasLiveEdits: false,
    activeProject: null,
    pendingFiles: null
  }

  const mockProject: Project = {
    projectPath: '/test/path',
    title: 'Test Project',
    genre: 'fantasy' as Genre,
    wordCountTarget: 50000,
    wordCountCurrent: 0,
    storyContent: 'Initial story content',
    files: [
      { title: 'Chapter 1', content: 'Chapter 1 content', type: 'chapter', sort_order: 1, hasEdits: false }
    ],
    summary: 'Test summary',
    year: 2024,
    expertSuggestions: [],
    knowledgeGraph: null,
    chatHistory: []
  }

  describe('updateFile', () => {
    it('should update an existing non-"Story" file', () => {
      const stateWithProject = { ...initialState, activeProject: { ...mockProject } }
      const updatedFile = { title: 'Chapter 1', content: 'Updated chapter 1 content' }

      const newState = projectsReducer(stateWithProject, updateFile(updatedFile))

      expect(newState.activeProject?.files[0].content).toBe('Updated chapter 1 content')
      expect(newState.activeProject?.files[0].hasEdits).toBe(true)
      expect(newState.projectHasLiveEdits).toBe(true)
    })

    it('should update "Story" content (monolith)', () => {
      const stateWithProject = { ...initialState, activeProject: { ...mockProject } }
      const updatedFile = { title: 'Story', content: 'Updated monolith content' }

      const newState = projectsReducer(stateWithProject, updateFile(updatedFile))

      expect(newState.activeProject?.storyContent).toBe('Updated monolith content')
      expect(newState.projectHasLiveEdits).toBe(true)
    })

    it('should update both monolith and file if "Story" exists in files array', () => {
      const projectWithStoryFile: Project = {
        ...mockProject,
        files: [
          ...mockProject.files,
          { title: 'Story', content: 'Old story file content', type: 'story', sort_order: 2, hasEdits: false }
        ]
      }
      const stateWithProject = { ...initialState, activeProject: projectWithStoryFile }
      const updatedFile = { title: 'Story', content: 'New story content' }

      const newState = projectsReducer(stateWithProject, updateFile(updatedFile))

      expect(newState.activeProject?.storyContent).toBe('New story content')
      const storyFile = newState.activeProject?.files.find(f => f.title === 'Story')
      expect(storyFile?.content).toBe('New story content')
      expect(storyFile?.hasEdits).toBe(true)
    })

    it('should add a new file if it doesn\'t exist and title is not "Story"', () => {
      const stateWithProject = { ...initialState, activeProject: { ...mockProject } }
      const newFile = { title: 'Chapter 2', content: 'Chapter 2 content', type: 'chapter' }

      const newState = projectsReducer(stateWithProject, updateFile(newFile))

      expect(newState.activeProject?.files).toHaveLength(2)
      const addedFile = newState.activeProject?.files.find(f => f.title === 'Chapter 2')
      expect(addedFile).toBeDefined()
      expect(addedFile?.content).toBe('Chapter 2 content')
      expect(addedFile?.type).toBe('chapter')
      expect(addedFile?.hasEdits).toBe(true)
    })

    it('should NOT add "Story" to files array if it doesn\'t exist there', () => {
      const stateWithProject = { ...initialState, activeProject: { ...mockProject } }
      const updatedFile = { title: 'Story', content: 'Updated story content' }

      const newState = projectsReducer(stateWithProject, updateFile(updatedFile))

      expect(newState.activeProject?.storyContent).toBe('Updated story content')
      expect(newState.activeProject?.files.find(f => f.title === 'Story')).toBeUndefined()
    })

    it('should use default values when adding a new file', () => {
      const stateWithProject = { ...initialState, activeProject: { ...mockProject } }
      const newFile = { title: 'New Note', content: 'Note content' } // No type or sort_order

      const newState = projectsReducer(stateWithProject, updateFile(newFile))

      const addedFile = newState.activeProject?.files.find(f => f.title === 'New Note')
      expect(addedFile?.type).toBe('unknown')
      expect(addedFile?.sort_order).toBe(mockProject.files.length + 1)
    })

    it('should do nothing if activeProject is null', () => {
      const updatedFile = { title: 'Chapter 1', content: 'Updated content' }

      const newState = projectsReducer(initialState, updateFile(updatedFile))

      expect(newState).toEqual(initialState)
    })
  })
})
