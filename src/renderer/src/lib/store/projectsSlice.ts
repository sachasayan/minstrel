import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ProjectState, ProjectFragment, Project, Genre, ProjectFile } from '@/types'
import { RootState } from './store'
import { projectFromFragment } from '@/lib/typeUtils'

const initialState: ProjectState = {
  projectHasLiveEdits: false,
  activeProject: null
}

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setActiveProjectFromFragment: (state, action: PayloadAction<ProjectFragment>) => {
      state.activeProject = projectFromFragment(action.payload)
    },
    setActiveProject: (state, action: PayloadAction<Project | null>) => {
      state.activeProject = action.payload
    },
    setProjectHasLiveEdits: (state, action: PayloadAction<boolean>) => {
      state.projectHasLiveEdits = action.payload
    },
    setAllFilesAsSaved: (state) => {
      state.projectHasLiveEdits = false
      state.activeProject?.files?.forEach((chapter) => {
        chapter.hasEdits = false
      })
    },
    updateFile: (state, action: PayloadAction<ProjectFile>) => {
      if (state.activeProject) {
        //Get position of this file in the files list
        const chapterIndex = state.activeProject.files.findIndex((file) => file.title === action.payload.title)
        //If file exists, update it in the store
        if (chapterIndex !== -1) {
          state.activeProject.files[chapterIndex].content = action.payload.content
          state.activeProject.files[chapterIndex].hasEdits = true
          state.projectHasLiveEdits = true
        } else {
          // If chapter doesn't exist, add it
          state.activeProject.files.push({
            title: action.payload.title,
            content: action.payload.content,
            hasEdits: true
          })
          state.projectHasLiveEdits = true
        }
      }
    },
    updateParameters: (state, action: PayloadAction<{ title: string; genre: Genre; summary: string; year: number; totalWordCount: number; writingSample: string }>) => {
      if (state.activeProject) {
        state.activeProject.title = action.payload.title
        state.activeProject.genre = action.payload.genre
        state.activeProject.summary = action.payload.summary
        state.activeProject.year = action.payload.year
        state.activeProject.totalWordCount = action.payload.totalWordCount
        state.activeProject.writingSample = action.payload.writingSample
        state.projectHasLiveEdits = true
      }
    },
    updateReviews: (state, action: PayloadAction<any>) => {
      if (state.activeProject) {
        state.activeProject.expertSuggestions = action.payload
        state.projectHasLiveEdits = true
      }
    }
  }
})

export const { setActiveProject, setActiveProjectFromFragment, setProjectHasLiveEdits, setAllFilesAsSaved, updateFile, updateParameters, updateReviews } = projectsSlice.actions

export const selectProjects = (state: RootState) => state.projects
export const selectActiveProject = (state: RootState) => state.projects.activeProject

export default projectsSlice.reducer
