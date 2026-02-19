import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMessage, generateTitleSuggestions } from './chatService'
import geminiService from './llmService'
import { store } from '@/lib/store/store'
import * as toolHandlers from './toolHandlers'

// Mock dependencies
vi.mock('./llmService', () => ({
  default: {
    generateContent: vi.fn(),
    generateTextWithTools: vi.fn(),
    streamTextWithTools: vi.fn()
  }
}))

vi.mock('./streamingService', () => ({
  streamingService: {
    updateText: vi.fn(),
    updateStatus: vi.fn(),
    clear: vi.fn(),
    subscribeToText: vi.fn(),
    subscribeToStatus: vi.fn()
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
    const mockStreamingResult = (text: string, toolCalls: any[] = [], tools: any) => {
      // Simulate tool execution
      for (const call of toolCalls) {
        if (tools[call.toolName] && tools[call.toolName].execute) {
          tools[call.toolName].execute(call.args)
        }
      }

      const result = {
        text,
        toolCalls: Promise.resolve(toolCalls),
        textStream: (async function* () {
          yield text
        })(),
      }

      return {
        ...result,
        then(onfulfilled: any) {
          return Promise.resolve(result).then(onfulfilled)
        }
      }
    }

    it('should iterate and call tool-triggered side-effects', async () => {
      const context = { agent: 'writerAgent', currentStep: 0 } as any
      
      vi.mocked(geminiService.streamTextWithTools).mockImplementationOnce(async (_p, tools: any) => {
        return mockStreamingResult('AI reasoning', [
          { toolName: 'writeFile', args: { file_name: 'test.md', content: 'content' } }
        ], tools) as any
      })
      
      await sendMessage(context)
      
      expect(geminiService.streamTextWithTools).toHaveBeenCalledOnce()
      expect(toolHandlers.handleWriteFile).toHaveBeenCalledWith('test.md', 'content')
    })

    it('should iterate when routeTo is called', async () => {
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      
      let callCount = 0
      vi.mocked(geminiService.streamTextWithTools).mockImplementation(async (_p, tools: any) => {
        callCount++
        if (callCount === 1) {
          // Manually trigger the tool execution which sets the closure variable nextAgent
          if (tools.routeTo && tools.routeTo.execute) {
            await tools.routeTo.execute({ agent: 'writerAgent' })
          }
          return {
            text: '',
            toolCalls: Promise.resolve([{ toolName: 'routeTo', args: { agent: 'writerAgent' } }]),
            textStream: (async function* () {})(),
            then: (resolve: any) => resolve({ text: '', toolCalls: [{ toolName: 'routeTo', args: { agent: 'writerAgent' } }] })
          } as any
        }
        return {
          text: 'Done',
          toolCalls: Promise.resolve([]),
          textStream: (async function* () { yield 'Done' })(),
          then: (resolve: any) => resolve({ text: 'Done', toolCalls: [] })
        } as any
      })
        
      await sendMessage(context)
      
      expect(geminiService.streamTextWithTools).toHaveBeenCalled()
    })

    it('should respect AbortSignal', async () => {
      let firstCall = true
      vi.mocked(geminiService.streamTextWithTools).mockImplementation(async (_p, tools: any) => {
        if (firstCall) {
          firstCall = false
          const secondContext = { agent: 'routingAgent', currentStep: 0 } as any
          sendMessage(secondContext)
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(mockStreamingResult('late', [], tools))
            }, 100)
          }) as any
        }
        return mockStreamingResult('second', [], tools) as any
      })

      const firstContext = { agent: 'routingAgent', currentStep: 0 } as any
      await sendMessage(firstContext)
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
