import { createListenerMiddleware } from '@reduxjs/toolkit';
// import { sendMessage } from '@/lib/chatManager';
// import { startSendMessage } from '../chatSlice';

export const chatListeners = createListenerMiddleware();

// chatListeners.startListening({
//   actionCreator: startSendMessage,
//   effect: async (action) => {
//     sendMessage(action.payload);
//   },
// });
