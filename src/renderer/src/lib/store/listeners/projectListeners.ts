import { createListenerMiddleware, isAnyOf, PayloadAction } from '@reduxjs/toolkit' // Re-added PayloadAction
import { setActiveProject, renameFile, setActiveProjectFromFragment } from '../projectsSlice'
import { fetchProjectDetails } from '@/lib/services/fileService'
import { setActiveFile } from '../appStateSlice'
import { setChatHistory } from '../chatSlice'
import { Project, ProjectFragment } from '@/types' // Re-added ProjectFragment import
import type { RootState } from '../store' // Re-added RootState import

export const projectListeners = createListenerMiddleware()

// Listen for setting active project from fragment - fetch full details and set chat history
projectListeners.startListening({
  matcher: isAnyOf(setActiveProjectFromFragment),
  // Explicitly type the action parameter
  effect: async (action: PayloadAction<ProjectFragment>, listenerApi) => {
    const projectFragment = action.payload; // Now correctly typed as ProjectFragment
    if (!projectFragment?.projectPath) {
        console.warn('setActiveProjectFromFragment listener triggered without a valid project fragment.')
        return;
    }

    try {
        console.log(`Listener: Fetching full details for ${projectFragment.title}`)
        // Fetch the full project details, which now includes chatHistory
        const fullProject: Project | null = await fetchProjectDetails(projectFragment)

        if (fullProject) {
            console.log(`Listener: Dispatching setActiveProject for ${fullProject.title}`)
            // Dispatch action to set the fully loaded project
            listenerApi.dispatch(setActiveProject(fullProject))

            console.log(`Listener: Dispatching setChatHistory for ${fullProject.title}`)
            // Dispatch action to set the chat history
            listenerApi.dispatch(setChatHistory(fullProject.chatHistory ?? []))
        } else {
             console.error(`Listener: Failed to fetch full project details for ${projectFragment.title}`)
             // Optionally dispatch an error state or notification
        }
    } catch (error) {
        console.error(`Listener: Error fetching project details or dispatching actions for ${projectFragment.title}:`, error)
        // Optionally dispatch an error state or notification
    }
  }
})

// Listen for changes to files names. If a file is renamed, change the active file.
projectListeners.startListening({
  matcher: isAnyOf(renameFile),
  // Explicitly type the action parameter
  effect: async (action: PayloadAction<{ oldTitle: string; newTitle: string }>, listenerApi) => {
    const payload = action.payload; // Now correctly typed
    // Cast the state to RootState
    const previousState = listenerApi.getOriginalState() as RootState;

    if (previousState?.appState?.activeFile === payload?.oldTitle) {
      listenerApi.dispatch(setActiveFile(payload.newTitle))
    }
  }
})
