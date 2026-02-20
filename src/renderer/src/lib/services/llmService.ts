import { generateText, streamText, LanguageModel } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { AppSettings } from '@/types'
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
  zai: (modelId: string) => modelId // Placeholder
}

// @ts-ignore
const service: any = {
  // Get API key for from settings
  getApiKey(settings: AppSettings, provider: string) {
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
      const lowModelId = this.getDefaultModelId(provider, 'low')

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

  // Helper to get provider and model based on settings
  getProviderAndModel(settings: AppSettings, modelPreference: 'high' | 'low' = 'low') {
    const provider = settings.provider || 'google'
    const apiKey = this.getApiKey(settings, provider)

    if (!apiKey) {
      throw new Error(
        `LLM API key for provider ${provider} is not initialized. Please set the API key in settings.`
      )
    }

    const highModelId = settings.highPreferenceModelId || this.getDefaultModelId(provider, 'high')
    const lowModelId = settings.lowPreferenceModelId || this.getDefaultModelId(provider, 'low')
    const selectedModelId = modelPreference === 'high' ? highModelId : lowModelId

    const factory = providerFactories[provider]
    if (!factory) {
      throw new Error(`Provider ${provider} not supported`)
    }

    const aiProvider = factory({ apiKey })
    const model = this.getModel(aiProvider, provider, selectedModelId)

    return { model, provider, selectedModelId }
  },

  // Generate content with selected provider
  async generateContent(settings: AppSettings, prompt: string, modelPreference: 'high' | 'low' = 'low') {
    const { model, provider, selectedModelId } = this.getProviderAndModel(settings, modelPreference)

    console.log(
      `Using provider: ${provider}, model: ${selectedModelId} for agent preference: ${modelPreference}`
    )

    try {
      const { text } = await generateText({
        model,
        prompt: prompt
      })
      return text
    } catch (error) {
      console.error(
        `Error generating content with provider ${provider} (Model: ${selectedModelId}):`,
        error
      )
      throw new Error(
        `Failed to generate content: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  },

  // Generate content with native tools
  async generateTextWithTools(settings: AppSettings, prompt: string, tools: any, modelPreference: 'high' | 'low' = 'low') {
    const { model, provider, selectedModelId } = this.getProviderAndModel(settings, modelPreference)

    console.log(
      `Using provider: ${provider}, model: ${selectedModelId} with tools for agent preference: ${modelPreference}`
    )

    try {
      const result = await generateText({
        model,
        prompt: prompt,
        tools: tools
        // Optional: Force tool use if needed, but we prefer hybrid
        // toolChoice: 'auto'
      })
      return result
    } catch (error) {
      console.error(
        `Error generating content with tools and provider ${provider} (Model: ${selectedModelId}):`,
        error
      )
      throw new Error(
        `Failed to generate content with tools: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  },

  // Stream content with native tools
  async streamTextWithTools(settings: AppSettings, prompt: string, tools: any, modelPreference: 'high' | 'low' = 'low') {
    const { model, provider, selectedModelId } = this.getProviderAndModel(settings, modelPreference)

    console.log(
      `Streaming with provider: ${provider}, model: ${selectedModelId} with tools for agent preference: ${modelPreference}`
    )

    try {
      return streamText({
        model,
        prompt: prompt,
        tools: tools
      })
    } catch (error) {
      console.error(
        `Error streaming content with tools and provider ${provider} (Model: ${selectedModelId}):`,
        error
      )
      throw new Error(
        `Failed to stream content with tools: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  },

  // Streaming version of generateContent
  async *streamGenerateContent(settings: AppSettings, prompt: string, modelPreference: 'high' | 'low' = 'low') {
    const { model, provider, selectedModelId } = this.getProviderAndModel(settings, modelPreference)

    console.log(
      `Streaming with provider: ${provider}, model: ${selectedModelId} for agent preference: ${modelPreference}`
    )

    try {
      const { textStream } = await streamText({
        model,
        prompt: prompt
      })

      // Yield each delta as it arrives
      for await (const delta of textStream) {
        yield delta
      }
    } catch (error) {
      console.error(
        `Error streaming content with provider ${provider} (Model: ${selectedModelId}):`,
        error
      )
      throw new Error(
        `Failed to stream content: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}

export default service
