// @vitest-environment jsdom

import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { createRoot, Root } from 'react-dom/client'

import App from './App'
import appStateReducer, { setActiveView } from '@/lib/store/appStateSlice'
import settingsReducer from '@/lib/store/settingsSlice'
import projectsReducer, { setActiveProject, startNewProject } from '@/lib/store/projectsSlice'
import chatReducer from '@/lib/store/chatSlice'
import { bridge } from '@/lib/bridge'

vi.mock('@/lib/bridge', () => ({
  bridge: {
    getAppSettings: vi.fn()
  }
}))

vi.mock('@/pages/Intro', () => ({
  default: () => <div data-testid="intro-page">Intro</div>
}))

vi.mock('@/pages/ProjectOverview', () => ({
  default: () => <div data-testid="project-page">Project</div>
}))

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>
}))

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => null
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('App route transitions', () => {
  let container: HTMLDivElement
  let root: Root

  const renderApp = async () => {
    const store = configureStore({
      reducer: {
        appState: appStateReducer,
        settings: settingsReducer,
        projects: projectsReducer,
        chat: chatReducer
      }
    })

    await act(async () => {
      root.render(
        <Provider store={store}>
          <App />
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
    vi.mocked(bridge.getAppSettings).mockResolvedValue({})
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.clearAllMocks()
  })

  it('uses the intro route key on first render', async () => {
    await renderApp()

    const routeShell = container.querySelector('[data-testid="app-route-transition"]')
    expect(routeShell?.getAttribute('data-route-key')).toBe('intro')
    expect(container.querySelector('[data-testid="intro-page"]')).toBeTruthy()
  })

  it('uses the saved project path in the route key for existing projects', async () => {
    const store = await renderApp()

    await act(async () => {
      store.dispatch(
        setActiveProject({
          projectPath: '/tmp/existing-project.mns',
          title: 'Existing',
          genre: 'fantasy',
          wordCountTarget: 80000,
          wordCountCurrent: 0,
          storyContent: '',
          files: [],
          summary: '',
          year: 2026,
          expertSuggestions: [],
          knowledgeGraph: null,
          chatHistory: []
        } as any)
      )
      store.dispatch(setActiveView('project/editor'))
      await flushPromises()
    })

    const routeShell = container.querySelector('[data-testid="app-route-transition"]')
    expect(routeShell?.getAttribute('data-route-key')).toBe('project/editor:/tmp/existing-project.mns')
    expect(container.querySelector('[data-testid="project-page"]')).toBeTruthy()
  })

  it('uses the new-project fallback key for unsaved projects', async () => {
    const store = await renderApp()

    await act(async () => {
      store.dispatch(startNewProject())
      store.dispatch(setActiveView('project/editor'))
      await flushPromises()
    })

    const routeShell = container.querySelector('[data-testid="app-route-transition"]')
    expect(routeShell?.getAttribute('data-route-key')).toBe('project/editor:new-project')
    expect(container.querySelector('[data-testid="project-page"]')).toBeTruthy()
  })
})
