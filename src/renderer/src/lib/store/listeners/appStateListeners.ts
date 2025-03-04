import { createListenerMiddleware, isAnyOf, ListenerEffect } from '@reduxjs/toolkit'
import { setActiveFile } from '../appStateSlice'
import { updateMetaProperty } from '../projectsSlice'

export const appStateListeners = createListenerMiddleware()

// Listen for changes to the active project — if it's a new project, fetch and update the projects state
appStateListeners.startListening({
  matcher: isAnyOf(setActiveFile),
  effect: async (action, listenerApi: ListenerEffect) => {
    const state = listenerApi.getState().projects.activeProject

    const wordCountCurrent = state.files
      .filter((file) => file.title.startsWith('Chapter'))
      .map((file) => ({
        chapterWordCount: file.content.split(/\s+/).length
      })).reduce((acc, chapter) => acc + chapter.chapterWordCount, 0)

      listenerApi.dispatch(updateMetaProperty({ property: 'wordCountCurrent', value: wordCountCurrent }))

  }
})

