import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppSettings } from '@/types'
import { RootState } from '@/lib/store/store'

const initialState: AppSettings = {
  api: '',
  apiKey: '',
  workingRootDirectory: ''
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettingsState: (state, action: PayloadAction<AppSettings>) => {
      Object.assign(state, action.payload)
    },
    setApi: (state, action: PayloadAction<string>) => {
      state.api = action.payload
    },
    setApiKey: (state, action: PayloadAction<string>) => {
      state.apiKey = action.payload
    },
    setWorkingRootDirectory: (state, action: PayloadAction<string>) => {
      state.workingRootDirectory = action.payload
    }
  }
})

export const { setApi, setApiKey, setWorkingRootDirectory, setSettingsState } = settingsSlice.actions

export const selectSettingsState = (state: RootState) => state.settings

export default settingsSlice.reducer
