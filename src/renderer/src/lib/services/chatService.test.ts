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

vi.mock('@/lib/bridge', () => ({
  bridge: {
    exportAgentTrace: vi.fn().mockResolvedValue({ accepted: false, destination: 'noop', spanCount: 0 })
  }
}))

vi.mock('./toolHandlers', () => ({
  handleWriteFile: vi.fn(),
  handleCritique: vi.fn(),
  handleMessage: vi.fn(),
  handleActionSuggestions: vi.fn()
}))

vi.mock('@/lib/store/chatSlice', () => ({
  resolvePendingChat: vi.fn(() => ({ type: 'chat/resolvePendingChat' }))
}))

vi.mock('@/lib/store/projectsSlice', () => ({
  setPendingFiles: vi.fn((files) => ({ type: 'projects/setPendingFiles', payload: files }))
}))

import { sendMessage, generateTitleSuggestions } from './chatService'
import geminiService from './llmService'
import { store } from '@/lib/store/store'
import { handleMessage, handleWriteFile } from './toolHandlers'
import { resolvePendingChat } from '@/lib/store/chatSlice'
import { setPendingFiles } from '@/lib/store/projectsSlice'
import { agentTraceService } from './agentTraceService'
import { bridge } from '@/lib/bridge'

describe('chatService', () => {
  const mockDispatch = vi.fn()

  const mockState = {
    projects: { activeProject: { title: 'Test', projectPath: '/projects/test.mns', files: [], storyContent: '' } },
    settings: { googleApiKey: 'key', provider: 'google', highPreferenceModelId: 'h', lowPreferenceModelId: 'l' },
    chat: { chatHistory: [] }
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(store.getState).mockReturnValue(mockState)
    agentTraceService.clear()
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
      const context = { agent: 'storyAgent', currentStep: 0 } as any
      
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
      expect(geminiService.streamTextWithTools).toHaveBeenCalledWith(
        mockState.settings,
        expect.any(String),
        expect.any(Array),
        expect.any(Object),
        'high'
      )
      expect(handleWriteFile).toHaveBeenCalledTimes(1)
      expect(handleWriteFile).toHaveBeenCalledWith(
        'test.md',
        'content',
        expect.any(Function),
        mockState.projects.activeProject
      )

      const trace = agentTraceService.getRecentTraces()[0]
      expect(trace.status).toBe('completed')
      expect(trace.steps).toHaveLength(1)
      expect(trace.steps[0]?.toolCalls[0]?.toolName).toBe('writeFile')
      expect(trace.steps[0]?.prompt.metadata.agent).toBe('storyAgent')
      expect(bridge.exportAgentTrace).toHaveBeenCalledTimes(1)
      expect(vi.mocked(bridge.exportAgentTrace).mock.calls[0]?.[0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'agent.run.storyAgent' })
        ])
      )
    })

    it('should add a continuation message when a write-only turn returns no text', async () => {
      const context = { agent: 'storyAgent', currentStep: 0 } as any

      vi.mocked(geminiService.streamTextWithTools).mockImplementationOnce(async (_s, _sy, _p, tools: any) => {
        return mockStreamingResult('', [
          { toolName: 'writeFile', args: { file_name: 'test.md', content: 'content' } }
        ], tools) as any
      })

      const promptData = {
        activeProject: mockState.projects.activeProject,
        chatHistory: mockState.chat.chatHistory
      }
      await sendMessage(context, promptData, mockState.settings, mockDispatch)

      expect(handleMessage).toHaveBeenCalledWith(
        expect.stringContaining("What should we tackle next?"),
        expect.any(Function)
      )
    })

    it('should iterate when readFile is called', async () => {
      const loadedState = {
        ...mockState,
        projects: {
          activeProject: {
            ...mockState.projects.activeProject,
            files: [{ title: 'Outline', content: 'Outline body' }],
            storyContent: '# <!-- id: ch1 --> Chapter 1\nChapter body'
          }
        }
      } as any

      vi.mocked(store.getState).mockReturnValue(loadedState)

      const context = { agent: 'storyAgent', currentStep: 0 } as any
      
      let callCount = 0
      vi.mocked(geminiService.streamTextWithTools).mockImplementation(async (_settings, _system, _userPrompt, tools: any) => {
        callCount++
        if (callCount === 1) {
          if (tools.readFile?.execute) {
            await tools.readFile.execute({ file_names: 'Outline, <!-- id: ch1 --> Chapter 1' })
          }
          return {
            text: 'Checking the outline and existing chapter first.',
            toolCalls: Promise.resolve([{ toolName: 'readFile', args: { file_names: 'Outline, <!-- id: ch1 --> Chapter 1' } }]),
            textStream: (async function* () {})(),
          } as any
        }
        return {
          text: 'Done',
          toolCalls: Promise.resolve([]),
          textStream: (async function* () { yield 'Done' })(),
        } as any
      })
        
      const promptData = {
        activeProject: loadedState.projects.activeProject,
        chatHistory: loadedState.chat.chatHistory
      }
      await sendMessage(context, promptData, mockState.settings, mockDispatch)
      
      // Should have called the LLM twice: once to request files, once to continue with them
      expect(geminiService.streamTextWithTools).toHaveBeenCalledTimes(2)
      expect(vi.mocked(geminiService.streamTextWithTools).mock.calls[1]?.[4]).toBe('high')

      const trace = agentTraceService.getRecentTraces()[0]
      expect(trace.steps).toHaveLength(2)
      expect(trace.steps[0]?.nextRequestedFiles).toEqual(['Outline', '<!-- id: ch1 --> Chapter 1'])
      expect(trace.steps[1]?.agent).toBe('storyAgent')
    })

    it('should stop with an error when requested files cannot be provided', async () => {
      const missingState = {
        ...mockState,
        projects: {
          activeProject: {
            ...mockState.projects.activeProject,
            files: [{ title: 'Outline', content: 'Outline body' }],
            storyContent: '# <!-- id: actual-ch1 --> Chapter 1\nChapter body'
          }
        }
      } as any

      vi.mocked(store.getState).mockReturnValue(missingState)

      const context = {
        agent: 'storyAgent',
        currentStep: 1,
        requestedFiles: ['missing-id', 'Outline']
      } as any

      const promptData = {
        activeProject: missingState.projects.activeProject,
        chatHistory: missingState.chat.chatHistory
      }

      await sendMessage(context, promptData, missingState.settings, mockDispatch)

      expect(geminiService.streamTextWithTools).not.toHaveBeenCalled()
      expect(handleMessage).toHaveBeenCalledWith(
        expect.stringContaining("I couldn't continue safely because I didn't receive all of the files I asked for: missing-id."),
        expect.any(Function)
      )

      const trace = agentTraceService.getRecentTraces()[0]
      expect(trace.status).toBe('error')
      expect(trace.errorMessage).toContain('missing-id')
      expect(trace.events.some((event) => event.type === 'requested_files_missing')).toBe(true)
    })

    it('should respect AbortSignal', async () => {
      let firstCall = true
      vi.mocked(geminiService.streamTextWithTools).mockImplementation(async (_s, _p, _m, tools: any) => {
        if (firstCall) {
          firstCall = false
          const secondContext = { agent: 'storyAgent', currentStep: 0 } as any
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

      const firstContext = { agent: 'storyAgent', currentStep: 0 } as any
      const promptData = {
        activeProject: mockState.projects.activeProject,
        chatHistory: mockState.chat.chatHistory
      }
      await sendMessage(firstContext, promptData, mockState.settings, mockDispatch)

      // Verify cleanup was dispatched twice (once for each sendMessage call)
      expect(mockDispatch).toHaveBeenCalledWith(setPendingFiles(null))
      expect(mockDispatch).toHaveBeenCalledWith(resolvePendingChat())
    })

    it('should discard assistant output after switching projects', async () => {
      let currentState = mockState

      vi.mocked(store.getState).mockImplementation(() => currentState as any)
      vi.mocked(geminiService.streamTextWithTools).mockImplementationOnce(async () => ({
        text: Promise.resolve('Late response'),
        toolCalls: Promise.resolve([]),
        textStream: (async function* () {
          currentState = {
            ...mockState,
            projects: {
              activeProject: {
                title: 'Other',
                projectPath: '/projects/other.mns',
                files: [],
                storyContent: ''
              }
            }
          } as any
          yield 'Late response'
        })()
      }) as any)

      const context = { agent: 'storyAgent', currentStep: 0, projectPath: '/projects/test.mns' } as any
      const promptData = {
        activeProject: mockState.projects.activeProject,
        chatHistory: mockState.chat.chatHistory
      }

      await sendMessage(context, promptData, mockState.settings, mockDispatch)

      expect(handleMessage).not.toHaveBeenCalled()
      expect(mockDispatch).toHaveBeenCalledWith(setPendingFiles(null))
      expect(mockDispatch).toHaveBeenCalledWith(resolvePendingChat())

      const trace = agentTraceService.getRecentTraces()[0]
      expect(trace.status).toBe('stale_project')
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
