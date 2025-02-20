import { configureStore } from '@reduxjs/toolkit'
import settingsReducer from './settingsSlice'
import projectsReducer from './projectsSlice'
import appStateReducer from './appStateSlice'
import chatReducer from './chatSlice'
import { appStateListeners } from './listeners/appStateListeners'
import { settingsListeners } from './listeners/settingsListeners'
import { projectListeners } from './listeners/projectListeners'
import { chatListeners } from './listeners/chatListeners'

export const store = configureStore({
  reducer: {
    appState: appStateReducer,
    settings: settingsReducer,
    projects: projectsReducer,
    chat: chatReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(appStateListeners.middleware, projectListeners.middleware, settingsListeners.middleware, chatListeners.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
