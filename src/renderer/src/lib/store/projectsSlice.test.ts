import { describe, it, expect } from 'vitest'
import reducer, {
  startNewProject,
  updateFile,
  addChapter,
  updateChapter,
  selectActiveProjectWithCoverDataUrl,
  setAllFilesAsSaved,
  setProjectPath,
  setWordCountCurrent,
  setWordCountHistorical
} from './projectsSlice'
import { ProjectState } from '@/types'

describe('projectsSlice', () => {
  const initialState: ProjectState = {
    projectHasLiveEdits: false,
    activeProject: null,
    pendingFiles: null,
    modifiedChapters: [],
    lastEdit: null
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
    const actual = reducer(stateWithProject, updateFile({ title: 'Story', content: 'New Content', chapterIndex: 0 } as any))
    expect(actual.activeProject?.storyContent).toBe('New Content')
    expect(actual.projectHasLiveEdits).toBe(true)
    expect(actual.modifiedChapters).toContain(0)
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
    expect(actual.activeProject?.storyContent).toContain('# <!-- id:')
    expect(actual.activeProject?.storyContent).toContain('Chapter 2')
    expect(actual.modifiedChapters).toContain(1) // Chapter 2 is index 1
  })

  it('should handle surgical updateChapter', () => {
    const stateWithProject = {
      ...initialState,
      activeProject: { title: 'P1', files: [], storyContent: '# <!-- id: id1 --> Chapter 1\nOld\n# Chapter 2\nOld' } as any
    }
    const actual = reducer(stateWithProject, updateChapter({ chapterId: 'id1', content: 'New Body' }))
    const content = actual.activeProject?.storyContent ?? ''
    // Split by H1 headings to isolate each chapter's section
    const splitResult = content.split(/^#\s+/m).filter(Boolean)
    const ch1Section = splitResult.find(s => s.toLowerCase().includes('chapter 1')) ?? ''
    const ch2Section = splitResult.find(s => s.toLowerCase().includes('chapter 2')) ?? ''
    // Chapter 1 should have been updated
    expect(ch1Section).toContain('New Body')
    expect(ch1Section).not.toContain('Old')
    // Chapter 2's body should be untouched
    expect(ch2Section).toContain('Old')
  })

  it('should handle setAllFilesAsSaved', () => {
    const stateWithEdits = {
      ...initialState,
      projectHasLiveEdits: true,
      activeProject: { files: [{ title: 'C1', hasEdits: true }] } as any,
      modifiedChapters: [0, 1]
    }
    const actual = reducer(stateWithEdits, setAllFilesAsSaved())
    expect(actual.projectHasLiveEdits).toBe(false)
    expect(actual.activeProject?.files[0].hasEdits).toBe(false)
    expect(actual.modifiedChapters).toHaveLength(0)
  })

  describe('setProjectPath', () => {
    it('should update title and projectPath together', () => {
      const stateWithProject = {
        ...initialState,
        activeProject: { title: 'Old Title', projectPath: '', files: [], storyContent: '' } as any
      }
      const actual = reducer(
        stateWithProject,
        setProjectPath({ title: 'My Novel', projectPath: '/projects/my-novel.mns' })
      )
      expect(actual.activeProject?.title).toBe('My Novel')
      expect(actual.activeProject?.projectPath).toBe('/projects/my-novel.mns')
      expect(actual.projectHasLiveEdits).toBe(true)
    })

    it('should be a no-op when activeProject is null', () => {
      const actual = reducer(
        initialState,
        setProjectPath({ title: 'X', projectPath: '/x.mns' })
      )
      expect(actual.activeProject).toBeNull()
    })
  })

  describe('setWordCountCurrent', () => {
    it('should update wordCountCurrent on the active project', () => {
      const stateWithProject = {
        ...initialState,
        activeProject: { title: 'P1', wordCountCurrent: 0, files: [], storyContent: '' } as any
      }
      const actual = reducer(stateWithProject, setWordCountCurrent(42000))
      expect(actual.activeProject?.wordCountCurrent).toBe(42000)
    })

    it('should not mark projectHasLiveEdits (word count is derived, not authored)', () => {
      const stateWithProject = {
        ...initialState,
        projectHasLiveEdits: false,
        activeProject: { title: 'P1', wordCountCurrent: 0, files: [], storyContent: '' } as any
      }
      const actual = reducer(stateWithProject, setWordCountCurrent(100))
      expect(actual.projectHasLiveEdits).toBe(false)
    })

    it('should be a no-op when activeProject is null', () => {
      const actual = reducer(initialState, setWordCountCurrent(999))
      expect(actual.activeProject).toBeNull()
    })
  })

  describe('setWordCountHistorical', () => {
    const history = [
      { date: '2026-01-01', wordCount: 1000 },
      { date: '2026-01-02', wordCount: 2000 }
    ]

    it('should set the word count history on the active project', () => {
      const stateWithProject = {
        ...initialState,
        activeProject: { title: 'P1', files: [], storyContent: '' } as any
      }
      const actual = reducer(stateWithProject, setWordCountHistorical(history))
      expect(actual.activeProject?.wordCountHistorical).toEqual(history)
      expect(actual.projectHasLiveEdits).toBe(true)
    })

    it('should be a no-op when activeProject is null', () => {
      const actual = reducer(initialState, setWordCountHistorical(history))
      expect(actual.activeProject).toBeNull()
    })
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
