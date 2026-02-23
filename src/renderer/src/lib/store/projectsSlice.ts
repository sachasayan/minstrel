import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'

import { ProjectState, ProjectFragment, Project, Genre, ProjectFile } from '@/types'
import { RootState } from './store'
import { projectFromFragment } from '@/lib/typeUtils'
import {
  normalizeProjectStoryContent,
  replaceChapterContent,
  ensureAllChaptersHaveIds
} from '@/lib/storyContent'

const initialState: ProjectState = {
  projectHasLiveEdits: false,
  activeProject: null,
  pendingFiles: null,
  modifiedChapters: [],
  lastEdit: null
}

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    startNewProject: (state) => {
      // Create a default temporary project object
      const tempProject: Project = {
        projectPath: '', // Use empty string instead of null for path initially
        title: 'Untitled Project',
        genre: 'fantasy', // Use a valid Genre string literal as default
        wordCountTarget: 80000,
        wordCountCurrent: 0,
        cover: undefined,
        coverImageMimeType: null,
        coverImageBase64: null,
        storyContent: '# Chapter 1\n\n',
        files: [],
        summary: '',
        year: new Date().getFullYear(),
        expertSuggestions: [],
        knowledgeGraph: null,
        chatHistory: [] // Initialize chat history
      }
      state.activeProject = tempProject
      state.projectHasLiveEdits = true // It's unsaved
      // Clear pending files if any were leftover from a previous project state
      state.pendingFiles = null
      state.modifiedChapters = []
    },
    setActiveProjectFromFragment: (state, action: PayloadAction<ProjectFragment>) => {
      state.activeProject = projectFromFragment(action.payload)
      state.modifiedChapters = []
      state.lastEdit = null
    },
    setActiveProject: (state, action: PayloadAction<Project | null>) => {
      if (action.payload) {
        const normalized = normalizeProjectStoryContent(action.payload)
        state.activeProject = {
          ...normalized,
          storyContent: ensureAllChaptersHaveIds(normalized.storyContent)
        }
      } else {
        state.activeProject = null
      }
      state.modifiedChapters = []
      state.lastEdit = null
    },
    setProjectHasLiveEdits: (state, action: PayloadAction<boolean>) => {
      state.projectHasLiveEdits = action.payload
    },
    setAllFilesAsSaved: (state) => {
      state.projectHasLiveEdits = false
      state.activeProject?.files?.forEach((chapter) => {
        chapter.hasEdits = false
      })
      state.modifiedChapters = []
      // Also reset cover image edit status implicitly if needed, or add specific flag
    },
    setPendingFiles: (state, action: PayloadAction<string[] | null>) => {
      state.pendingFiles = action.payload
    },
    updateFile: (state, action: PayloadAction<ProjectFile>) => {
      if (state.activeProject) {
        const payload = action.payload
        const fileIndex = state.activeProject.files.findIndex((file) => file.title === payload.title)

        // Special case: "Story" title always updates the monolith
        if (payload.title === 'Story') {
          state.activeProject.storyContent = payload.content
          
          // Track modified chapter if index is provided
          if (payload.chapterIndex !== undefined && !state.modifiedChapters.includes(payload.chapterIndex)) {
            state.modifiedChapters.push(payload.chapterIndex)
          }
        } else {
          // Update ancillary files (Outline, etc.)
          if (fileIndex !== -1) {
            state.activeProject.files[fileIndex].content = payload.content
            state.activeProject.files[fileIndex].hasEdits = true
          } else {
            state.activeProject.files.push({
              title: payload.title,
              content: payload.content,
              type: payload.type ?? 'unknown',
              sort_order: payload.sort_order ?? state.activeProject.files.length + 1,
              hasEdits: true
            })
          }
        }

        state.projectHasLiveEdits = true
      }
    },
    setLastEdit: (state, action: PayloadAction<{ fileTitle: string; oldContent: string; newContent: string; chapterIndex?: number; chapterId?: string } | null>) => {
      state.lastEdit = action.payload
    },
    clearLastEdit: (state) => {
      state.lastEdit = null
    },
    updateParameters: (state, action: PayloadAction<{ title: string; genre: Genre; summary: string; year: number; wordCountTarget: number }>) => {
      if (state.activeProject) {
        state.activeProject.title = action.payload.title
        state.activeProject.genre = action.payload.genre
        state.activeProject.summary = action.payload.summary
        state.activeProject.year = action.payload.year
        state.activeProject.wordCountTarget = action.payload.wordCountTarget
        state.projectHasLiveEdits = true
      }
    },
    setProjectPath: (state, action: PayloadAction<{ title: string; projectPath: string }>) => {
      if (!state.activeProject) return
      state.activeProject.title = action.payload.title
      state.activeProject.projectPath = action.payload.projectPath
      state.projectHasLiveEdits = true
    },
    setWordCountCurrent: (state, action: PayloadAction<number>) => {
      if (!state.activeProject) return
      state.activeProject.wordCountCurrent = action.payload
    },
    setWordCountHistorical: (state, action: PayloadAction<Array<{ date: string; wordCount: number }>>) => {
      if (!state.activeProject) return
      state.activeProject.wordCountHistorical = action.payload
      state.projectHasLiveEdits = true
    },
    updateReviews: (state, action: PayloadAction<{ critique: any[]; analysis: { dialogCounts: Record<string, number[]> } }>) => {
      if (!state.activeProject) return
      state.activeProject.expertSuggestions = action.payload.critique
      state.activeProject.dialogueAnalysis = action.payload.analysis
      state.projectHasLiveEdits = true
    },
    // New reducer for updating cover image data
    updateCoverImage: (state, action: PayloadAction<{ base64: string | null; mimeType: string | null }>) => {
      if (state.activeProject) {
        state.activeProject.coverImageBase64 = action.payload.base64
        state.activeProject.coverImageMimeType = action.payload.mimeType
        // Clear the display URL when raw data changes, it will be regenerated by selector
        state.activeProject.cover = undefined
        state.projectHasLiveEdits = true // Mark project as having edits
      }
    },
    addChapter: (state) => {
      if (state.activeProject) {
        const currentContent = state.activeProject.storyContent || ''
        const newChapterNumber = (currentContent.match(/^#\s+/gm) || []).length + 1
        const newChapterTitle = `Chapter ${newChapterNumber}`
        const delimiter = currentContent.endsWith('\n\n') ? '' : currentContent.endsWith('\n') ? '\n' : '\n\n'
        const rawContent = `${currentContent}${delimiter}# ${newChapterTitle}\n\n`
        state.activeProject.storyContent = ensureAllChaptersHaveIds(rawContent)
        state.projectHasLiveEdits = true
        
        // Track the new chapter as modified
        if (!state.modifiedChapters.includes(newChapterNumber - 1)) {
          state.modifiedChapters.push(newChapterNumber - 1)
        }
      }
    },
    updateChapter: (state, action: PayloadAction<{ chapterId: string; content: string }>) => {
      const activeProject = state.activeProject
      if (activeProject) {
        const { chapterId, content } = action.payload
        const storyContent = activeProject.storyContent || ''

        // Find which chapter index we are updating (for tracking modifiedChapters legacy UI state)
        const lines = storyContent.split('\n')
        const chapterIdx = lines.findIndex((line) => line.trim().startsWith('# ') && line.includes(`id: ${chapterId}`))

        if (chapterIdx !== -1) {
          const linesBefore = lines.slice(0, chapterIdx)
          const index = linesBefore.filter((l) => l.trim().startsWith('# ')).length
          if (!state.modifiedChapters.includes(index)) {
            state.modifiedChapters.push(index)
          }
        }

        activeProject.storyContent = replaceChapterContent(storyContent, '', content, chapterId)
        // Run global ID insurance but ONLY if needed to keep performance high
        if (activeProject.storyContent.includes('# ') && !activeProject.storyContent.includes('<!-- id:')) {
           activeProject.storyContent = ensureAllChaptersHaveIds(activeProject.storyContent)
        }
        state.projectHasLiveEdits = true
      }
    }
  }
})

export const {
  startNewProject,
  setActiveProject,
  setPendingFiles,
  setActiveProjectFromFragment,
  setProjectHasLiveEdits,
  setAllFilesAsSaved,
  updateFile,
  updateParameters,
  updateReviews,
  updateCoverImage,
  addChapter,
  updateChapter,
  setLastEdit,
  clearLastEdit,
  setProjectPath,
  setWordCountCurrent,
  setWordCountHistorical
} = projectsSlice.actions
export const selectProjects = (state: RootState) => state.projects
export const selectActiveProject = (state: RootState) => state.projects.activeProject

// Add selector for cover data URL (implementation for Step 5)
// This selector computes the data URL on demand and is memoized
export const selectActiveProjectWithCoverDataUrl = createSelector(
  [selectActiveProject],
  (activeProject): Project | null => {
    if (activeProject && activeProject.coverImageBase64 && activeProject.coverImageMimeType) {
      // Return a *copy* of the project with the cover data URL populated
      return {
        ...activeProject,
        cover: `data:${activeProject.coverImageMimeType};base64,${activeProject.coverImageBase64}`
      }
    }
    // Return the original project if cover data is missing or project is null
    return activeProject
  }
)

export default projectsSlice.reducer
