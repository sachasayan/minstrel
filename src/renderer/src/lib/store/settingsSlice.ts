import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppSettings } from '@/types'
import { RootState } from '@/lib/store/store'
import {
  DEFAULT_HIGH_PREFERENCE_MODEL_ID,
  DEFAULT_LOW_PREFERENCE_MODEL_ID,
  DEFAULT_PROVIDER
} from '@shared/constants'

const initialState: AppSettings = {
  api: '',
  workingRootDirectory: null, // Match default type in settingsManager
  highPreferenceModelId: DEFAULT_HIGH_PREFERENCE_MODEL_ID,
  lowPreferenceModelId: DEFAULT_LOW_PREFERENCE_MODEL_ID,
  // Provider configuration
  provider: DEFAULT_PROVIDER,
  googleApiKey: '',
  deepseekApiKey: '',
  zaiApiKey: '',
  openaiApiKey: '',
  nvidiaApiKey: ''
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettingsState: (state, action: PayloadAction<AppSettings>) => {
      // Ensure defaults are applied if loaded settings are missing the new fields
      const loadedSettings = action.payload
      state.api = loadedSettings.api ?? initialState.api
      state.workingRootDirectory = loadedSettings.workingRootDirectory ?? initialState.workingRootDirectory
      state.highPreferenceModelId = loadedSettings.highPreferenceModelId ?? initialState.highPreferenceModelId
      state.lowPreferenceModelId = loadedSettings.lowPreferenceModelId ?? initialState.lowPreferenceModelId
      // Provider configuration
      state.provider = loadedSettings.provider ?? initialState.provider
      state.googleApiKey = loadedSettings.googleApiKey ?? initialState.googleApiKey
      state.deepseekApiKey = loadedSettings.deepseekApiKey ?? initialState.deepseekApiKey
      state.zaiApiKey = loadedSettings.zaiApiKey ?? initialState.zaiApiKey
      state.openaiApiKey = loadedSettings.openaiApiKey ?? initialState.openaiApiKey
      state.nvidiaApiKey = loadedSettings.nvidiaApiKey ?? initialState.nvidiaApiKey
    },
    setApi: (state, action: PayloadAction<string>) => {
      state.api = action.payload
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
    setNvidiaApiKey: (state, action: PayloadAction<string>) => {
      state.nvidiaApiKey = action.payload
    }
  }
})

// Export new actions
export const {
  setApi,
  setWorkingRootDirectory,
  setSettingsState,
  setHighPreferenceModelId,
  setLowPreferenceModelId,
  setProvider,
  setGoogleApiKey,
  setDeepseekApiKey,
  setZaiApiKey,
  setOpenaiApiKey,
  setNvidiaApiKey
} = settingsSlice.actions

export const selectSettingsState = (state: RootState) => state.settings

export default settingsSlice.reducer
