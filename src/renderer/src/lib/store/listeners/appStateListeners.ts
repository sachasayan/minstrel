import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setActiveSection } from '../appStateSlice'
import { updateMetaProperty } from '../projectsSlice'
import { calculateWordCount } from '@/lib/storyContent'
import type { RootState } from '../store'

export const appStateListeners = createListenerMiddleware()

// Listen for changes to the active project — if it's a new project, fetch and update the projects state
appStateListeners.startListening({
  matcher: isAnyOf(setActiveSection),
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState
    const activeProject = state.projects.activeProject
    if (!activeProject) return

    const wordCountCurrent = calculateWordCount(activeProject.storyContent)

    listenerApi.dispatch(updateMetaProperty({ property: 'wordCountCurrent', value: wordCountCurrent }))
  }
})
