import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { selectAppState } from '@/lib/store/appStateSlice'

import { AppSidebar } from '@/components/editor/AppSidebar'
import MarkdownViewer from '@/components/MarkdownViewer'
import NovelDashboard from '@/components/NovelDashboard'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { selectProjects } from '@/lib/store/projectsSlice'
import ChatInterface from '@/components/ChatInterface'
import ProjectParameters from './ProjectParameters'

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
      <SidebarInset className="h-full max-h-full">
        <SidebarTrigger className="-ml-1" />
        <header className="flex sticky top-0 bg-background h-16 shrink-0 items-center gap-2 border-b px-4 z-50">
          <Separator orientation="vertical" className="mr-2 h-4" />

        </header>

        <div className="h-full max-h-screen p-4">
          {appState.activeView == 'project/editor' ? (
            <MarkdownViewer
              key={appState.activeFile}
              fileName={appState.activeFile}
              content={projectState.activeProject?.files.find((chapter) => chapter.title == appState.activeFile)?.content || ''}
            />
          ) : appState.activeView == 'project/dashboard' ? (
            <NovelDashboard />
          ) : appState.activeView == 'project/parameters' ? (
            <ProjectParameters />
          ) : null}
        </div>

        {/* Chat Interface */}
        <ChatInterface ref={chatContainerRef} expanded={expanded} setExpanded={setExpanded} />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default ProjectOverview
