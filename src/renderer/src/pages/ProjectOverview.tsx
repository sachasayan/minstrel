import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAppState } from '@/lib/store/appStateSlice'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { motion } from 'framer-motion'

import { StoryViewer } from '@/components/editor/StoryViewer'
import { ArtifactViewer } from '@/components/editor/ArtifactViewer'
import ChatInterface from '@/components/ChatInterface'
import CommandPalette from '@/components/CommandPalette'
import { cn } from '@/lib/utils'
import StatusBar from '@/components/StatusBar'
import ProjectBar from '@/components/ProjectBar'

const ProjectOverview = (): React.ReactNode => {
  const appState = useSelector(selectAppState)
  const activeProject = useSelector(selectActiveProject)

  const isProjectEmpty = useMemo(() => {
    const hasStoryContent = !!activeProject?.storyContent && activeProject.storyContent.trim() !== ''
    const hasAncillaryFiles = !!activeProject?.files && activeProject.files.some(f => f.content && f.content.trim() !== '')
    return !hasStoryContent && !hasAncillaryFiles
  }, [activeProject?.storyContent, activeProject?.files])

  const isStorySection = useMemo(() => {
    return appState.activeSection === 'Overview' || appState.activeSection?.includes('|||')
  }, [appState.activeSection])

  const editorContent = useMemo(() => {
    if (appState.activeView !== 'project/editor') return null

    const content = isStorySection
      ? activeProject?.storyContent
      : activeProject?.files?.find((f) => f.title === appState.activeSection)?.content

    return {
      content: content || ''
    }
  }, [
    appState.activeView,
    appState.activeSection,
    isStorySection,
    activeProject?.storyContent,
    activeProject?.files
  ])

  return (
    <div className="h-screen overflow-hidden bg-background">
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
          "animate-in fade-in zoom-in-95 duration-300",
          isProjectEmpty && "pointer-events-none"
        )}
      >
        {appState.activeView == 'project/editor' && editorContent ? (
          isStorySection ? (
            <StoryViewer
              key={`${activeProject?.projectPath}-story`}
              title={appState.activeSection}
              content={editorContent.content}
            />
          ) : (
            <ArtifactViewer
              key={`${activeProject?.projectPath}-${appState.activeSection}`}
              title={appState.activeSection}
              content={editorContent.content}
            />
          )
        ) : null}
      </motion.main>
      <ChatInterface />
      <CommandPalette />
    </div>
  )
}

export default ProjectOverview
