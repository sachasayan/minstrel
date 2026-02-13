import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setGoogleApiKey, setOpenaiApiKey, setDeepseekApiKey, setZaiApiKey } from '@/lib/store/settingsSlice'
import geminiService from '@/lib/services/llmService'
import { AppSettings } from '@/types'

export const settingsListeners = createListenerMiddleware()

// Listen for API key changes and verify them
settingsListeners.startListening({
  matcher: isAnyOf(setGoogleApiKey, setOpenaiApiKey, setDeepseekApiKey, setZaiApiKey),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as any
    const settings = state.settings as AppSettings
    const provider = settings.provider || 'google'

    // Get the appropriate API key based on the provider
    let apiKey: string | null = null
    switch (provider) {
      case 'google':
        apiKey = settings.googleApiKey || null
        break
      case 'openai':
        apiKey = settings.openaiApiKey || null
        break
      case 'deepseek':
        apiKey = settings.deepseekApiKey || null
        break
      case 'zai':
        apiKey = settings.zaiApiKey || null
        break
    }

    if (apiKey) {
      try {
        const isValid = await geminiService.verifyKey(apiKey, provider)
        if (isValid) {
          console.log(`API key verified successfully for provider: ${provider}`)
        } else {
          console.warn(`API key verification failed for provider: ${provider}`)
        }
      } catch (error) {
        console.error(`Error verifying API key for provider ${provider}:`, error)
      }
    }
  }
})
