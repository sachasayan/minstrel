export const DEFAULT_PROVIDER = 'google'

export const DEFAULT_MODEL_IDS: Record<string, { high: string; low: string }> = {
  google: {
    high: 'gemini-2.0-flash-thinking-exp-01-21',
    low: 'gemini-2.0-flash'
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

export const DEFAULT_HIGH_PREFERENCE_MODEL_ID = DEFAULT_MODEL_IDS.google.high
export const DEFAULT_LOW_PREFERENCE_MODEL_ID = DEFAULT_MODEL_IDS.google.low

export const MODEL_OPTIONS_BY_PROVIDER: Record<string, string[]> = {
  google: [
    'gemini-2.5-pro-preview-03-25',
    'gemini-3-flash-preview',
    'gemini-2.0-flash-thinking-exp-01-21',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-coder'],
  zai: [
    'zai-model-1', // Placeholder - need actual Z.AI model names
    'zai-model-2'
  ]
}

export const PROVIDER_OPTIONS = [
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'openai', label: 'OpenAI (ChatGPT)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'zai', label: 'Z.AI' }
]
