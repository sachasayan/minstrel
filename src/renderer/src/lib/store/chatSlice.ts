import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from './store'

interface ChatMessage {
  sender: 'User' | 'Gemini'
  text: string
}

interface ChatState {
  chatHistory: ChatMessage[]
  pendingChat: boolean
}

const initialState: ChatState = {
  chatHistory: [{ sender: 'Gemini', text: 'Hello there! Ask me anything about your story. I can help you build an outline, write a chapter, and more.' }],
  pendingChat: false
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChatHistory: (state, action: PayloadAction<ChatMessage[]>) => {
      state.chatHistory = action.payload
    },
    resolvePendingChat: (state) => {
      state.pendingChat = false
    },
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      //Chat messages are added to the end of the array
      if (action.payload.sender === 'User') {
        state.pendingChat = true
      }
      state.chatHistory.push(action.payload)
      if (state.chatHistory.length > 20) {
        state.chatHistory = state.chatHistory.slice(-20)
      }
    }
  }
})

export const { setChatHistory, addChatMessage, resolvePendingChat } = chatSlice.actions

export const selectChat = (state: RootState) => state.chat

export default chatSlice.reducer
