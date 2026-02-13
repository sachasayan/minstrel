import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from './store'
import { ChatMessage } from '@/types'

// Remove local ChatMessage definition as it's now imported

interface ChatState {
  chatHistory: ChatMessage[]
  pendingChat: boolean
  actionSuggestions: string[]
}

const DEFAULT_AGENT_GREETING: ChatMessage = {
  sender: 'Gemini',
  text: 'Hey dreamer. Welcome. What should we write about today?'
}

const initialState: ChatState = {
  chatHistory: [],
  pendingChat: false,
  actionSuggestions: [] // Initialize actionSuggestions as empty array
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChatHistory: (state, action: PayloadAction<ChatMessage[]>) => {
      // Ensure payload conforms to ChatMessage[] from types.ts
      state.chatHistory = action.payload
    },
    clearChatHistory: (state) => {
      state.chatHistory = [DEFAULT_AGENT_GREETING]
      state.pendingChat = false
      state.actionSuggestions = []
    },
    resolvePendingChat: (state) => {
      state.pendingChat = false
    },
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      // Ensure payload conforms to ChatMessage from types.ts
      if (action.payload.sender === 'User') {
        state.actionSuggestions = []
        state.pendingChat = true
      }
      state.chatHistory.push(action.payload)

      if (state.chatHistory.length > 20) {
        state.chatHistory = state.chatHistory.slice(-20)
      }
    },
    setActionSuggestions: (state, action: PayloadAction<string[]>) => {
      state.actionSuggestions = action.payload
    }
  }
})

export const { setChatHistory, clearChatHistory, addChatMessage, resolvePendingChat, setActionSuggestions } = chatSlice.actions

// Selector for the whole chat state
export const selectChat = (state: RootState): ChatState => state.chat
// Add specific selector for chatHistory
export const selectChatHistory = (state: RootState): ChatMessage[] => state.chat.chatHistory

export default chatSlice.reducer
