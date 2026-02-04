import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import { store } from '@/lib/store/store'

// Provider factory functions
const providerFactories: Record<string, any> = {
  google: createGoogleGenerativeAI,
  anthropic: createAnthropic,
  openai: createOpenAI
  // deepseek and zai need to be implemented when SDKs are available
}

// Model mapping for each provider
const providerModelMapping: Record<string, (modelId: string) => string> = {
  google: (modelId: string) => modelId, // Google uses model IDs directly
  anthropic: (modelId: string) => modelId, // Anthropic uses model IDs directly
  openai: (modelId: string) => modelId, // OpenAI uses model IDs directly
  deepseek: (modelId: string) => modelId, // Placeholder
  zai: (modelId: string) => modelId // Placeholder
}

const llmService = {
  // Get API key for current provider
  async getApiKey(provider: string) {
    const settings = store.getState().settings

    switch (provider) {
      case 'google':
        return settings.googleApiKey || settings.apiKey || null
      case 'anthropic':
        return settings.anthropicApiKey || settings.apiKey || null
      case 'openai':
        return settings.openaiApiKey || settings.apiKey || null
      case 'deepseek':
        return settings.deepseekApiKey || settings.apiKey || null
      case 'zai':
        return settings.zaiApiKey || settings.apiKey || null
      default:
        return settings.apiKey || null
    }
  },

  // Verify API key for a specific provider
  async verifyKey(apiKey: string, provider: string) {
    if (!apiKey) {
      console.error('No API key provided for verification.')
      return false
    }

    try {
      const settings = store.getState().settings
      const lowModelId = settings.lowPreferenceModelId || this.getDefaultModelId(provider, 'low')

      // Get the provider factory
      const factory = providerFactories[provider]
      if (!factory) {
        console.error(`Provider ${provider} not supported`)
        return false
      }

      const aiProvider = factory({ apiKey })
      const model = this.getModel(aiProvider, provider, lowModelId)

      const { text } = await generateText({
        model,
        prompt: 'Hey there!'
      })
      console.log(`API Key is valid for provider ${provider}. Test response:`, text)
      return true
    } catch (error) {
      console.error(`Invalid API Key or verification request failed for provider ${provider}:`, error)
      return false
    }
  },

  // Get default model ID for a provider
  getDefaultModelId(provider: string, preference: 'high' | 'low'): string {
    const defaults: Record<string, Record<'high' | 'low', string>> = {
      google: {
        high: 'gemini-2.0-flash-thinking-exp-01-21',
        low: 'gemini-2.0-flash'
      },
      anthropic: {
        high: 'claude-3-5-sonnet-20241022',
        low: 'claude-3-haiku-20240307'
      },
      openai: {
        high: 'gpt-4o',
        low: 'gpt-4o-mini'
      },
      deepseek: {
        high: 'deepseek-chat',
        low: 'deepseek-chat'
      },
      zai: {
        high: 'zai-model-1',
        low: 'zai-model-1'
      }
    }

    return defaults[provider]?.[preference] || defaults.google[preference]
  },

  // Get model instance
  getModel(aiProvider: any, provider: string, modelId: string) {
    const mappedModelId = providerModelMapping[provider]?.(modelId) || modelId

    if (provider === 'google') {
      return aiProvider(mappedModelId)
    } else if (provider === 'anthropic' || provider === 'openai') {
      return aiProvider(mappedModelId)
    } else {
      // For unsupported providers, throw error
      throw new Error(`Provider ${provider} not yet implemented`)
    }
  },

  // Generate content with selected provider
  async generateContent(prompt: string, modelPreference: 'high' | 'low' = 'low') {
    const settings = store.getState().settings
    const provider = settings.provider || 'google'
    const apiKey = await this.getApiKey(provider)

    if (!apiKey) {
      throw new Error(`LLM API key for provider ${provider} is not initialized. Please set the API key in settings.`)
    }

    const highModelId = settings.highPreferenceModelId || this.getDefaultModelId(provider, 'high')
    const lowModelId = settings.lowPreferenceModelId || this.getDefaultModelId(provider, 'low')
    const selectedModelId = modelPreference === 'high' ? highModelId : lowModelId

    console.log(`Using provider: ${provider}, model: ${selectedModelId} for agent preference: ${modelPreference}`)

    try {
      const factory = providerFactories[provider]
      if (!factory) {
        throw new Error(`Provider ${provider} not supported`)
      }

      const aiProvider = factory({ apiKey })
      const model = this.getModel(aiProvider, provider, selectedModelId)

      const { text } = await generateText({
        model,
        prompt: prompt
      })
      return text
    } catch (error) {
      console.error(`Error generating content with provider ${provider} (Model: ${selectedModelId}):`, error)
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  // Streaming version of generateContent
  async *streamGenerateContent(prompt: string, modelPreference: 'high' | 'low' = 'low') {
    const settings = store.getState().settings
    const provider = settings.provider || 'google'
    const apiKey = await this.getApiKey(provider)

    if (!apiKey) {
      throw new Error(`LLM API key for provider ${provider} is not initialized. Please set the API key in settings.`)
    }

    const highModelId = settings.highPreferenceModelId || this.getDefaultModelId(provider, 'high')
    const lowModelId = settings.lowPreferenceModelId || this.getDefaultModelId(provider, 'low')
    const selectedModelId = modelPreference === 'high' ? highModelId : lowModelId

    console.log(`Streaming with provider: ${provider}, model: ${selectedModelId} for agent preference: ${modelPreference}`)

    try {
      const factory = providerFactories[provider]
      if (!factory) {
        throw new Error(`Provider ${provider} not supported`)
      }

      const aiProvider = factory({ apiKey })
      const model = this.getModel(aiProvider, provider, selectedModelId)

      const { textStream } = await streamText({
        model,
        prompt: prompt
      })

      // Yield each delta as it arrives
      for await (const delta of textStream) {
        yield delta
      }
    } catch (error) {
      console.error(`Error streaming content with provider ${provider} (Model: ${selectedModelId}):`, error)
      throw new Error(`Failed to stream content: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export default llmService
