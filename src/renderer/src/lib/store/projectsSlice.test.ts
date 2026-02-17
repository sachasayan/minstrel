import { describe, it, expect } from 'vitest'
import reducer, {
  startNewProject,
  setActiveProject,
  updateFile,
  updateParameters,
  addChapter,
  updateChapter,
  selectActiveProjectWithCoverDataUrl,
  setAllFilesAsSaved
} from './projectsSlice'
import { ProjectState, Project } from '@/types'

describe('projectsSlice', () => {
  const initialState: ProjectState = {
    projectHasLiveEdits: false,
    activeProject: null,
    pendingFiles: null
  }

  it('should handle startNewProject', () => {
    const actual = reducer(initialState, startNewProject())
    expect(actual.activeProject).not.toBeNull()
    expect(actual.activeProject?.title).toBe('Untitled Project')
    expect(actual.projectHasLiveEdits).toBe(true)
  })

  it('should handle updateFile with "Story" title (monolith update)', () => {
    const stateWithProject = {
      ...initialState,
      activeProject: { title: 'P1', files: [], storyContent: '' } as any
    }
    const actual = reducer(stateWithProject, updateFile({ title: 'Story', content: 'New Content' } as any))
    expect(actual.activeProject?.storyContent).toBe('New Content')
    expect(actual.projectHasLiveEdits).toBe(true)
    expect(actual.activeProject?.files).toHaveLength(0) // Should not add to files array
  })

  it('should handle updateFile for individual files', () => {
    const stateWithProject = {
      ...initialState,
      activeProject: { title: 'P1', files: [{ title: 'Chapter 1', content: 'Old' }], storyContent: '' } as any
    }
    const actual = reducer(stateWithProject, updateFile({ title: 'Chapter 1', content: 'New' } as any))
    expect(actual.activeProject?.files[0].content).toBe('New')
    expect(actual.activeProject?.files[0].hasEdits).toBe(true)
  })

  it('should add new file if it doesn\'t exist and isn\'t "Story"', () => {
    const stateWithProject = {
      ...initialState,
      activeProject: { title: 'P1', files: [], storyContent: '' } as any
    }
    const actual = reducer(stateWithProject, updateFile({ title: 'Note', content: 'Info', type: 'note' } as any))
    expect(actual.activeProject?.files).toHaveLength(1)
    expect(actual.activeProject?.files[0].title).toBe('Note')
  })

  it('should handle addChapter with automatic numbering', () => {
    const stateWithProject = {
      ...initialState,
      activeProject: { title: 'P1', files: [], storyContent: '# Chapter 1\nBody' } as any
    }
    const actual = reducer(stateWithProject, addChapter())
    expect(actual.activeProject?.storyContent).toContain('# Chapter 2')
  })

  it('should handle surgical updateChapter', () => {
    const stateWithProject = {
      ...initialState,
      activeProject: { title: 'P1', files: [], storyContent: '# Chapter 1\nOld\n# Chapter 2\nOld' } as any
    }
    const actual = reducer(stateWithProject, updateChapter({ title: 'Chapter 1', content: 'New Body' }))
    expect(actual.activeProject?.storyContent).toContain('New Body')
    expect(actual.activeProject?.storyContent).toContain('# Chapter 2\nOld')
  })

  it('should handle setAllFilesAsSaved', () => {
    const stateWithEdits = {
      ...initialState,
      projectHasLiveEdits: true,
      activeProject: { files: [{ title: 'C1', hasEdits: true }] } as any
    }
    const actual = reducer(stateWithEdits, setAllFilesAsSaved())
    expect(actual.projectHasLiveEdits).toBe(false)
    expect(actual.activeProject?.files[0].hasEdits).toBe(false)
  })

  describe('selectors', () => {
    it('selectActiveProjectWithCoverDataUrl should compute cover URL', () => {
      const state = {
        projects: {
          activeProject: {
            title: 'P1',
            coverImageBase64: 'abc',
            coverImageMimeType: 'image/png'
          }
        }
      } as any
      const project = selectActiveProjectWithCoverDataUrl(state)
      expect(project?.cover).toBe('data:image/png;base64,abc')
    })
  })
})
