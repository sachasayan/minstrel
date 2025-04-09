import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, streamText } from 'ai'
import { store } from '@/lib/store/store'

const llmService = {
  apiKey: null as string | null,

  async getApiKey() {
    const apiKey = store.getState().settings.apiKey
    if (!apiKey) {
      console.warn('API key is not defined in settings.')
      return null
    }
    return apiKey
  },

  updateApiKey(apiKey: string | null) {
    this.apiKey = apiKey
  },

  async verifyKey(apiKey: string) {
    if (!apiKey) {
      console.error('No API key provided for verification.')
      return false
    }
    try {
      const settings = store.getState().settings;
      const lowModelId = settings.lowPreferenceModelId || 'gemini-2.0-flash'; // Use default if setting is missing/empty

      const google = createGoogleGenerativeAI({ apiKey })
      const { text } = await generateText({
        model: google(lowModelId),
        prompt: 'Hey there!'
      })
      console.log('API Key is valid. Test response:', text)
      return true
    } catch (error) {
      console.error('Invalid API Key or verification request failed:', error)
      return false
    }
  },

  async generateContent(prompt: string, modelPreference: 'high' | 'low' = 'low') {
    const currentApiKey = this.apiKey ?? (await this.getApiKey())

    if (!currentApiKey) {
      throw new Error('LLM API key is not initialized. Please set the API key in settings.')
    }

    const settings = store.getState().settings;
    const highModelId = settings.highPreferenceModelId || 'gemini-2.0-flash-thinking-exp-01-21'; // Use default
    const lowModelId = settings.lowPreferenceModelId || 'gemini-2.0-flash'; // Use default

    const selectedModelId = modelPreference === 'high' ? highModelId : lowModelId;

    console.log(`Using model: ${selectedModelId} for agent preference: ${modelPreference}`)

    try {
      const google = createGoogleGenerativeAI({ apiKey: currentApiKey })
      const { text } = await generateText({
        model: google(selectedModelId),
        prompt: prompt
      })
      return text
    } catch (error) {
      console.error(`Error generating content with Vercel AI SDK (Model: ${selectedModelId}):`, error)
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  // Streaming version of generateContent
  async *streamGenerateContent(prompt: string, modelPreference: 'high' | 'low' = 'low') {
    const currentApiKey = this.apiKey ?? (await this.getApiKey())

    if (!currentApiKey) {
      throw new Error('LLM API key is not initialized. Please set the API key in settings.')
    }

    const settings = store.getState().settings;
    const highModelId = settings.highPreferenceModelId || 'gemini-2.0-flash-thinking-exp-01-21'; // Use default
    const lowModelId = settings.lowPreferenceModelId || 'gemini-2.0-flash'; // Use default

    const selectedModelId = modelPreference === 'high' ? highModelId : lowModelId;

    console.log(`Streaming using model: ${selectedModelId} for agent preference: ${modelPreference}`)

    try {
      const google = createGoogleGenerativeAI({ apiKey: currentApiKey })
      const { textStream } = await streamText({ // Use streamText
        model: google(selectedModelId),
        prompt: prompt
      })

      // Yield each delta as it arrives
      for await (const delta of textStream) {
        yield delta
      }

    } catch (error) {
      console.error(`Error streaming content with Vercel AI SDK (Model: ${selectedModelId}):`, error)
      // Re-throw the error so the caller can handle it
      throw new Error(`Failed to stream content: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export default llmService
