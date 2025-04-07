import { createGoogleGenerativeAI } from '@ai-sdk/google' // Import Vercel AI SDK Google provider
import { generateText } from 'ai' // Import Vercel AI SDK core function
import { store } from '@/lib/store/store'

// Removed hardcoded model ID constants

const llmService = {
  apiKey: null as string | null,

  // Keep getApiKey as it fetches from the store
  async getApiKey() {
    const apiKey = store.getState().settings.apiKey
    if (!apiKey) {
      console.warn('API key is not defined in settings.')
      return null
    }
    return apiKey
  },

  // Update API key just stores the key now
  updateApiKey(apiKey: string | null) {
    this.apiKey = apiKey
  },

  async verifyKey(apiKey: string) {
    if (!apiKey) {
      console.error('No API key provided for verification.')
      return false
    }
    try {
      // Get configured low preference model from settings
      const settings = store.getState().settings;
      // Use default if setting is missing/empty
      const lowModelId = settings.lowPreferenceModelId || 'gemini-2.0-flash';

      const google = createGoogleGenerativeAI({ apiKey })
      const { text } = await generateText({
        model: google(lowModelId), // Use configured LOW preference model
        prompt: 'Hey there!'
      })
      console.log('API Key is valid. Test response:', text)
      return true
    } catch (error) {
      console.error('Invalid API Key or verification request failed:', error)
      return false
    }
  },

  // Add modelPreference argument with a default value
  async generateContent(prompt: string, modelPreference: 'high' | 'low' = 'low') {
    const currentApiKey = this.apiKey ?? (await this.getApiKey())

    if (!currentApiKey) {
      throw new Error('LLM API key is not initialized. Please set the API key in settings.')
    }

    // Get configured model IDs from settings
    const settings = store.getState().settings;
    // Use defaults if settings are missing/empty
    const highModelId = settings.highPreferenceModelId || 'gemini-2.0-flash-thinking-exp-01-21';
    const lowModelId = settings.lowPreferenceModelId || 'gemini-2.0-flash';

    // Select model based on preference using configured IDs
    const selectedModelId = modelPreference === 'high'
      ? highModelId
      : lowModelId;

    console.log(`Using model: ${selectedModelId} for agent preference: ${modelPreference}`) // Logging

    try {
      const google = createGoogleGenerativeAI({ apiKey: currentApiKey })

      const { text } = await generateText({
        model: google(selectedModelId), // Use the selected model ID
        prompt: prompt
      })
      return text
    } catch (error) {
      console.error(`Error generating content with Vercel AI SDK (Model: ${selectedModelId}):`, error)
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export default llmService
