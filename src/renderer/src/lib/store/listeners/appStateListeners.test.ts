import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import appStateReducer from '../appStateSlice'
import projectsReducer, { setActiveProject, updateFile } from '../projectsSlice'
import { calculateWordCount } from '@/lib/storyContent'
import { appStateListeners } from './appStateListeners'

describe('appStateListeners', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-09T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function makeStore() {
    return configureStore({
      reducer: {
        appState: appStateReducer,
        projects: projectsReducer
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(appStateListeners.middleware)
    })
  }

  it('hydrates derived word counts when a project becomes active', () => {
    const store = makeStore()

    store.dispatch(
      setActiveProject({
        projectPath: '/tmp/test.mns',
        title: 'Test',
        genre: 'fantasy',
        wordCountTarget: 80000,
        wordCountCurrent: 0,
        storyContent: '# Chapter 1\nOne two three',
        files: [],
        summary: '',
        year: 2026,
        expertSuggestions: [],
        knowledgeGraph: null
      } as any)
    )

    const project = store.getState().projects.activeProject
    expect(store.getState().projects.projectHasLiveEdits).toBe(false)
    const expectedWordCount = calculateWordCount(project?.storyContent ?? '')
    expect(project?.wordCountCurrent).toBe(expectedWordCount)
    expect(project?.wordCountHistorical).toEqual([{ date: '2026-03-09', wordCount: expectedWordCount }])
  })

  it('updates the same-day history entry when story content changes', () => {
    const store = makeStore()

    store.dispatch(
      setActiveProject({
        projectPath: '/tmp/test.mns',
        title: 'Test',
        genre: 'fantasy',
        wordCountTarget: 80000,
        wordCountCurrent: 0,
        storyContent: '# Chapter 1\nOne two three',
        files: [],
        summary: '',
        year: 2026,
        expertSuggestions: [],
        knowledgeGraph: null
      } as any)
    )

    store.dispatch(
      updateFile({
        title: 'Story',
        content: '# Chapter 1\nOne two three four five six',
        chapterIndex: 0
      } as any)
    )

    const project = store.getState().projects.activeProject
    const expectedWordCount = calculateWordCount(project?.storyContent ?? '')
    expect(project?.wordCountCurrent).toBe(expectedWordCount)
    expect(project?.wordCountHistorical).toEqual([{ date: '2026-03-09', wordCount: expectedWordCount }])
  })
})
