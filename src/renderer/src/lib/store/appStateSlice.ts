import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ActiveView, AppState, Project, ProjectFragment } from '@/types'
import { RootState } from './store'

const initialState: AppState = {
  projectList: [],
  activeView: 'intro',
  activeFile: null
}

export const appStateSlice = createSlice({
  name: 'appState',
  initialState,
  reducers: {
    setAppState: (state, action: PayloadAction<AppState>) => {
      Object.assign(state, action.payload)
    },
    setProjectList: (state, action: PayloadAction<ProjectFragment[]>) => {
      state.projectList = action.payload
    },
    setActiveView: (state, action: PayloadAction<ActiveView>) => {
      state.activeView = action.payload
    },
    setActiveFile: (state, action: PayloadAction<string | null>) => {
      state.activeFile = action.payload
    }
  }
})

export const { setAppState, setActiveView, setActiveFile, setProjectList } = appStateSlice.actions

export const selectProjectList = (state: RootState) => state.appState.projectList
export const selectActiveView = (state: RootState) => state.appState.activeView
export const selectAppState = (state: RootState) => state.appState

export default appStateSlice.reducer
