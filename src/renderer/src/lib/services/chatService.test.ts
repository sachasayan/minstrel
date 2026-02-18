import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMessage, generateTitleSuggestions } from './chatService'
import geminiService from './llmService'
import { store } from '@/lib/store/store'
import * as toolHandlers from './toolHandlers'
import * as llmParser from './llmParser'

// Mock dependencies
vi.mock('./llmService', () => ({
  default: {
    generateContent: vi.fn()
  }
}))

vi.mock('@/lib/store/store', () => ({
  store: {
    dispatch: vi.fn(),
    getState: vi.fn()
  }
}))

vi.mock('./toolHandlers', () => ({
  handleWriteFile: vi.fn(),
  handleCritique: vi.fn(),
  handleMessage: vi.fn(),
  handleActionSuggestions: vi.fn()
}))

vi.mock('./llmParser', () => ({
  parseLLMResponse: vi.fn(),
  isValidAgentType: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}))

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(store.getState).mockReturnValue({
      projects: { activeProject: { title: 'Test', files: [], storyContent: '' } },
      settings: { highPreferenceModelId: 'h', lowPreferenceModelId: 'l' },
      chat: { chatHistory: [] }
    } as any)
  })

  describe('sendMessage', () => {
    it('should iterate and call handlers', async () => {
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce('response text')
      
      vi.mocked(llmParser.parseLLMResponse).mockReturnValueOnce({
        context: { agent: 'routingAgent', currentStep: 0 },
        tools: { 
          message: 'Hello!',
          writeFile: { file_name: 'test.md', content: 'content' }
        }
      } as any)
      
      await sendMessage(context)
      
      expect(geminiService.generateContent).toHaveBeenCalledOnce()
      expect(toolHandlers.handleMessage).toHaveBeenCalledWith('Hello!')
      expect(toolHandlers.handleWriteFile).toHaveBeenCalledWith('test.md', 'content')
    })

    it('should iterate when routing to a non-routing agent', async () => {
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      vi.mocked(geminiService.generateContent)
        .mockResolvedValueOnce('response 1')
        .mockResolvedValueOnce('response 2')
        
      vi.mocked(llmParser.parseLLMResponse)
        .mockReturnValueOnce({
          context: { agent: 'writerAgent', currentStep: 0 },
          tools: {}
        } as any)
        .mockReturnValueOnce({
          context: { agent: 'routingAgent', currentStep: 1 },
          tools: { message: 'Finished' }
        } as any)
      
      await sendMessage(context)
      
      expect(geminiService.generateContent).toHaveBeenCalledTimes(2)
      expect(toolHandlers.handleMessage).toHaveBeenCalledWith('Finished')
    })

    it('should respect AbortSignal', async () => {
      vi.mocked(geminiService.generateContent).mockImplementation(async () => {
        // Trigger a second sendMessage call to abort the first one
        const secondContext = { agent: 'routingAgent', currentStep: 0 } as any
        sendMessage(secondContext)
        return 'late response'
      })

      const firstContext = { agent: 'routingAgent', currentStep: 0 } as any
      await sendMessage(firstContext)
      
      // The first call should have been aborted before processing its response
      expect(llmParser.parseLLMResponse).toHaveBeenCalledTimes(1) // Only from the second call
    })
  })

  describe('generateTitleSuggestions', () => {
    it('should use parser to extract suggestions', async () => {
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce('titles xml')
      vi.mocked(llmParser.parseLLMResponse).mockReturnValueOnce({
        tools: { actionSuggestions: ['T1', 'T2'] }
      } as any)
      
      const titles = await generateTitleSuggestions('plot', 'fantasy', 'space')
      expect(titles).toEqual(['T1', 'T2'])
    })
  })
})
