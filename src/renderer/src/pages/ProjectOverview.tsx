import { useState, useRef, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAppState } from '@/lib/store/appStateSlice'
import { selectActiveProject } from '@/lib/store/projectsSlice'


import { AppSidebar } from '@/components/editor/AppSidebar'
import MarkdownViewer from '@/components/MarkdownViewer'
import NovelDashboard from '@/components/NovelDashboard'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import ChatInterface from '@/components/ChatInterface'
import CommandPalette from '@/components/CommandPalette'
import { cn } from '@/lib/utils'
import StatusBar from '@/components/StatusBar'
import ProjectBar from '@/components/ProjectBar'

const ProjectOverview = (): React.ReactNode => {
  const appState = useSelector(selectAppState)
  const activeProject = useSelector(selectActiveProject)
  const [expanded, setExpanded] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const editorContent = useMemo(() => {
    if (appState.activeView !== 'project/editor') return null

    const isChapter = appState.activeSection?.includes('|||')
    const isOverview = appState.activeSection === 'Overview'
    const content = (isChapter || isOverview)
      ? activeProject?.storyContent
      : activeProject?.files?.find((f) => f.title === appState.activeSection)?.content

    return {
      isChapter,
      content: content || ''
    }
  }, [
    appState.activeView,
    appState.activeSection,
    activeProject?.storyContent,
    activeProject?.files
  ])

  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ProjectBar />
        <StatusBar floating={false} />
      </div>
      <AppSidebar />
      <SidebarInset className={cn(
        "relative flex-1 min-w-0 overflow-hidden",
        "animate-in fade-in zoom-in-95 duration-300"
      )}>
        {appState.activeView == 'project/editor' && editorContent ? (
          <MarkdownViewer
            key={`${activeProject?.projectPath}-${editorContent.isChapter ? 'story' : appState.activeSection}`}
            title={appState.activeSection}
            content={editorContent.content}
          />
        ) : appState.activeView == 'project/dashboard' ? (
          <NovelDashboard />
        ) : null}

        {/* Chat Interface */}
      </SidebarInset>
      <ChatInterface ref={chatContainerRef} expanded={expanded} setExpanded={setExpanded} />
      <CommandPalette />
      {/* Removed conditional rendering of BookOutlineWizard dialog */}
    </SidebarProvider>
  )
}

export default ProjectOverview
