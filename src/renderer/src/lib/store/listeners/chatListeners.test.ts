import { describe, expect, it, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import settingsReducer from '../settingsSlice'
import projectsReducer, { setActiveProject } from '../projectsSlice'
import appStateReducer from '../appStateSlice'
import chatReducer, { addChatMessage } from '../chatSlice'
import { chatListeners } from './chatListeners'

vi.mock('@/lib/services/chatService', () => ({
  sendMessage: vi.fn()
}))

import { sendMessage } from '@/lib/services/chatService'

describe('chatListeners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeStore() {
    return configureStore({
      reducer: {
        appState: appStateReducer,
        settings: settingsReducer,
        projects: projectsReducer,
        chat: chatReducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(chatListeners.middleware)
    })
  }

  it('starts the routing agent when a user message is added', async () => {
    const store = makeStore()

    store.dispatch(setActiveProject({
      projectPath: '/tmp/story.mns',
      title: 'Story',
      genre: 'fantasy',
      wordCountTarget: 80000,
      wordCountCurrent: 0,
      storyContent: '',
      files: [],
      summary: '',
      year: 2026,
      expertSuggestions: [],
      knowledgeGraph: null
    } as any))

    store.dispatch(addChatMessage({
      sender: 'User',
      text: 'Write chapter one'
    }))

    await Promise.resolve()

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        currentStep: 0,
        agent: 'routingAgent',
        projectPath: '/tmp/story.mns'
      },
      expect.objectContaining({
        activeProject: expect.objectContaining({
          projectPath: '/tmp/story.mns'
        }),
        chatHistory: expect.arrayContaining([
          expect.objectContaining({
            sender: 'User',
            text: 'Write chapter one'
          })
        ])
      }),
      store.getState().settings,
      expect.any(Function)
    )
  })

  it('ignores non-user messages', async () => {
    const store = makeStore()

    store.dispatch(addChatMessage({
      sender: 'Gemini',
      text: 'Here is a draft.'
    }))

    await Promise.resolve()

    expect(sendMessage).not.toHaveBeenCalled()
  })
})
