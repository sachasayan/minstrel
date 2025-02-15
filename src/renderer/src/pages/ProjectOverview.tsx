import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { selectAppState } from '@/lib/utils/appStateSlice'

import { AppSidebar } from '@/components/editor/AppSidebar'
import MarkdownViewer from '@/components/MarkdownViewer'
import NovelDashboard from '@/components/NovelDashboard'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { selectProjects } from '@/lib/utils/projectsSlice'
import ChatInterface from '@/components/ChatInterface'

const ProjectOverview = (): React.ReactNode => {
  const appState = useSelector(selectAppState)
  const projectState = useSelector(selectProjects)
  const [collapsed, setCollapsed] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log(chatContainerRef.current)
      if (
        chatContainerRef.current &&
        !chatContainerRef.current.contains(event.target as Node) &&
        !collapsed
      ) {
        console.log('click outside')
        setCollapsed(true)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [collapsed])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex sticky top-0 bg-background h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">{projectState.activeProject?.title}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {appState.activeView == 'project/editor' ? (
            <MarkdownViewer
              key={appState.activeFile}
              fileName={appState.activeFile}
              content={
                projectState.activeProject?.files.find(
                  (chapter) => chapter.title == appState.activeFile
                )?.content || ''
              }
            />
          ) : appState.activeView == 'project/dashboard' ? (
            <NovelDashboard />
          ) : appState.activeView == 'project/outline' ? (
            <MarkdownViewer
              key={appState.activeView}
              fileName={`Outline`}
              content={projectState.activeProject?.outline || ''}
            />
          ) : null}
        </div>

        {/* Chat Interface */}
        <ChatInterface ref={chatContainerRef} collapsed={collapsed} setCollapsed={setCollapsed} />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default ProjectOverview
