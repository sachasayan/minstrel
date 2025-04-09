import { useState, useRef } from 'react'
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

const ProjectOverview = (): React.ReactNode => {
  const appState = useSelector(selectAppState)
  const activeProject = useSelector(selectActiveProject)
  const [expanded, setExpanded] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)





  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={cn(
        "relative",
        "animate-in fade-in zoom-in-95 duration-300"
      )}>
        {appState.activeView == 'project/editor' ? (
          <MarkdownViewer key={appState.activeFile} title={appState.activeFile} content={activeProject?.files.find((chapter) => chapter.title == appState.activeFile)?.content || ''} />
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
