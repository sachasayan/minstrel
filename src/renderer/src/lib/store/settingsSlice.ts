import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppSettings } from '@/types'
import { RootState } from '@/lib/store/store'

// Default model IDs (match those in settingsManager.ts)
const DEFAULT_HIGH_PREFERENCE_MODEL_ID = 'gemini-2.0-flash-thinking'
const DEFAULT_LOW_PREFERENCE_MODEL_ID = 'gemini-2.0-flash'

const initialState: AppSettings = {
  api: '',
  apiKey: '',
  workingRootDirectory: null, // Match default type in settingsManager
  highPreferenceModelId: DEFAULT_HIGH_PREFERENCE_MODEL_ID, // Added default
  lowPreferenceModelId: DEFAULT_LOW_PREFERENCE_MODEL_ID   // Added default
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettingsState: (state, action: PayloadAction<AppSettings>) => {
      // Ensure defaults are applied if loaded settings are missing the new fields
      const loadedSettings = action.payload;
      state.api = loadedSettings.api ?? initialState.api;
      state.apiKey = loadedSettings.apiKey ?? initialState.apiKey;
      state.workingRootDirectory = loadedSettings.workingRootDirectory ?? initialState.workingRootDirectory;
      state.highPreferenceModelId = loadedSettings.highPreferenceModelId ?? initialState.highPreferenceModelId;
      state.lowPreferenceModelId = loadedSettings.lowPreferenceModelId ?? initialState.lowPreferenceModelId;
    },
    setApi: (state, action: PayloadAction<string>) => {
      state.api = action.payload
    },
    setApiKey: (state, action: PayloadAction<string>) => {
      state.apiKey = action.payload
    },
    // Ensure payload type allows null for working directory
    setWorkingRootDirectory: (state, action: PayloadAction<string | null>) => {
      state.workingRootDirectory = action.payload
    },
    // Added new reducers
    setHighPreferenceModelId: (state, action: PayloadAction<string>) => {
      state.highPreferenceModelId = action.payload
    },
    setLowPreferenceModelId: (state, action: PayloadAction<string>) => {
      state.lowPreferenceModelId = action.payload
    }
  }
})

// Export new actions
export const {
  setApi,
  setApiKey,
  setWorkingRootDirectory,
  setSettingsState,
  setHighPreferenceModelId,
  setLowPreferenceModelId
} = settingsSlice.actions

export const selectSettingsState = (state: RootState) => state.settings

export default settingsSlice.reducer
