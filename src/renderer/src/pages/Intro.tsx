import { ReactNode } from 'react'
import StatusBar from '@/components/StatusBar'

import ProjectLibrary from '@/components/ProjectLibrary'
import { useDispatch, useSelector } from 'react-redux'
import { addRecentProject, selectSettingsState } from '@/lib/store/settingsSlice'
import { startNewProject, setActiveProject } from '@/lib/store/projectsSlice'
import { setActiveView, setActiveSection } from '@/lib/store/appStateSlice'
import { setChatHistory } from '@/lib/store/chatSlice'
import { fetchProjectDetails, getProjectFragmentMeta, openFileDialog } from '@/lib/services/fileService'
import { saveAppSettings } from '@/lib/services/settingsService'
import { RecentProject } from '@/types'
import { cn } from '@/lib/utils'
import { getChaptersFromStoryContent } from '@/lib/storyContent'

const Intro = (): ReactNode => {
  const dispatch = useDispatch()
  const settingsState = useSelector(selectSettingsState)
  const recentProjects = settingsState.recentProjects ?? []

  // Core open-by-path: load, record in history, navigate
  const handleOpenByPath = async (projectPath: string) => {
    try {
      const fragment = await getProjectFragmentMeta(projectPath)
      if (!fragment) {
        console.error('Could not load project metadata for:', projectPath)
        return
      }

      // Build and record a RecentProject entry
      const recentEntry: RecentProject = {
        projectPath: fragment.projectPath,
        title: fragment.title,
        genre: fragment.genre,
        cover: fragment.cover,           // cache the cover data URL (only 3 entries)
        coverImageMimeType: fragment.coverImageMimeType,
        wordCountCurrent: fragment.wordCountCurrent,
        lastOpenedAt: new Date().toISOString()
      }

      // Update redux + persist to disk
      dispatch(addRecentProject(recentEntry))
      const updatedRecents = [
        recentEntry,
        ...(settingsState.recentProjects ?? []).filter(p => p.projectPath !== projectPath)
      ].slice(0, 3)
      await saveAppSettings({ ...settingsState, recentProjects: updatedRecents })

      // Fetch full project, set state, navigate
      const fullProject = await fetchProjectDetails(fragment)
      dispatch(setActiveProject(fullProject))
      dispatch(setChatHistory(fullProject.chatHistory ?? []))

      // Navigate to first chapter
      const chapters = getChaptersFromStoryContent(fullProject.storyContent || '')
      const firstSection = chapters.length > 0 ? `${chapters[0].title}|||0` : 'Chapter 1|||0'
      dispatch(setActiveSection(firstSection))
      dispatch(setActiveView('project/editor'))
    } catch (err) {
      console.error('Failed to open project:', err)
    }
  }

  const handleOpen = async () => {
    const selectedPath = await openFileDialog()
    if (!selectedPath) return
    await handleOpenByPath(selectedPath)
  }

  const handleNew = () => {
    dispatch(startNewProject())
  }

  const handleProjectSelect = async (projectPath: string) => {
    await handleOpenByPath(projectPath)
  }

  return (
    <>
      <StatusBar />
      <div className={cn(
        "flex flex-col items-center justify-center p-8 h-full",
        "animate-in fade-in zoom-in-95 gap-8 duration-300"
      )}>
        <h1 className="text-2xl font-bold text-highlight-700">Welcome to Minstrel</h1>

        <ProjectLibrary
          recentProjects={recentProjects}
          onProjectSelect={handleProjectSelect}
          onNew={handleNew}
          onOpen={handleOpen}
        />

        <p className="outline rounded-2xl py-2 px-4 text-sm text-highlight-800">
          Minstrel is totally free for personal use. Like it?{' '}
          <a href="https://ko-fi.com/writewithminstrel" rel="noreferrer" className="cursor-pointer underline" target="_blank">
            Buy me a coffee.
          </a>{' '}
          ☕ ❤️
        </p>
      </div>
    </>
  )
}

export default Intro
