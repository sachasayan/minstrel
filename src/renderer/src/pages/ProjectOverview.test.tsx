// @vitest-environment jsdom

import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { createRoot, Root } from 'react-dom/client'

import ProjectOverview from './ProjectOverview'
import appStateReducer, { setActiveView } from '@/lib/store/appStateSlice'
import projectsReducer, { startNewProject } from '@/lib/store/projectsSlice'
import chatReducer, { addChatMessage, resolvePendingChat } from '@/lib/store/chatSlice'
import settingsReducer from '@/lib/store/settingsSlice'

vi.mock('@/components/editor/StoryViewer', () => ({
  StoryViewer: () => <div data-testid="story-viewer">Story</div>
}))

vi.mock('@/components/ChatInterface', () => ({
  default: () => <div data-testid="chat-interface">Chat</div>
}))

vi.mock('@/components/CommandPalette', () => ({
  default: () => <div data-testid="command-palette">Palette</div>
}))

vi.mock('@/components/StatusBar', () => ({
  default: () => <div data-testid="status-bar">Status</div>
}))

vi.mock('@/components/ProjectBar', () => ({
  default: () => <div data-testid="project-bar">ProjectBar</div>
}))

describe('ProjectOverview new project chrome gating', () => {
  let container: HTMLDivElement
  let root: Root

  const flushPromises = async () => {
    await Promise.resolve()
    await Promise.resolve()
  }

  const renderOverview = async () => {
    const store = configureStore({
      reducer: {
        appState: appStateReducer,
        projects: projectsReducer,
        chat: chatReducer,
        settings: settingsReducer
      }
    })

    await act(async () => {
      store.dispatch(startNewProject())
      store.dispatch(setActiveView('project/editor'))
      root.render(
        <Provider store={store}>
          <ProjectOverview />
        </Provider>
      )
      await flushPromises()
    })

    return store
  }

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('shows only chat chrome for a fresh unsaved project', async () => {
    await renderOverview()

    expect(container.querySelector('[data-testid="chat-interface"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="command-palette"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="project-bar"]')).toBeNull()
    expect(container.querySelector('[data-testid="status-bar"]')).toBeNull()
    expect(container.querySelector('[data-testid="story-viewer"]')).toBeNull()
  })

  it('keeps the rest of the project chrome hidden while the first chat turn is pending', async () => {
    const store = await renderOverview()

    await act(async () => {
      store.dispatch(addChatMessage({ sender: 'User', text: 'Help me outline this novel.' }))
      await flushPromises()
    })

    expect(container.querySelector('[data-testid="project-bar"]')).toBeNull()
    expect(container.querySelector('[data-testid="status-bar"]')).toBeNull()
    expect(container.querySelector('[data-testid="story-viewer"]')).toBeNull()
  })

  it('reveals the rest of the project chrome after the first response completes', async () => {
    const store = await renderOverview()

    await act(async () => {
      store.dispatch(addChatMessage({ sender: 'User', text: 'Help me outline this novel.' }))
      store.dispatch(addChatMessage({ sender: 'Gemini', text: 'Let’s sketch the outline.' }))
      store.dispatch(resolvePendingChat())
      await flushPromises()
    })

    expect(container.querySelector('[data-testid="project-bar"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="status-bar"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="story-viewer"]')).toBeTruthy()
  })
})
