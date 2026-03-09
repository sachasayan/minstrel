import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setActiveSection } from '../appStateSlice'
import { addChapter, setActiveProject, setWordCountCurrent, setWordCountHistorical, updateChapter, updateFile } from '../projectsSlice'
import { calculateWordCount } from '@/lib/storyContent'
import { updateRollingWordCountHistory } from '@/lib/dashboardUtils'
import type { RootState } from '../store'

export const appStateListeners = createListenerMiddleware()

const syncProjectWordCounts = (listenerApi: { getState: () => unknown; dispatch: (action: unknown) => void }) => {
  const state = listenerApi.getState() as RootState
  const activeProject = state.projects.activeProject
  if (!activeProject) return

  const wordCountCurrent = calculateWordCount(activeProject.storyContent)
  if (activeProject.wordCountCurrent !== wordCountCurrent) {
    listenerApi.dispatch(setWordCountCurrent(wordCountCurrent))
  }

  const nextHistory = updateRollingWordCountHistory({
    ...activeProject,
    wordCountCurrent
  })
  const currentHistory = activeProject.wordCountHistorical ?? []
  const historyChanged =
    nextHistory.length !== currentHistory.length ||
    nextHistory.some((entry, index) => {
      const currentEntry = currentHistory[index]
      return !currentEntry || currentEntry.date !== entry.date || currentEntry.wordCount !== entry.wordCount
    })

  if (historyChanged) {
    listenerApi.dispatch(setWordCountHistorical(nextHistory))
  }
}

appStateListeners.startListening({
  matcher: isAnyOf(setActiveSection, setActiveProject, updateFile, updateChapter, addChapter),
  effect: async (_action, listenerApi) => {
    syncProjectWordCounts(listenerApi)
  }
})
