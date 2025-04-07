import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { selectAppState } from '@/lib/store/appStateSlice'

import { AppSidebar } from '@/components/editor/AppSidebar'
import MarkdownViewer from '@/components/MarkdownViewer'
import NovelDashboard from '@/components/NovelDashboard'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { selectProjects } from '@/lib/store/projectsSlice'
import ChatInterface from '@/components/ChatInterface'
import ProjectParameters from './ProjectParameters'
import CommandPalette from '@/components/CommandPalette'
import { cn } from '@/lib/utils' // Import cn utility

const ProjectOverview = (): React.ReactNode => {
  const appState = useSelector(selectAppState)
  const projectState = useSelector(selectProjects)
  const [expanded, setExpanded] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node) && expanded) {
        console.log('click outside')
        setExpanded(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [expanded])


  return (
    <SidebarProvider>
      <AppSidebar />
      {/* Added zoom-in-95 animation class to SidebarInset */}
      <SidebarInset className={cn(
        "relative",
        "animate-in fade-in zoom-in-95 duration-300" // Added zoom
      )}>
        {appState.activeView == 'project/editor' ? (
          <MarkdownViewer key={appState.activeFile} title={appState.activeFile} content={projectState.activeProject?.files.find((chapter) => chapter.title == appState.activeFile)?.content || ''} />
        ) : appState.activeView == 'project/dashboard' ? (
          <NovelDashboard />
        ) : appState.activeView == 'project/parameters' ? (
          <ProjectParameters />
        ) : null}

        {/* Chat Interface */}
      </SidebarInset>
      <ChatInterface ref={chatContainerRef} expanded={expanded} setExpanded={setExpanded} />
      <CommandPalette />
    </SidebarProvider>
  )
}

export default ProjectOverview
