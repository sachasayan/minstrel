import { createListenerMiddleware, isAnyOf, PayloadAction } from '@reduxjs/toolkit' // Re-added PayloadAction
import { setActiveProject, renameFile, setActiveProjectFromFragment, startNewProject, updateCoverImage } from '../projectsSlice'
import { fetchProjectDetails } from '@/lib/services/fileService'
import { setActiveSection, setActiveView } from '../appStateSlice'
import { setChatHistory, clearChatHistory } from '../chatSlice'
import { Project, ProjectFragment } from '@/types' // Re-added ProjectFragment import
import type { RootState } from '../store' // Re-added RootState import
import { convertImagePathToBase64 } from '@/lib/coverImage'
import { isChapterFile, getChaptersFromStoryContent } from '@/lib/storyContent'

export const projectListeners = createListenerMiddleware()
const DEFAULT_NEW_PROJECT_COVER_PATH = 'covers/abstract_digital_art_science_fiction_time_travel_1744962163304_0.png'

const findChapterOneTitle = (project: Project | undefined): string => {
  if (!project || !project.storyContent) return 'Chapter 1'

  const chapters = getChaptersFromStoryContent(project.storyContent)
  if (chapters.length === 0) return 'Chapter 1'

  // Return the first chapter found in format Title|||index
  return `${chapters[0].title}|||0`
}

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
            listenerApi.dispatch(setActiveSection(findChapterOneTitle(fullProject)))
            listenerApi.dispatch(setActiveView('project/editor'))
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

    if (previousState?.appState?.activeSection === payload?.oldTitle) {
      listenerApi.dispatch(setActiveSection(payload.newTitle))
    }
  }
})

// Apply a default cover for newly started projects.
projectListeners.startListening({
  matcher: isAnyOf(startNewProject),
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(clearChatHistory())
    listenerApi.dispatch(setActiveSection('Chapter 1|||0'))
    listenerApi.dispatch(setActiveView('project/editor'))

    try {
      const currentState = listenerApi.getState() as RootState
      const activeProject = currentState.projects.activeProject
      if (!activeProject) return

      // Only set a default cover when the new unsaved project has no cover yet.
      if (activeProject.projectPath !== '') return
      if (activeProject.coverImageBase64 || activeProject.coverImageMimeType) return

      const coverData = await convertImagePathToBase64(DEFAULT_NEW_PROJECT_COVER_PATH)
      if (!coverData.base64 || !coverData.mimeType) return

      const latestState = listenerApi.getState() as RootState
      const latestProject = latestState.projects.activeProject
      if (!latestProject) return
      if (latestProject.projectPath !== '') return
      if (latestProject.coverImageBase64 || latestProject.coverImageMimeType) return

      listenerApi.dispatch(updateCoverImage({ base64: coverData.base64, mimeType: coverData.mimeType }))
    } catch (error) {
      console.error('Failed to apply default cover for new project:', error)
    }
  }
})
