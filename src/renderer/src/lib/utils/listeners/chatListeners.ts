import { createListenerMiddleware } from '@reduxjs/toolkit'
import { sendMessage } from '@/lib/chatManager';
import { addChatMessage } from '../chatSlice';

export const chatListeners = createListenerMiddleware()

chatListeners.startListening({
  actionCreator: addChatMessage,
  effect: async (action) => {
    if (action.payload.sender === "User") {sendMessage(undefined, 0)};
  },
});
