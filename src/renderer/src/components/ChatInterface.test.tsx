// @vitest-environment jsdom

import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { createRoot, Root } from 'react-dom/client'

import ChatInterface from './ChatInterface'
import appStateReducer from '@/lib/store/appStateSlice'
import projectsReducer, { startNewProject } from '@/lib/store/projectsSlice'
import chatReducer, { addChatMessage, clearChatHistory, resolvePendingChat } from '@/lib/store/chatSlice'
import settingsReducer from '@/lib/store/settingsSlice'

vi.mock('@/lib/services/streamingService', () => ({
  streamingService: {
    subscribeToText: () => () => {},
    subscribeToStatus: () => () => {}
  }
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, layout: _layout, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, layout: _layout, ...props }: any) => <span {...props}>{children}</span>
  }
}))

describe('ChatInterface floating new-project controls', () => {
  let container: HTMLDivElement
  let root: Root

  const flushPromises = async () => {
    await Promise.resolve()
    await Promise.resolve()
  }

  const createStore = () =>
    configureStore({
      reducer: {
        appState: appStateReducer,
        projects: projectsReducer,
        chat: chatReducer,
        settings: settingsReducer
      }
    })

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
    }

    ;(globalThis as any).ResizeObserver = ResizeObserverMock
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.clearAllMocks()
  })

  it('shows a cancel button for the floating unsaved new-project state', async () => {
    const store = createStore()

    await act(async () => {
      store.dispatch(startNewProject())
      store.dispatch(clearChatHistory())
      root.render(
        <Provider store={store}>
          <ChatInterface />
        </Provider>
      )
      await flushPromises()
    })

    expect(container.textContent).toContain('Cancel')
  })

  it('returns to intro when the floating-state cancel button is clicked', async () => {
    const store = createStore()

    await act(async () => {
      store.dispatch(startNewProject())
      store.dispatch(clearChatHistory())
      root.render(
        <Provider store={store}>
          <ChatInterface />
        </Provider>
      )
      await flushPromises()
    })

    const cancelButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Cancel')
    expect(cancelButton).toBeTruthy()

    await act(async () => {
      cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await flushPromises()
    })

    expect(store.getState().appState.activeView).toBe('intro')
    expect(store.getState().projects.activeProject).toBeNull()
  })

  it('hides the cancel button after the first response completes', async () => {
    const store = createStore()

    await act(async () => {
      store.dispatch(startNewProject())
      store.dispatch(clearChatHistory())
      store.dispatch(addChatMessage({ sender: 'User', text: 'Start a mystery novel.' }))
      store.dispatch(addChatMessage({ sender: 'Gemini', text: 'Here is a premise.' }))
      store.dispatch(resolvePendingChat())
      root.render(
        <Provider store={store}>
          <ChatInterface />
        </Provider>
      )
      await flushPromises()
    })

    expect(container.textContent).not.toContain('Cancel')
  })

  it('renders basic markdown formatting for agent messages', async () => {
    const store = createStore()

    await act(async () => {
      store.dispatch(clearChatHistory())
      store.dispatch(addChatMessage({ sender: 'Gemini', text: 'Use **bold** and *italics* here.' }))
      root.render(
        <Provider store={store}>
          <ChatInterface />
        </Provider>
      )
      await flushPromises()
    })

    const strong = container.querySelector('strong')
    const em = container.querySelector('em')

    expect(strong?.textContent).toBe('bold')
    expect(em?.textContent).toBe('italics')
    expect(container.textContent).toContain('Use bold and italics here.')
  })
})
