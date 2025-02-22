import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setSettingsState } from '@/lib/store/settingsSlice'
import geminiService from '@/lib/services/llmService'
import { AppSettings } from '@/types'

export const settingsListeners = createListenerMiddleware()

settingsListeners.startListening({
  matcher: isAnyOf(setSettingsState),
  effect: async (action: { payload: AppSettings }, listenerApi) => {
    const apiKey = action.payload?.apiKey
    geminiService.updateApiKey(apiKey || null)
  }
})
