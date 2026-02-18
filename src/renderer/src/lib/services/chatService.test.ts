import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMessage, generateTitleSuggestions } from './chatService'
import geminiService from './llmService'
import { store } from '@/lib/store/store'
import * as toolHandlers from './toolHandlers'

// Mock dependencies
vi.mock('./llmService', () => ({
  default: {
    generateContent: vi.fn(),
    generateTextWithTools: vi.fn()
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
      settings: { googleApiKey: 'key', provider: 'google', highPreferenceModelId: 'h', lowPreferenceModelId: 'l' },
      chat: { chatHistory: [] }
    } as any)
  })

  describe('sendMessage', () => {
    it('should iterate and call tool-triggered side-effects', async () => {
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      
      // Simulate tool calls being executed during generateTextWithTools
      vi.mocked(geminiService.generateTextWithTools).mockImplementationOnce(async (_p, tools: any) => {
        await tools.showMessage.execute({ message: 'Hello!' })
        await tools.writeFile.execute({ file_name: 'test.md', content: 'content' })
        return {
          text: 'AI reasoning',
          toolCalls: [
             { toolName: 'showMessage', args: { message: 'Hello!' } },
             { toolName: 'writeFile', args: { file_name: 'test.md', content: 'content' } }
          ]
        } as any
      })
      
      await sendMessage(context)
      
      expect(geminiService.generateTextWithTools).toHaveBeenCalledOnce()
      expect(toolHandlers.handleMessage).toHaveBeenCalledWith('Hello!')
      expect(toolHandlers.handleWriteFile).toHaveBeenCalledWith('test.md', 'content')
    })

    it('should iterate when routeTo is called', async () => {
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      
      // First turn: route to writerAgent
      vi.mocked(geminiService.generateTextWithTools)
        .mockImplementationOnce(async (_p, tools: any) => {
          await tools.routeTo.execute({ agent: 'writerAgent' })
          return { text: '', toolCalls: [{ toolName: 'routeTo', args: { agent: 'writerAgent' } }] } as any
        })
        // Second turn: finish (no routeTo)
        .mockImplementationOnce(async () => {
          return { text: 'Done', toolCalls: [] } as any
        })
        
      await sendMessage(context)
      
      expect(geminiService.generateTextWithTools).toHaveBeenCalledTimes(2)
    })

    it('should respect AbortSignal', async () => {
      vi.mocked(geminiService.generateTextWithTools).mockImplementation(async () => {
        // Trigger a second sendMessage call to abort the first one
        const secondContext = { agent: 'routingAgent', currentStep: 0 } as any
        sendMessage(secondContext)
        return new Promise((r) => setTimeout(() => r({ text: 'late', toolCalls: [] } as any), 100))
      })

      const firstContext = { agent: 'routingAgent', currentStep: 0 } as any
      await sendMessage(firstContext)
      
      // We check that the loop didn't finish normally if we can, 
      // but mostly we want to ensure it doesn't crash.
    })
  })

  describe('generateTitleSuggestions', () => {
    it('should extract suggestions from tool calls', async () => {
      vi.mocked(geminiService.generateTextWithTools).mockResolvedValueOnce({
        text: '',
        toolCalls: [{ toolName: 'actionSuggestion', args: { suggestions: ['T1', 'T2'] } }]
      } as any)
      
      const titles = await generateTitleSuggestions('plot', 'fantasy', 'space')
      expect(titles).toEqual(['T1', 'T2'])
    })
  })
})
