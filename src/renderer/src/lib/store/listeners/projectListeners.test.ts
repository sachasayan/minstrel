import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import appStateReducer from '../appStateSlice'
import projectsReducer, { startNewProject } from '../projectsSlice'
import chatReducer from '../chatSlice'
import { projectListeners } from './projectListeners'

vi.mock('@/lib/services/chatService', () => ({
  cancelActiveChatRequest: vi.fn()
}))

vi.mock('@/lib/coverImage', () => ({
  convertImagePathToBase64: vi.fn().mockResolvedValue({
    base64: null,
    mimeType: null
  })
}))

describe('projectListeners', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  function makeStore() {
    return configureStore({
      reducer: {
        appState: appStateReducer,
        projects: projectsReducer,
        chat: chatReducer
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(projectListeners.middleware)
    })
  }

  it('routes a new project into the editor view', async () => {
    const store = makeStore()

    store.dispatch(startNewProject())
    await vi.runAllTimersAsync()

    expect(store.getState().appState.activeView).toBe('project/editor')
    expect(store.getState().projects.activeProject?.projectPath).toBe('')
    expect(store.getState().projects.activeProject?.title).toBe('Untitled Project')
  })
})
