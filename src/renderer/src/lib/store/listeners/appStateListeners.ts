import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setActiveFile } from '../appStateSlice'
import { updateMetaProperty } from '../projectsSlice'
import { isChapterFile } from '@/lib/storyContent'
import type { RootState } from '../store'

export const appStateListeners = createListenerMiddleware()

// Listen for changes to the active project — if it's a new project, fetch and update the projects state
appStateListeners.startListening({
  matcher: isAnyOf(setActiveFile),
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState
    const activeProject = state.projects.activeProject
    if (!activeProject) return

    const wordCountCurrent = activeProject.files
      .filter((file) => isChapterFile(file))
      .map((file) => ({
        chapterWordCount: file.content.split(/\s+/).length
      })).reduce((acc, chapter) => acc + chapter.chapterWordCount, 0)

    listenerApi.dispatch(updateMetaProperty({ property: 'wordCountCurrent', value: wordCountCurrent }))
  }
})
