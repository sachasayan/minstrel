import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectAppState } from '@/lib/store/appStateSlice'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { BookOutlineWizard } from '@/pages/BookOutlineWizard'

import { AppSidebar } from '@/components/editor/AppSidebar'
import MarkdownViewer from '@/components/MarkdownViewer'
import NovelDashboard from '@/components/NovelDashboard'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import ChatInterface from '@/components/ChatInterface'
import ProjectParameters from './ProjectParameters'
import CommandPalette from '@/components/CommandPalette'
import { cn } from '@/lib/utils'

const ProjectOverview = (): React.ReactNode => {
  const appState = useSelector(selectAppState)
  const activeProject = useSelector(selectActiveProject)
  const [expanded, setExpanded] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showBookOutlineWizard, setShowBookOutlineWizard] = useState(false)


  // Effect to show wizard when a new project is started
  useEffect(() => {
    // Only show wizard if the active project is marked as new
    setShowBookOutlineWizard(!!activeProject?.isNew);
  }, [activeProject]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={cn(
        "relative",
        "animate-in fade-in zoom-in-95 duration-300" // Added zoom
      )}>
        {appState.activeView == 'project/editor' ? (
          <MarkdownViewer key={appState.activeFile} title={appState.activeFile} content={activeProject?.files.find((chapter) => chapter.title == appState.activeFile)?.content || ''} />
        ) : appState.activeView == 'project/dashboard' ? (
          <NovelDashboard />
        ) : appState.activeView == 'project/parameters' ? (
          <ProjectParameters />
        ) : null}

        {/* Chat Interface */}
      </SidebarInset>
      <ChatInterface ref={chatContainerRef} expanded={expanded} setExpanded={setExpanded} />
      <CommandPalette />
      {/* Render the wizard conditionally */}
      <BookOutlineWizard open={showBookOutlineWizard} onOpenChange={setShowBookOutlineWizard} />
    </SidebarProvider>
  )
}

export default ProjectOverview
