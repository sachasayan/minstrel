export const DEFAULT_PROVIDER = 'google'

export const PROVIDER_MODELS = {
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
} as const

export const DEFAULT_HIGH_PREFERENCE_MODEL_ID = PROVIDER_MODELS.google.high
export const DEFAULT_LOW_PREFERENCE_MODEL_ID = PROVIDER_MODELS.google.low
