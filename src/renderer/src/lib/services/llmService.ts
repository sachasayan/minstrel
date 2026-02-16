import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText, LanguageModel } from 'ai'
import { store } from '@/lib/store/store'
import { PROVIDER_MODELS } from '@shared/constants'

type ProviderName = keyof typeof PROVIDER_MODELS
type AIProvider = (modelId: string) => LanguageModel
type ProviderFactory = (options: { apiKey: string }) => AIProvider

// Provider factory functions
const providerFactories: Partial<Record<ProviderName, ProviderFactory>> = {
  google: createGoogleGenerativeAI as unknown as ProviderFactory,
  openai: createOpenAI as unknown as ProviderFactory
  // deepseek and zai need to be implemented when SDKs are available
}

// Model mapping for each provider
const providerModelMapping: Partial<Record<ProviderName, (modelId: string) => string>> = {
  google: (modelId: string) => modelId, // Google uses model IDs directly
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
        return settings.googleApiKey || null
      case 'openai':
        return settings.openaiApiKey || null
      case 'deepseek':
        return settings.deepseekApiKey || null
      case 'zai':
        return settings.zaiApiKey || null
      default:
        return null
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
      const err = error as any
      const structuredError = {
        provider,
        message: err?.message ?? null,
        name: err?.name ?? null,
        status: err?.status ?? err?.statusCode ?? err?.response?.status ?? null,
        code: err?.code ?? err?.response?.data?.error?.code ?? null,
        cause: err?.cause ?? null,
        responseData: err?.response?.data ?? err?.data ?? null,
        responseBody: err?.body ?? err?.response?.body ?? null
      }
      console.error(`Invalid API key or verification request failed for provider ${provider}.`, structuredError)
      console.error('Raw verifyKey error object:', error)
      return false
    }
  },

  // Get default model ID for a provider
  getDefaultModelId(provider: string, preference: 'high' | 'low'): string {
    const providerKey = provider as ProviderName
    return (
      PROVIDER_MODELS[providerKey]?.[preference] || PROVIDER_MODELS.google[preference]
    )
  },

  // Get model instance
  getModel(aiProvider: AIProvider, provider: string, modelId: string) {
    const providerKey = provider as ProviderName
    const mappedModelId = providerModelMapping[providerKey]?.(modelId) || modelId

    if (provider === 'google') {
      return aiProvider(mappedModelId)
    } else if (provider === 'openai') {
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
