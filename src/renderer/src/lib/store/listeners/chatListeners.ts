import { createListenerMiddleware } from '@reduxjs/toolkit'
import { sendMessage } from '@/lib/services/chatService'
import { addChatMessage } from '../chatSlice'
import { RequestContext } from '@/types'

export const chatListeners = createListenerMiddleware()

chatListeners.startListening({
  actionCreator: addChatMessage,
  effect: async (action, listenerApi) => {
    if (action.payload.sender === 'User') {
      const state = listenerApi.getState()
      const blankContext: RequestContext = {
        currentStep: 0,
        agent: 'routingAgent'
      }
      const promptData = {
        activeProject: state.projects.activeProject,
        chatHistory: state.chat.chatHistory
      }
      sendMessage(blankContext, promptData, state.settings)
    }
  }
})
