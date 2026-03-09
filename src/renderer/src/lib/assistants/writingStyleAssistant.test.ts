import { describe, it, expect, vi, beforeEach } from 'vitest'
import llmService from '@/lib/services/llmService'
import { describeWritingStyle } from './writingStyleAssistant'

vi.mock('@/lib/services/llmService', () => ({
  default: {
    generateContent: vi.fn()
  }
}))

describe('writingStyleAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a cleaned prose description', async () => {
    vi.mocked(llmService.generateContent).mockResolvedValue('```text\nMeasured, intimate prose with long cadences.\n```')

    const result = await describeWritingStyle({ provider: 'google' }, 'Some sample text')

    expect(result).toBe('Measured, intimate prose with long cadences.')
  })

  it('returns null for blank samples', async () => {
    const result = await describeWritingStyle({ provider: 'google' }, '   ')

    expect(result).toBeNull()
    expect(llmService.generateContent).not.toHaveBeenCalled()
  })

  it('returns null when the llm request fails', async () => {
    vi.mocked(llmService.generateContent).mockRejectedValue(new Error('boom'))

    const result = await describeWritingStyle({ provider: 'google' }, 'Some sample text')

    expect(result).toBeNull()
  })
})
