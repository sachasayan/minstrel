import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies BEFORE importing chatService
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

import { sendMessage, generateTitleSuggestions } from './chatService'
import geminiService from './llmService'
import { store } from '@/lib/store/store'
import { handleWriteFile } from './toolHandlers'

describe('chatService', () => {
  const mockDispatch = vi.fn()

  const mockState = {
    projects: { activeProject: { title: 'Test', files: [], storyContent: '' } },
    settings: { googleApiKey: 'key', provider: 'google', highPreferenceModelId: 'h', lowPreferenceModelId: 'l' },
    chat: { chatHistory: [] }
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(store.getState).mockReturnValue(mockState)
  })

  describe('sendMessage', () => {
    const mockStreamingResult = async (text: string, toolCalls: any[] = [], tools: any) => {
      // Simulate tool execution
      for (const call of toolCalls) {
        if (tools[call.toolName] && tools[call.toolName].execute) {
          await tools[call.toolName].execute(call.args)
        }
      }

      const result = {
        text,
        toolCalls: Promise.resolve(toolCalls),
        textStream: (async function* () {
          yield text
        })(),
      }

      return result as any
    }

    it('should iterate and call tool-triggered side-effects', async () => {
      const context = { agent: 'writerAgent', currentStep: 0 } as any
      
      vi.mocked(geminiService.streamTextWithTools).mockImplementationOnce(async (_s, _sy, _p, tools: any) => {
        return mockStreamingResult('AI reasoning', [
          { toolName: 'writeFile', args: { file_name: 'test.md', content: 'content' } }
        ], tools) as any
      })
      
      const promptData = {
        activeProject: mockState.projects.activeProject,
        chatHistory: mockState.chat.chatHistory
      }
      await sendMessage(context, promptData, mockState.settings, mockDispatch)
      
      expect(geminiService.streamTextWithTools).toHaveBeenCalledOnce()
      expect(handleWriteFile).toHaveBeenCalledWith(
        'test.md',
        'content',
        mockDispatch,
        mockState.projects.activeProject
      )
    })

    it('should iterate when routeTo is called', async () => {
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      
      let callCount = 0
      vi.mocked(geminiService.streamTextWithTools).mockImplementation(async (_settings, _system, _userPrompt, tools: any) => {
        callCount++
        if (callCount === 1) {
          // Trigger the routeTo tool callback, which sets nextAgent inside chatService
          if (tools.routeTo?.execute) {
            await tools.routeTo.execute({ agent: 'writerAgent' })
          }
          return {
            text: '',
            toolCalls: Promise.resolve([{ toolName: 'routeTo', args: { agent: 'writerAgent' } }]),
            textStream: (async function* () {})(),
          } as any
        }
        // Second call: writerAgent produces a final response, no further routing
        return {
          text: 'Done',
          toolCalls: Promise.resolve([]),
          textStream: (async function* () { yield 'Done' })(),
        } as any
      })
        
      const promptData = {
        activeProject: mockState.projects.activeProject,
        chatHistory: mockState.chat.chatHistory
      }
      await sendMessage(context, promptData, mockState.settings, mockDispatch)
      
      // Should have called the LLM twice: once for routing, once for the writerAgent
      expect(geminiService.streamTextWithTools).toHaveBeenCalledTimes(2)
    })

    it('should respect AbortSignal', async () => {
      let firstCall = true
      vi.mocked(geminiService.streamTextWithTools).mockImplementation(async (_s, _p, tools: any) => {
        if (firstCall) {
          firstCall = false
          const secondContext = { agent: 'routingAgent', currentStep: 0 } as any
          const promptData = {
            activeProject: mockState.projects.activeProject,
            chatHistory: mockState.chat.chatHistory
          }
          sendMessage(secondContext, promptData, mockState.settings, mockDispatch)
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(mockStreamingResult('late', [], tools))
            }, 100)
          }) as any
        }
        return mockStreamingResult('second', [], tools) as any
      })

      const firstContext = { agent: 'routingAgent', currentStep: 0 } as any
      const promptData = {
        activeProject: mockState.projects.activeProject,
        chatHistory: mockState.chat.chatHistory
      }
      await sendMessage(firstContext, promptData, mockState.settings, mockDispatch)
    })
  })

  describe('generateTitleSuggestions', () => {
    it('should extract suggestions from tool calls', async () => {
      vi.mocked(geminiService.generateTextWithTools).mockResolvedValueOnce({
        text: '',
        toolCalls: [{ toolName: 'actionSuggestion', args: { suggestions: 'T1, T2' } }]
      } as any)
      
      const titles = await generateTitleSuggestions('plot', 'fantasy', 'space')
      expect(titles).toEqual(['T1', 'T2'])
    })

    it('should return empty array when no suggestions tool call is present', async () => {
      vi.mocked(geminiService.generateTextWithTools).mockResolvedValueOnce({
        text: 'Some text response',
        toolCalls: []
      } as any)

      const titles = await generateTitleSuggestions('plot', 'fantasy', 'space')
      expect(titles).toEqual([])
    })
  })
})
