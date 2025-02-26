import { createListenerMiddleware, isAnyOf, ListenerEffect, PayloadAction } from '@reduxjs/toolkit'
import { setActiveProject, renameFile, setActiveProjectFromFragment } from '../projectsSlice'
import { fetchProjectDetails } from '@/lib/services/fileService'
import { setActiveFile } from '../appStateSlice'
export const projectListeners = createListenerMiddleware()

// Listen for changes to the active project — if it's a new project, fetch and update the projects state
projectListeners.startListening({
  matcher: isAnyOf(setActiveProjectFromFragment),
  effect: async (action, listenerApi: ListenerEffect) => {
    const prevState = listenerApi.getOriginalState().projects.activeProject
    const nextState = listenerApi.getState().projects.activeProject

    if (!nextState || prevState === nextState) {
      console.log('No change in project')
      return
    }

    const projectsList = await fetchProjectDetails(nextState)
    listenerApi.dispatch(setActiveProject(projectsList))
  }
})

// Listen for changes to files names. If a file is renamed, change the active file.
projectListeners.startListening({
  matcher: isAnyOf(renameFile),
  effect: async (action, listenerApi: ListenerEffect) => {
    const prevState = listenerApi.getOriginalState()

    if (prevState.appState.activeFile == (action?.payload as PayloadAction<{ oldTitle: string; newTitle: string }>).oldTitle as any ){
      listenerApi.dispatch(setActiveFile(action.payload.newTitle))
    }

  }
})
