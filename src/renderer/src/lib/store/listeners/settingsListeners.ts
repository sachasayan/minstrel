import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setSettingsState } from '@/lib/store/settingsSlice'
import geminiService from '@/lib/services/llmService'

export const settingsListeners = createListenerMiddleware()

settingsListeners.startListening({
  matcher: isAnyOf(setSettingsState),
  effect: async (action, listenerApi) => {
    const apiKey = action.payload?.apiKey
    geminiService.updateApiKey(apiKey || null)
  }
})
