import { describe, it, expect } from 'vitest'
import reducer, {
  setChatHistory,
  clearChatHistory,
  addChatMessage,
  resolvePendingChat,
  setActionSuggestions
} from './chatSlice'
import { ChatMessage } from '@/types'

describe('chatSlice', () => {
  const initialState = {
    chatHistory: [] as ChatMessage[],
    pendingChat: false,
    actionSuggestions: [] as string[]
  }

  it('should return initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle setChatHistory', () => {
    const history: ChatMessage[] = [{ sender: 'User', text: 'Hello' }]
    const actual = reducer(initialState, setChatHistory(history))
    expect(actual.chatHistory).toEqual(history)
  })

  it('should handle addChatMessage and limit history to 20', () => {
    let state = initialState
    for (let i = 0; i < 25; i++) {
      state = reducer(state, addChatMessage({ sender: 'AI', text: `Message ${i}` }))
    }
    expect(state.chatHistory).toHaveLength(20)
    expect(state.chatHistory[0].text).toBe('Message 5')
    expect(state.chatHistory[19].text).toBe('Message 24')
  })

  it('should set pendingChat to true when User sends a message', () => {
    const actual = reducer(initialState, addChatMessage({ sender: 'User', text: 'Hi' }))
    expect(actual.pendingChat).toBe(true)
    expect(actual.actionSuggestions).toEqual([])
  })

  it('should handle resolvePendingChat', () => {
    const state = { ...initialState, pendingChat: true }
    const actual = reducer(state, resolvePendingChat())
    expect(actual.pendingChat).toBe(false)
  })

  it('should handle clearChatHistory', () => {
    const state = {
      chatHistory: [{ sender: 'User', text: 'Old' }],
      pendingChat: true,
      actionSuggestions: ['Suggest']
    }
    const actual = reducer(state, clearChatHistory())
    expect(actual.chatHistory).toHaveLength(1)
    expect(actual.chatHistory[0].sender).toBe('Gemini')
    expect(actual.pendingChat).toBe(false)
    expect(actual.actionSuggestions).toEqual([])
  })

  it('should handle setActionSuggestions', () => {
    const suggestions = ['Try this', 'Or that']
    const actual = reducer(initialState, setActionSuggestions(suggestions))
    expect(actual.actionSuggestions).toEqual(suggestions)
  })
})
