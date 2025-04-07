import { createGoogleGenerativeAI } from '@ai-sdk/google' // Import Vercel AI SDK Google provider
import { generateText } from 'ai' // Import Vercel AI SDK core function
import { store } from '@/lib/store/store'

// Define the model identifier
const MODEL_ID = 'gemini-2.0-flash' // Use the Vercel SDK model identifier format

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

  // Removed getModel() as it's no longer relevant with the functional SDK approach

  async verifyKey(apiKey: string) {
    if (!apiKey) {
      console.error('No API key provided for verification.')
      return false
    }
    try {
      // Create a temporary provider instance for verification
      const google = createGoogleGenerativeAI({ apiKey })
      // Make a simple test call
      const { text } = await generateText({
        model: google(MODEL_ID), // Pass the model instance
        prompt: 'Hey there!'
      })
      console.log('API Key is valid. Test response:', text)
      return true
    } catch (error) {
      console.error('Invalid API Key or verification request failed:', error)
      return false
    }
  },

  async generateContent(prompt: string) {
    // Fetch the latest API key from the service's state or store if needed
    // Using the internal state for simplicity, assuming updateApiKey was called
    const currentApiKey = this.apiKey ?? (await this.getApiKey())

    if (!currentApiKey) {
      throw new Error('LLM API key is not initialized. Please set the API key in settings.')
    }

    try {
      // Create the provider instance on demand
      const google = createGoogleGenerativeAI({ apiKey: currentApiKey })

      // Use generateText from Vercel AI SDK
      const { text } = await generateText({
        model: google(MODEL_ID), // Pass the model instance
        prompt: prompt
      })
      return text
    } catch (error) {
      console.error('Error generating content with Vercel AI SDK:', error)
      // Re-throw or handle as appropriate for the application
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export default llmService
