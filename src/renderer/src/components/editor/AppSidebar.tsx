import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveSection, setActiveView } from '@/lib/store/appStateSlice'
import { selectProjects, addChapter } from '@/lib/store/projectsSlice'
import { getChaptersFromStoryContent } from '@/lib/storyContent'

import { addChatMessage } from '@/lib/store/chatSlice'

import { Plus, Diff, LayoutDashboard, ListOrdered, Book } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { selectAppState } from '@/lib/store/appStateSlice'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useDispatch()
  const projectsState = useSelector(selectProjects)
  const appState = useSelector(selectAppState)

  const activeProject = projectsState.activeProject
  const chapters = activeProject ? getChaptersFromStoryContent(activeProject.storyContent) : []

  const handleUniselect = (slug: string) => {
    if (slug == 'Outline') {
      dispatch(setActiveSection(activeProject?.files?.find((item) => item.title.includes(slug))?.title || ''))
      dispatch(setActiveView('project/editor'))
    }
  }

  const handleChapterSelect = (title: string, index: number) => {
    dispatch(setActiveSection(`${title}|||${index}`))
    dispatch(setActiveView('project/editor'))
  }

  const structureItems = [
    {
      key: 'Outline',
      activeView: 'project/editor',
      activeSection: 'Outline',
      icon: <ListOrdered className="mr-2 h-4 w-4" />
    }
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className={` border-none [&_[data-sidebar=sidebar]]:transition-color  [&_[data-slot=sidebar-menu-button]_span]:truncate [&_[data-sidebar=sidebar]]:duration-300`} {...props}>
      <SidebarHeader className="pt-8">
        <Button asChild variant="ghost" className="w-full transition-all">
          <SidebarTrigger className="w-8 h-full" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup key="Dashboard">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="Dashboard">
                <SidebarMenuButton asChild isActive={appState.activeView === 'project/dashboard' || appState.activeSection === 'Overview'}>
                  <a onClick={() => {
                    dispatch(setActiveSection('Overview'))
                    dispatch(setActiveView('project/editor'))
                  }}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />  Dashboard
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {chapters.length > 0 && (
          <SidebarGroup key="Chapters">
            <SidebarGroupLabel>Chapters</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chapters.map((chapter, i) => {
                  const isActive = appState.activeSection?.endsWith(`|||${i}`)
                  return (
                    <SidebarMenuItem key={`chapter-${i}`}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <a onClick={() => handleChapterSelect(chapter.title, i)} className={`flex items-center`}>
                          <Book />
                          <span className="flex-grow ml-2">
                            {chapter.title.trim() || `Chapter ${i + 1}`}
                          </span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}


                <SidebarMenuItem key="addChapter">
                  <SidebarMenuButton
                    className="w-full flex flex-row overflow-hidden h-8 rounded p-1"
                    onClick={() => dispatch(addChapter())}
                    variant="outline"
                  >
                    <Plus className="mr-2" />
                    <span className="block overflow-hidden"> Add Chapter</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup key={'Artifacts'}>
          <SidebarGroupLabel>Artifacts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {structureItems
                .map((item, i) => {
                  // Ensure activeProject and files exist before finding
                  const file = projectsState.activeProject?.files?.find((e) => e.title.includes(item.key));
                  const isActive = appState.activeView === item.activeView && (!!item.activeSection ? (appState.activeSection?.includes(item.activeSection)) : true);
                  const isPending = projectsState.pendingFiles?.includes(file?.title || '');
                  const hasEdits = file?.hasEdits;

                  return (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <a onClick={() => handleUniselect(item.key)}>
                          {isPending ? <div className="mr-2 h-4 w-4 inline-block"><div className="loader"></div></div> : item.icon}  {item.key}
                          {hasEdits && <Diff className="float-right text-orange-500" />}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
