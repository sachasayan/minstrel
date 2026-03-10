import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAppState } from '@/lib/store/appStateSlice'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { selectChat } from '@/lib/store/chatSlice'
import { motion } from 'framer-motion'

import { StoryViewer } from '@/components/editor/StoryViewer'
import ChatInterface from '@/components/ChatInterface'
import CommandPalette from '@/components/CommandPalette'
import { cn } from '@/lib/utils'
import StatusBar from '@/components/StatusBar'
import ProjectBar from '@/components/ProjectBar'
import { isChapterSection, isOverviewSection } from '@/lib/activeSection'

const ProjectOverview = (): React.ReactNode => {
  const appState = useSelector(selectAppState)
  const activeProject = useSelector(selectActiveProject)
  const { chatHistory, pendingChat } = useSelector(selectChat)

  const isProjectEmpty = useMemo(() => {
    const hasStoryContent = !!activeProject?.storyContent && activeProject.storyContent.trim() !== ''
    const hasAncillaryFiles = !!activeProject?.files && activeProject.files.some(f => f.content && f.content.trim() !== '')
    return !hasStoryContent && !hasAncillaryFiles
  }, [activeProject?.storyContent, activeProject?.files])

  const isFreshNewProject = useMemo(() => {
    if (!activeProject) return false
    if (activeProject.projectPath !== '') return false
    if (!isProjectEmpty) return false
    const hasUserStartedFirstTurn = chatHistory.some((message) => message.sender === 'User')
    return !hasUserStartedFirstTurn || pendingChat
  }, [activeProject, isProjectEmpty, chatHistory, pendingChat])

  const isStorySection = useMemo(() => {
    return isOverviewSection(appState.activeSection) || isChapterSection(appState.activeSection)
  }, [appState.activeSection])

  const editorContent = useMemo(() => {
    if (appState.activeView !== 'project/editor') return null

    return {
      content: activeProject?.storyContent || ''
    }
  }, [
    appState.activeView,
    isStorySection,
    activeProject?.storyContent
  ])

  return (
    <div className="h-screen overflow-hidden bg-background">
      {!isFreshNewProject ? (
        <>
          <motion.div
            animate={{ opacity: isProjectEmpty ? 0 : 1 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "fixed top-4 right-4 z-50 flex items-center gap-2",
              isProjectEmpty && "pointer-events-none"
            )}
          >
            <ProjectBar />
            <StatusBar floating={false} />
          </motion.div>

          <motion.main
            animate={{ opacity: isProjectEmpty ? 0 : 1 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "relative flex-1 min-w-0 h-full overflow-hidden",
              isProjectEmpty && "pointer-events-none"
            )}
          >
            {appState.activeView == 'project/editor' && editorContent ? (
              <StoryViewer
                key={activeProject?.projectPath}
                activeSection={appState.activeSection}
                content={editorContent.content}
              />
            ) : null}
          </motion.main>
        </>
      ) : null}
      <ChatInterface />
      <CommandPalette />
    </div>
  )
}

export default ProjectOverview
