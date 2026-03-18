import * as React from 'react'
import { LayoutDashboard, Book, Diff, Plus, ListOrdered } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { selectProjects, addChapter } from '@/lib/store/projectsSlice'
import { selectAppState, setActiveSection } from '@/lib/store/appStateSlice'
import { isArtifactSection, isChapterSection, isOverviewSection, makeArtifactSection, makeChapterSection, makeOverviewSection } from '@/lib/activeSection'
import { getChaptersFromStoryContent } from '@/lib/storyContent'
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
  SidebarSeparator,
  SidebarRail
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const dispatch = useDispatch()
  const projectState = useSelector(selectProjects)
  const appState = useSelector(selectAppState)
  const activeSection = appState.activeSection
  const activeProject = projectState.activeProject

  const chapters = React.useMemo(() => {
    return activeProject ? getChaptersFromStoryContent(activeProject.storyContent) : []
  }, [activeProject])

  const modifiedChapters = projectState.modifiedChapters || []

  const artifacts = React.useMemo(
    () => [
      {
        title: 'Outline',
        icon: <ListOrdered className="h-4 w-4" />
      }
    ],
    []
  )

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="pt-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Dashboard"
              isActive={isOverviewSection(activeSection)}
              onClick={() => dispatch(setActiveSection(makeOverviewSection()))}
              className={cn('transition-all duration-200', isOverviewSection(activeSection) && 'bg-highlight-500/10 text-highlight-700 dark:text-highlight-300 font-medium')}
            >
              <LayoutDashboard className={cn('size-4', isOverviewSection(activeSection) && 'text-highlight-600')} />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {artifacts.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">Artifacts</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {artifacts.map((artifact, i) => {
                  const isActive = isArtifactSection(activeSection) && activeSection.title === artifact.title
                  return (
                    <SidebarMenuItem key={`artifact-${i}`}>
                      <SidebarMenuButton
                        tooltip={artifact.title}
                        isActive={isActive}
                        onClick={() => dispatch(setActiveSection(makeArtifactSection(artifact.title)))}
                        className={cn('transition-all duration-200', isActive && 'bg-highlight-500/10 text-highlight-700 dark:text-highlight-300 font-medium')}
                      >
                        <span className={cn(isActive && 'text-highlight-600')}>{artifact.icon}</span>
                        <span>{artifact.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator className="mx-4 opacity-50" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">Chapters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chapters.map((chapter, i) => {
                const isActive = isChapterSection(activeSection) && activeSection.index === i
                const isModified = modifiedChapters.includes(i)
                return (
                  <SidebarMenuItem key={`chapter-${i}`}>
                    <SidebarMenuButton
                      tooltip={chapter.title || `Chapter ${i + 1}`}
                      isActive={isActive}
                      onClick={() => dispatch(setActiveSection(makeChapterSection(chapter.title, i, chapter.id)))}
                      className={cn('transition-all duration-200 relative', isActive && 'bg-highlight-500/10 text-highlight-700 dark:text-highlight-300 font-medium')}
                    >
                      <Book className={cn('size-4', isActive && 'text-highlight-600')} />
                      <span className="truncate">{chapter.title || `Chapter ${i + 1}`}</span>

                      {isModified && (
                        <div className="absolute -top-0.5 -right-0.5 pointer-events-none z-10">
                          <Diff className="size-3.5 text-orange-500 bg-background rounded-full p-0.5 shadow-sm border border-orange-500/20" />
                        </div>
                      )}

                      {isActive && <div className="absolute left-0 w-1 h-6 bg-highlight-500 rounded-r-full shadow-[0px_0px_8px_rgba(var(--highlight-500-rgb),0.4)]" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Add Chapter" onClick={() => dispatch(addChapter())} className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Plus className="size-4" />
                  <span>Add Chapter</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
