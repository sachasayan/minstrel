import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from './store'
import { resolve } from 'path'

interface ChatMessage {
  sender: 'User' | 'Gemini'
  text: string
}

interface ChatState {
  chatHistory: ChatMessage[]
  pendingChat: boolean
}

const initialState: ChatState = {
  chatHistory: [],
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
      state.pendingChat = false;
    },
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      //Chat messages are added to the end of the array
      if (action.payload.sender === 'User') {
        state.pendingChat = true;
      }
      state.chatHistory.push(action.payload)
      if (state.chatHistory.length > 20) {
        state.chatHistory = state.chatHistory.slice(-20)
      }
    }
  }
})

export const { setChatHistory, addChatMessage } = chatSlice.actions

export const selectChat = (state: RootState) => state.chat

export default chatSlice.reducer
