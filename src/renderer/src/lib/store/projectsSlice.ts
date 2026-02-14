import { createSlice, PayloadAction } from '@reduxjs/toolkit'
// Patch Project interface to add dialogueAnalysis property
declare module '@/types' {
  interface Project {
    dialogueAnalysis?: {
      dialogCounts: Record<string, number[]>
    } | null
  }
}

import { ProjectState, ProjectFragment, Project, Genre, ProjectFile } from '@/types'
import { RootState } from './store'
import { projectFromFragment } from '@/lib/typeUtils'
import {
  isChapterFile,
  isChapterTitle,
  normalizeProjectStoryContent,
  rebuildProjectFilesFromStoryContent,
  serializeChapterFilesToStoryContent
} from '@/lib/storyContent'

const initialState: ProjectState = {
  projectHasLiveEdits: false,
  activeProject: null,
  pendingFiles: null
}

const syncProjectFilesFromStory = (project: Project, editedTitles: Set<string> = new Set()) => {
  project.files = rebuildProjectFilesFromStoryContent(project, editedTitles)
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
        files: [
          {
            title: 'Chapter 1',
            content: '',
            type: 'chapter',
            sort_order: 1
          }
        ],
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
    },
    setActiveProjectFromFragment: (state, action: PayloadAction<ProjectFragment>) => {
      state.activeProject = projectFromFragment(action.payload)
    },
    setActiveProject: (state, action: PayloadAction<Project | null>) => {
      state.activeProject = action.payload ? normalizeProjectStoryContent(action.payload) : null
    },
    setProjectHasLiveEdits: (state, action: PayloadAction<boolean>) => {
      state.projectHasLiveEdits = action.payload
    },
    setAllFilesAsSaved: (state) => {
      state.projectHasLiveEdits = false
      state.activeProject?.files?.forEach((chapter) => {
        chapter.hasEdits = false
      })
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

        // If it's the "Story" or an H1 chapter, or any other file
        if (fileIndex !== -1) {
          state.activeProject.files[fileIndex].content = payload.content
          state.activeProject.files[fileIndex].hasEdits = true
          
          // If we are updating the "Story" itself
          if (state.activeProject.files[fileIndex].title === 'Story') {
            state.activeProject.storyContent = payload.content
          }
        } else {
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
    updateMetaProperty: (state, action: PayloadAction<{ property: string; value: any }>) => {
      if (!state.activeProject)
        return // Use type assertion carefully or add type checks if property is specific
      if (action.payload.property === 'storyContent' && typeof action.payload.value === 'string') {
        state.activeProject.storyContent = action.payload.value
        // REMOVED syncProjectFilesFromStory call
        state.projectHasLiveEdits = true
        return
      }
        // Cast to any to bypass TS error when assigning 'any' value to dynamic property
      ;(state.activeProject as any)[action.payload.property] = action.payload.value
      state.projectHasLiveEdits = true
    },
    updateReviews: (state, action: PayloadAction<{ critique: any[]; analysis: { dialogCounts: Record<string, number[]> } }>) => {
      if (!state.activeProject) return
      state.activeProject.expertSuggestions = action.payload.critique
      state.activeProject.dialogueAnalysis = action.payload.analysis
      state.projectHasLiveEdits = true
    },
    renameFile: (state, action: PayloadAction<{ oldTitle: string; newTitle: string }>) => {
      if (!state.activeProject) return
      const { oldTitle, newTitle } = action.payload
      const fileIndex = state.activeProject.files.findIndex((file) => file.title === oldTitle)

      if (fileIndex === -1) return // Do nothing if file with oldTitle not found

      // Case-insensitive title conflict check
      const titleConflict = state.activeProject.files.some((file) => file.title.toLowerCase() === newTitle.toLowerCase())
      if (titleConflict) {
        console.warn(`Title conflict detected: ${newTitle} already exists. RenameFile reducer cancelled.`) // Log warning for debugging
        return
      }

      state.activeProject.files[fileIndex].title = newTitle
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
  renameFile,
  updateCoverImage,
  addChapter // Export the new action
} = projectsSlice.actions
export const selectProjects = (state: RootState) => state.projects
export const selectActiveProject = (state: RootState) => state.projects.activeProject

// Add selector for cover data URL (implementation for Step 5)
// This selector computes the data URL on demand
export const selectActiveProjectWithCoverDataUrl = (state: RootState): Project | null => {
  const activeProject = state.projects.activeProject
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

export default projectsSlice.reducer
