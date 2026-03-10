import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  generateTextMock,
  streamTextMock,
  googleFactoryMock,
  openAiFactoryMock
} = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
  streamTextMock: vi.fn(),
  googleFactoryMock: vi.fn(),
  openAiFactoryMock: vi.fn()
}))

vi.mock('ai', () => ({
  generateText: generateTextMock,
  streamText: streamTextMock
}))

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: googleFactoryMock
}))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: openAiFactoryMock
}))

import service from './llmService'

describe('llmService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the configured provider API key and preferred high model for tool-enabled generation', async () => {
    const model = { id: 'gpt-4o' }
    const provider = vi.fn().mockReturnValue(model)
    openAiFactoryMock.mockReturnValue(provider)
    generateTextMock.mockResolvedValue({
      text: 'ok',
      toolCalls: []
    })

    const settings = {
      provider: 'openai',
      openaiApiKey: 'openai-key',
      highPreferenceModelId: 'gpt-4o',
      lowPreferenceModelId: 'gpt-4o-mini'
    }
    const tools = { writeFile: { description: 'Write', inputSchema: {}, execute: vi.fn() } }

    const result = await service.generateTextWithTools(
      settings as any,
      'system prompt',
      'user prompt',
      tools,
      'high'
    )

    expect(openAiFactoryMock).toHaveBeenCalledWith({ apiKey: 'openai-key' })
    expect(provider).toHaveBeenCalledWith('gpt-4o')
    expect(generateTextMock).toHaveBeenCalledWith({
      model,
      system: 'system prompt',
      prompt: 'user prompt',
      tools
    })
    expect(result.text).toBe('ok')
  })

  it('falls back to provider defaults when model IDs are not configured', () => {
    const model = { id: 'gemini-3-flash-preview' }
    const provider = vi.fn().mockReturnValue(model)
    googleFactoryMock.mockReturnValue(provider)

    const { model: selectedModel, provider: selectedProvider, selectedModelId } =
      service.getProviderAndModel(
        {
          provider: 'google',
          googleApiKey: 'google-key'
        } as any,
        'low'
      )

    expect(googleFactoryMock).toHaveBeenCalledWith({ apiKey: 'google-key' })
    expect(provider).toHaveBeenCalledWith('gemini-3-flash-preview')
    expect(selectedModel).toBe(model)
    expect(selectedProvider).toBe('google')
    expect(selectedModelId).toBe('gemini-3-flash-preview')
  })

  it('throws when the selected provider is missing an API key', () => {
    expect(() =>
      service.getProviderAndModel(
        {
          provider: 'openai'
        } as any,
        'low'
      )
    ).toThrow('LLM API key for provider openai is not initialized')
  })

  it('passes messages and tools into streamTextWithTools using the low-preference model by default', async () => {
    const model = { id: 'gpt-4o-mini' }
    const provider = vi.fn().mockReturnValue(model)
    openAiFactoryMock.mockReturnValue(provider)
    const streamResult = {
      text: Promise.resolve('hello'),
      toolCalls: Promise.resolve([]),
      textStream: (async function* () {
        yield 'hello'
      })()
    }
    streamTextMock.mockReturnValue(streamResult)

    const settings = {
      provider: 'openai',
      openaiApiKey: 'openai-key',
      lowPreferenceModelId: 'gpt-4o-mini'
    }
    const messages = [{ role: 'user', content: 'Continue' }]
    const tools = { routeTo: { description: 'Route', inputSchema: {}, execute: vi.fn() } }

    const result = await service.streamTextWithTools(
      settings as any,
      'system',
      messages as any,
      tools
    )

    expect(provider).toHaveBeenCalledWith('gpt-4o-mini')
    expect(streamTextMock).toHaveBeenCalledWith({
      model,
      system: 'system',
      messages,
      tools
    })
    expect(result).toBe(streamResult)
  })
})
