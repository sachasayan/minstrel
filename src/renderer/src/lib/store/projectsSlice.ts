import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'
// Patch Project interface to add dialogueAnalysis property
declare module '@/types' {
  interface Project {
    dialogueAnalysis?: {
      dialogCounts: Record<string, number[]>
    } | null
  }
}

import { ProjectState, ProjectFragment, Project, Genre, ProjectFile } from '@/types'

/**
 * Type-safe payload for updating project meta properties.
 * Using a discriminated union ensures that the 'value' matches the 'property' being updated.
 */
export type ProjectMetaUpdate = {
  [K in keyof Project]: { property: K; value: Project[K] }
}[keyof Project]
import { RootState } from './store'
import { projectFromFragment } from '@/lib/typeUtils'
import {
  normalizeProjectStoryContent,
  replaceChapterContent
} from '@/lib/storyContent'

const initialState: ProjectState = {
  projectHasLiveEdits: false,
  activeProject: null,
  pendingFiles: null,
  modifiedChapters: []
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
        // isNew: true
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
    },
    setActiveProject: (state, action: PayloadAction<Project | null>) => {
      state.activeProject = action.payload ? normalizeProjectStoryContent(action.payload) : null
      state.modifiedChapters = []
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
    resolvePendingFiles: (state, action: PayloadAction<string[] | null>) => {
      state.pendingFiles = action.payload
    },
    updateFile: (state, action: PayloadAction<ProjectFile>) => {
      if (state.activeProject) {
        const payload = action.payload
        const fileIndex = state.activeProject.files.findIndex((file) => file.title === payload.title)

        // Special case: "Story" title always updates the monolith
        if (payload.title === 'Story') {
          state.activeProject.storyContent = payload.content
          
          // If we have a chapter index, track it as modified
          if (payload.chapterIndex !== undefined && !state.modifiedChapters.includes(payload.chapterIndex)) {
            state.modifiedChapters.push(payload.chapterIndex)
          }
        }

        // Also update the file in the list if it exists
        if (fileIndex !== -1) {
          state.activeProject.files[fileIndex].content = payload.content
          state.activeProject.files[fileIndex].hasEdits = true
        } else if (payload.title !== 'Story') {
          // Don't duplicate Story in files array if updated via monolith
          state.activeProject.files.push({
            title: payload.title,
            content: payload.content,
            type: payload.type ?? 'unknown',
            sort_order: payload.sort_order ?? state.activeProject.files.length + 1,
            hasEdits: true
          })
        }

        state.projectHasLiveEdits = true
      }
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
    updateMetaProperty: (state, action: PayloadAction<ProjectMetaUpdate>) => {
      if (!state.activeProject || !action.payload) return

      const payload = action.payload
      let updated = false

      // Using a switch statement to narrow the type of 'payload' members.
      // This provides full type safety for handled properties while avoiding 'as any'.
      switch (payload.property) {
        case 'storyContent':
          state.activeProject.storyContent = payload.value
          updated = true
          break
        case 'projectPath':
          state.activeProject.projectPath = payload.value
          updated = true
          break
        case 'wordCountCurrent':
          state.activeProject.wordCountCurrent = payload.value
          updated = true
          break
        case 'wordCountHistorical':
          state.activeProject.wordCountHistorical = payload.value
          updated = true
          break
        case 'title':
          state.activeProject.title = payload.value
          updated = true
          break
        case 'genre':
          state.activeProject.genre = payload.value
          updated = true
          break
        case 'summary':
          state.activeProject.summary = payload.value
          updated = true
          break
        case 'year':
          state.activeProject.year = payload.value
          updated = true
          break
        case 'wordCountTarget':
          state.activeProject.wordCountTarget = payload.value
          updated = true
          break
        case 'cover':
          state.activeProject.cover = payload.value
          updated = true
          break
        case 'coverImageMimeType':
          state.activeProject.coverImageMimeType = payload.value
          updated = true
          break
        case 'coverImageBase64':
          state.activeProject.coverImageBase64 = payload.value
          updated = true
          break
        case 'dialogueAnalysis':
          state.activeProject.dialogueAnalysis = payload.value
          updated = true
          break
        case 'expertSuggestions':
          state.activeProject.expertSuggestions = payload.value
          updated = true
          break
        case 'knowledgeGraph':
          state.activeProject.knowledgeGraph = payload.value
          updated = true
          break
        case 'chatHistory':
          state.activeProject.chatHistory = payload.value
          updated = true
          break
        case 'files':
          state.activeProject.files = payload.value
          updated = true
          break
        default:
          // Fallback for any properties not explicitly handled to maintain future-proofing.
          // Since ProjectMetaUpdate is a union of Project keys, this is safe to cast.
          ;(state.activeProject as any)[payload.property] = payload.value
          updated = true
      }

      if (updated) {
        state.projectHasLiveEdits = true
      }
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
        
        state.activeProject.storyContent = `${currentContent}${delimiter}# ${newChapterTitle}\n\n`
        state.projectHasLiveEdits = true
        
        // Track the new chapter as modified
        if (!state.modifiedChapters.includes(newChapterNumber - 1)) {
          state.modifiedChapters.push(newChapterNumber - 1)
        }
      }
    },
    updateChapter: (state, action: PayloadAction<{ title: string; content: string }>) => {
      if (state.activeProject) {
        const { title, content } = action.payload
        state.activeProject.storyContent = replaceChapterContent(
          state.activeProject.storyContent,
          title,
          content
        )
        state.projectHasLiveEdits = true
        
        // Note: updateChapter currently doesn't pass index, 
        // but we might want to find it if we use this reducer for edits.
        // However, MarkdownViewer uses updateFile for live edits.
      }
    }
  }
})

export const {
  startNewProject,
  setActiveProject,
  setPendingFiles,
  resolvePendingFiles,
  setActiveProjectFromFragment,
  setProjectHasLiveEdits,
  setAllFilesAsSaved,
  updateFile,
  updateParameters,
  updateReviews,
  updateMetaProperty,
  updateCoverImage,
  addChapter, // Export the new action
  updateChapter
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
