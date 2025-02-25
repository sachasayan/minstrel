import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveFile, setActiveView } from '@/lib/store/appStateSlice'
import { toast } from 'sonner'

import { saveProject } from '@/lib/services/fileService'
import { setAllFilesAsSaved, setActiveProject, setProjectHasLiveEdits, selectProjects } from '@/lib/store/projectsSlice'

import { Plus, Save, X, Diff, LayoutDashboard, Settings, FileText, ListOrdered, Book } from 'lucide-react'
import { Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useSidebar,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { selectAppState } from '@/lib/store/appStateSlice'
import { addChatMessage } from '@/lib/store/chatSlice'

const ChapterIcon = ({ chapterNumber }: { chapterNumber: string | number }) => {
  return (
    <div className="relative inline-block">
      <Square className="w-4 h-4 text-muted-foreground" />
      <span className="absolute inset-0 flex items-center justify-center leading-none text-[0.5rem] font-bold text-foreground">{chapterNumber}</span>
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useDispatch()
  const projectsState = useSelector(selectProjects)
  const appState = useSelector(selectAppState)
  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false)
  const { open: sideBarOpen } = useSidebar()

  const handleFileSelect = (fileName: string) => {
    dispatch(setActiveFile(fileName))
    dispatch(setActiveView('project/editor'))
  }

  const handleClose = () => {
    dispatch(setProjectHasLiveEdits(false))
    dispatch(setActiveProject(null))
    dispatch(setActiveView('intro'))
  }
  const handleSave = async () => {
    if (projectsState.activeProject) {
      const saveResult = await saveProject(projectsState.activeProject)
      if (saveResult) {
        toast.success('Project saved successfully!')
        dispatch(setAllFilesAsSaved())
        return true
      } else {
        toast.error(`Failed to save project: ${saveResult}`)
        return false
      }
      dispatch(setProjectHasLiveEdits(false))
      return true
    }
    return false
  }
  const saveAndClose = async () => {
    const result = await handleSave()
    if (result) {
      handleClose()
    }
    return false
  }
  const handleCloseSafe = async () => {
    if (projectsState.projectHasLiveEdits) {
      setAlertDialogOpen(true)
      return false
    }
    handleClose()
    return true
  }

  return (
    <>
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogTrigger asChild></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved changes. Closing will lose your progress.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>Close without Saving</AlertDialogAction>
            <AlertDialogAction onClick={saveAndClose}>Save and Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sidebar variant="sidebar" collapsible="icon" className={`[&_div]:transition-colors ${!sideBarOpen ? 'border-none [&_.bg-sidebar]:bg-transparent' : '[&_.bg_sidebar]:bg-sidebar'}`} {...props}>
        <SidebarHeader className="pt-8">
          <div className={`flex justify-between ${sideBarOpen ? `max-h-30 flex-row` : `max-h-30 flex-col`} transition-all duration-500`}>
            <Button asChild variant="ghost" className="flex-grow transition-all">
              <SidebarTrigger className="w-8 h-full" />
            </Button>
            <Button variant="ghost" className="flex-grow transition-all" onClick={handleCloseSafe}>
              <X className="" /> {sideBarOpen ? 'Close' : ''}
            </Button>
            <Button variant="ghost" className="flex-grow transition-all" disabled={!projectsState.projectHasLiveEdits} onClick={handleSave}>
              <Save className="" />
              {sideBarOpen ? 'Save' : ''}
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent className="gap-0">
          <SidebarGroup key="Dashboard">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem key="Dashboard">
                  <SidebarMenuButton asChild isActive={appState.activeView === 'project/dashboard'}>
                    <a onClick={() => dispatch(setActiveView('project/dashboard'))}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup key={'Structure'}>
            <SidebarGroupLabel>Structure</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem key="Parameters">
                  <SidebarMenuButton asChild isActive={appState.activeView === 'project/parameters'}>
                    <a onClick={() => dispatch(setActiveView('project/parameters'))}>
                      <Settings className="mr-2 h-4 w-4" /> Parameters
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem key="Skeleton">
                  <SidebarMenuButton asChild isActive={appState.activeView === 'project/editor' && appState.activeFile?.indexOf('Skeleton') != -1}>
                    <a onClick={() => handleFileSelect(projectsState.activeProject?.files?.find((item) => item.title.includes('Skeleton'))?.title || '')}>
                      <FileText className="mr-2 h-4 w-4" /> <span className="flex-grow ml-2">Skeleton</span>{' '}
                      {projectsState.activeProject?.files?.find((item) => item.title.includes('Skeleton'))?.hasEdits && <Diff className="float-right text-orange-500" />}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem key="Outline">
                  <SidebarMenuButton asChild isActive={appState.activeView === 'project/editor' && appState.activeFile?.indexOf('Outline') != -1}>
                    <a onClick={() => handleFileSelect(projectsState.activeProject?.files?.find((item) => item.title.includes('Outline'))?.title || '')}>
                      <ListOrdered className="mr-2 h-4 w-4" /> <span className="flex-grow ml-2">Outline</span>{' '}
                      {projectsState.activeProject?.files?.find((item) => item.title.includes('Outline'))?.hasEdits && <Diff className="float-right text-orange-500" />}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {!projectsState.activeProject?.files?.find((item) => item.title.includes('Outline')) && (
                  <SidebarMenuItem key="Create Outline">
                    <SidebarMenuButton asChild>
                      <Button
                        onClick={() =>
                          dispatch(
                            addChatMessage({
                              sender: 'User',
                              text: 'Please create an outline.'
                            })
                          )
                        }
                        variant="outline"
                        className="w-full"
                      >
                        Create Outline
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {projectsState.activeProject?.files?.find((item) => item.title.includes('Outline')) && (
            <SidebarGroup key="Chapters">
              <SidebarGroupLabel>Chapters</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectsState.activeProject?.files
                    ?.filter((item) => item.title.includes('Chapter'))
                    .map((item, i) => {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={appState.activeView === 'project/editor' && appState.activeFile === item.title}>
                            <a onClick={() => handleFileSelect(item.title)} className={`flex items-center [&:active]:bg-highlight-700 [&:active]:text-white [data-active=true]:bg-highlight-600`}>
                              {!!sideBarOpen && <Book />}
                              {!sideBarOpen && <ChapterIcon chapterNumber={i + 1} />}
                              <span className="flex-grow ml-2">{item.title.replace('-', ' ')}</span> {item.hasEdits && <Diff className="float-right text-orange-500" />}
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  <SidebarMenuItem key="addChapter">
                    <SidebarMenuButton
                      className={`w-full flex flex-row ${sideBarOpen ? 'justify-center' : ''}  overflow-hidden h-8 rounded p-1`}
                      onClick={() =>
                        dispatch(
                          addChatMessage({
                            sender: 'User',
                            text: 'Please add a new chapter.'
                          })
                        )
                      }
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
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
