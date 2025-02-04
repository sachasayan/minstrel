import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setActiveProject, setActiveProjectFromFragment } from '../projectsSlice'
import { fetchProjectDetails } from '@/lib/projectManager'

export const projectListeners = createListenerMiddleware()

// Listen for changes to the active project — if it's a new project, fetch and update the projects state
projectListeners.startListening({
  matcher: isAnyOf(setActiveProjectFromFragment),
  effect: async (action, listenerApi) => {
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
