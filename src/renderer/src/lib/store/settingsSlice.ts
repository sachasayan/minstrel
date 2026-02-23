import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppSettings, RecentProject } from '@/types'
import { RootState } from '@/lib/store/store'
import {
  DEFAULT_HIGH_PREFERENCE_MODEL_ID,
  DEFAULT_LOW_PREFERENCE_MODEL_ID,
  DEFAULT_PROVIDER
} from '@shared/constants'

const initialState: AppSettings = {
  workingRootDirectory: null, // Match default type in settingsManager
  highPreferenceModelId: DEFAULT_HIGH_PREFERENCE_MODEL_ID,
  lowPreferenceModelId: DEFAULT_LOW_PREFERENCE_MODEL_ID,
  // Provider configuration
  provider: DEFAULT_PROVIDER,
  googleApiKey: '',
  deepseekApiKey: '',
  zaiApiKey: '',
  openaiApiKey: '',
  recentProjects: []
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettingsState: (state, action: PayloadAction<AppSettings>) => {
      // Ensure defaults are applied if loaded settings are missing the new fields
      const loadedSettings = action.payload
      state.workingRootDirectory = loadedSettings.workingRootDirectory ?? initialState.workingRootDirectory
      state.highPreferenceModelId = loadedSettings.highPreferenceModelId ?? initialState.highPreferenceModelId
      state.lowPreferenceModelId = loadedSettings.lowPreferenceModelId ?? initialState.lowPreferenceModelId
      // Provider configuration
      state.provider = loadedSettings.provider ?? initialState.provider
      state.googleApiKey = loadedSettings.googleApiKey ?? initialState.googleApiKey
      state.deepseekApiKey = loadedSettings.deepseekApiKey ?? initialState.deepseekApiKey
      state.zaiApiKey = loadedSettings.zaiApiKey ?? initialState.zaiApiKey
      state.openaiApiKey = loadedSettings.openaiApiKey ?? initialState.openaiApiKey
      state.recentProjects = loadedSettings.recentProjects ?? initialState.recentProjects
    },
    // Ensure payload type allows null for working directory
    setWorkingRootDirectory: (state, action: PayloadAction<string | null>) => {
      state.workingRootDirectory = action.payload
    },

    setHighPreferenceModelId: (state, action: PayloadAction<string>) => {
      state.highPreferenceModelId = action.payload
    },
    setLowPreferenceModelId: (state, action: PayloadAction<string>) => {
      state.lowPreferenceModelId = action.payload
    },
    // Provider configuration reducers
    setProvider: (state, action: PayloadAction<string>) => {
      state.provider = action.payload
    },
    setGoogleApiKey: (state, action: PayloadAction<string>) => {
      state.googleApiKey = action.payload
    },
    setDeepseekApiKey: (state, action: PayloadAction<string>) => {
      state.deepseekApiKey = action.payload
    },
    setZaiApiKey: (state, action: PayloadAction<string>) => {
      state.zaiApiKey = action.payload
    },
    setOpenaiApiKey: (state, action: PayloadAction<string>) => {
      state.openaiApiKey = action.payload
    },
    setRecentProjects: (state, action: PayloadAction<RecentProject[]>) => {
      state.recentProjects = action.payload
    },
    addRecentProject: (state, action: PayloadAction<RecentProject>) => {
      const MAX_RECENT = 3
      const incoming = action.payload
      // Remove any existing entry for the same path, then prepend, then trim
      const filtered = (state.recentProjects ?? []).filter(
        (p) => p.projectPath !== incoming.projectPath
      )
      state.recentProjects = [incoming, ...filtered].slice(0, MAX_RECENT)
    }
  }
})

// Export new actions
export const {
  setWorkingRootDirectory,
  setSettingsState,
  setHighPreferenceModelId,
  setLowPreferenceModelId,
  setProvider,
  setGoogleApiKey,
  setDeepseekApiKey,
  setZaiApiKey,
  setOpenaiApiKey,
  setRecentProjects,
  addRecentProject
} = settingsSlice.actions

export const selectSettingsState = (state: RootState) => state.settings

export default settingsSlice.reducer
