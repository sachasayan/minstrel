import { createListenerMiddleware } from '@reduxjs/toolkit'
import { sendMessage } from '@/lib/services/chatManager'
import { addChatMessage } from '../chatSlice'
import { RequestContext } from '@/types'

export const chatListeners = createListenerMiddleware()

chatListeners.startListening({
  actionCreator: addChatMessage,
  effect: async (action) => {
    if (action.payload.sender === 'User') {
      sendMessage({currentStep: 0})
    }
  }
})
