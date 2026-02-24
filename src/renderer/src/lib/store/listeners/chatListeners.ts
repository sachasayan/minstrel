import { createListenerMiddleware } from '@reduxjs/toolkit'
import { sendMessage } from '@/lib/services/chatService'
import { addChatMessage } from '@/lib/store/chatSlice'
import { RequestContext } from '@/types'
import { RootState, AppDispatch } from '../store'

export const chatListeners = createListenerMiddleware()

chatListeners.startListening({
  actionCreator: addChatMessage,
  effect: async (action, listenerApi) => {
    if (action.payload.sender === 'User') {
      const state = listenerApi.getState() as RootState
      const blankContext: RequestContext = {
        currentStep: 0,
        agent: 'routingAgent'
      }
      const promptData = {
        activeProject: state.projects.activeProject,
        chatHistory: state.chat.chatHistory
      }
      sendMessage(blankContext, promptData, state.settings, listenerApi.dispatch as AppDispatch)
    }
  }
})
