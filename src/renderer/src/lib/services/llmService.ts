import { createGoogleGenerativeAI } from '@ai-sdk/google' // Import Vercel AI SDK Google provider
import { generateText } from 'ai' // Import Vercel AI SDK core function
import { store } from '@/lib/store/store'

// Define the model identifiers without the provider prefix
const HIGH_PREFERENCE_MODEL_ID = 'gemini-2.0-flash-thinking'
const LOW_PREFERENCE_MODEL_ID = 'gemini-2.0-flash'

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
    // No need to initialize a client instance here anymore
  },

  async verifyKey(apiKey: string) {
    if (!apiKey) {
      console.error('No API key provided for verification.')
      return false
    }
    try {
      // Create a temporary provider instance for verification
      const google = createGoogleGenerativeAI({ apiKey })
      // Make a simple test call using the low preference model
      const { text } = await generateText({
        model: google(LOW_PREFERENCE_MODEL_ID), // Use LOW preference model for verification
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
    // Fetch the latest API key from the service's state or store if needed
    // Using the internal state for simplicity, assuming updateApiKey was called
    const currentApiKey = this.apiKey ?? (await this.getApiKey())

    if (!currentApiKey) {
      throw new Error('LLM API key is not initialized. Please set the API key in settings.')
    }

    // Select model based on preference
    const selectedModelId = modelPreference === 'high'
      ? HIGH_PREFERENCE_MODEL_ID
      : LOW_PREFERENCE_MODEL_ID;

    console.log(`Using model: ${selectedModelId} for agent preference: ${modelPreference}`) // Add logging

    try {
      // Create the provider instance on demand
      const google = createGoogleGenerativeAI({ apiKey: currentApiKey })

      // Use generateText from Vercel AI SDK with the selected model
      const { text } = await generateText({
        model: google(selectedModelId), // Use the selected model ID (without prefix)
        prompt: prompt
      })
      return text
    } catch (error) {
      console.error(`Error generating content with Vercel AI SDK (Model: ${selectedModelId}):`, error)
      // Re-throw or handle as appropriate for the application
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export default llmService
