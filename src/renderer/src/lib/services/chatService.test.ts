import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMessage, generateTitleSuggestions } from './chatService'
import geminiService from './llmService'
import { store } from '@/lib/store/store'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('./llmService', () => ({
  default: {
    generateContent: vi.fn()
  }
}))

vi.mock('@/lib/store/store', () => ({
  store: {
    dispatch: vi.fn(),
    getState: vi.fn(() => ({
      projects: { activeProject: null },
      settings: { highPreferenceModelId: 'h', lowPreferenceModelId: 'l' }
    }))
  }
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}))

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default state mock
    vi.mocked(store.getState).mockReturnValue({
      projects: { activeProject: { title: 'Test', files: [], storyContent: '' } },
      settings: { highPreferenceModelId: 'h', lowPreferenceModelId: 'l' },
      chat: { chatHistory: [] }
    } as any)
  })

  describe('sendMessage', () => {
    it('should handle routingAgent correctly (base case)', async () => {
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      const mockResponse = '<message>Hello from AI</message><route_to>routingAgent</route_to>'
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce(mockResponse)
      
      await sendMessage(context)
      
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'chat/addChatMessage',
        payload: { sender: 'Gemini', text: 'Hello from AI' }
      }))
    })

    it('should recurse when route_to is different', async () => {
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      // First call routes to criticAgent
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce('<route_to>criticAgent</route_to>')
      // Second call (recursion) returns base case
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce('<message>Recursive reply</message>')
      
      await sendMessage(context)
      
      expect(geminiService.generateContent).toHaveBeenCalledTimes(2)
    })

    it('should throw error and toast if recursion depth > 5', async () => {
      const context = { agent: 'routingAgent', currentStep: 6 } as any
      await expect(sendMessage(context)).rejects.toThrow('Recursion depth exceeded')
      expect(toast.error).toHaveBeenCalled()
    })

    it('should parse <write_file> and dispatch update', async () => {
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      const mockResponse = '<write_file><file_name>Note.md</file_name><content>Content</content></write_file>'
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce(mockResponse)
      
      await sendMessage(context)
      
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'projects/updateFile',
        payload: expect.objectContaining({ title: 'Note.md' })
      }))
    })

    it('should debounce and retry on "resource exhausted" error', async () => {
      vi.useFakeTimers()
      const context = { agent: 'routingAgent', currentStep: 0 } as any
      
      vi.mocked(geminiService.generateContent)
        .mockRejectedValueOnce(new Error('resource exhausted'))
        .mockResolvedValueOnce('<message>Retried</message>')
      
      const promise = sendMessage(context)
      await vi.runAllTimersAsync()
      await promise
      
      expect(geminiService.generateContent).toHaveBeenCalledTimes(2)
      vi.useRealTimers()
    })
  })

  describe('generateTitleSuggestions', () => {
    it('should parse XML titles into array', async () => {
      const mockResponse = '<titles><title>T1</title><title>T2</title></titles>'
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce(mockResponse)
      
      const titles = await generateTitleSuggestions('plot', 'fantasy', 'space')
      expect(titles).toEqual(['T1', 'T2'])
    })

    it('should return empty array on failure', async () => {
      vi.mocked(geminiService.generateContent).mockRejectedValueOnce(new Error('API fail'))
      const titles = await generateTitleSuggestions('plot', 'fantasy', 'space')
      expect(titles).toEqual([])
    })
  })
})
