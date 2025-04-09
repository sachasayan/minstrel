import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveFile, setActiveView } from '@/lib/store/appStateSlice'
import { toast } from 'sonner'

import { saveProject } from '@/lib/services/fileService'

import { setAllFilesAsSaved, setActiveProject, setProjectHasLiveEdits, selectProjects, updateMetaProperty } from '@/lib/store/projectsSlice'

import { selectChatHistory, addChatMessage } from '@/lib/store/chatSlice'

import { Plus, Save, X, Diff, LayoutDashboard, /* FileText, */ ListOrdered, Book } from 'lucide-react'
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


const ChapterIcon = ({ chapterNumber }: { chapterNumber: string | number }) => {
  return (
    <div className="relative inline-block">
      <Square className="w-4 h-4 " />
      <span className="absolute inset-0 flex items-center justify-center leading-none text-[0.5rem] font-bold">{chapterNumber}</span>
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useDispatch()
  const projectsState = useSelector(selectProjects)
  const appState = useSelector(selectAppState)
  // Get current chat history
  const currentChatHistory = useSelector(selectChatHistory)
  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false)
  const { open: sideBarOpen } = useSidebar()

  const handleUniselect = (slug: string) => {
    console.log(appState.activeFile)
    console.log(slug)
    if (slug.includes('Chapter') || slug == 'Outline') {
      dispatch(setActiveFile(projectsState.activeProject?.files?.find((item) => item.title.includes(slug))?.title || ''))
      dispatch(setActiveView('project/editor'))
    }
  }

  const handleFileSelect = (fileName: string) => {
    dispatch(setActiveFile(fileName))
    dispatch(setActiveView('project/editor'))
  }

  const handleClose = () => {
    dispatch(setProjectHasLiveEdits(false))
    dispatch(setActiveProject(null))
    dispatch(setActiveView('intro'))
    // Consider clearing chat history here if desired when closing a project
    // dispatch(setChatHistory([]));
  }


  const handleSave = async () => {
    if (projectsState.activeProject) {
      const currentPath = projectsState.activeProject.projectPath

      // Create the project object to save, including chat history
      const projectToSave = {
        ...projectsState.activeProject,
        chatHistory: currentChatHistory
      };

      // Call the updated saveProject which returns { success, finalPath }
      const saveResult = await saveProject(projectToSave) // Pass the object with chat history

      if (saveResult.success && saveResult.finalPath) {
        toast.success('Project saved successfully!')
        dispatch(setAllFilesAsSaved()) // Clear edit flags

        // Check if the path changed (due to .md -> .mns conversion)
        if (currentPath !== saveResult.finalPath) {
          console.log(`Project path updated from ${currentPath} to ${saveResult.finalPath}`)
          // Dispatch action to update the project path in Redux state
          dispatch(updateMetaProperty({ property: 'projectPath', value: saveResult.finalPath }))
          // Optional: Add a specific toast for conversion
          toast.info('Project format updated to the latest version.')
        }
        return true // Indicate success
      } else {
        // Use a more generic error message or potentially use saveResult.error if available
        toast.error(`Failed to save project.`)
        console.error('Save project failed:', saveResult) // Log details if needed
        return false // Indicate failure
      }
    }
    // No active project to save
    console.warn('handleSave called with no active project.')
    return false // Indicate failure
  }

  const saveAndClose = async () => {
    const result = await handleSave()
    if (result) {
      handleClose()
    }
    // saveAndClose doesn't need to return a value, or return false if save failed
  }
  const handleCloseSafe = async () => {
    if (projectsState.projectHasLiveEdits) {
      setAlertDialogOpen(true)
      // Don't return false here, let the dialog handle the flow
    } else {
      handleClose()
      // Don't need to return true here
    }
  }

  const structureItems = [
    {
      key: 'Outline',
      activeView: 'project/editor',
      activeFile: 'Outline',
      icon: <ListOrdered className="mr-2 h-4 w-4" />
    }
  ]

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

      <Sidebar variant="sidebar" collapsible="icon" className={` border-none [&_[data-sidebar=sidebar]]:transition-color  [&_[data-slot=sidebar-menu-button]_span]:truncate [&_[data-sidebar=sidebar]]:duration-300`} {...props}>
        <SidebarHeader className="pt-8">
          <div className={`flex justify-between ${sideBarOpen ? `max-h-30 flex-row` : `max-h-30 flex-col`}`}>
            <Button asChild variant="ghost" className="flex-grow transition-all">
              <SidebarTrigger className="w-8 h-full" />
            </Button>
            <Button variant="ghost" className="flex-grow transition-all" onClick={handleCloseSafe}>
              <X className="" /> {sideBarOpen ? 'Close' : ''}
            </Button>
            <Button variant="ghost" className="flex-grow transition-all" onClick={handleSave}>
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
                      <LayoutDashboard className="mr-2 h-4 w-4" />  Dashboard
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
                {structureItems
                  .map((item, i) => {
                    // Ensure activeProject and files exist before finding
                    const file = projectsState.activeProject?.files?.find((e) => e.title.includes(item.key));
                    const isActive = appState.activeView === item.activeView && (!!item.activeFile ? (appState.activeFile?.includes(item.activeFile)) : true);
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
                      const isActive = appState.activeView === 'project/editor' && appState.activeFile === item.title;
                      const isPending = projectsState.pendingFiles?.includes(item.title);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <a onClick={() => handleFileSelect(item.title)} className={`flex items-center`}>
                              {isPending ? <div className="mr-2 h-4 w-4 inline-block"><div className="loader"></div></div> : !!sideBarOpen ? <Book /> : <ChapterIcon chapterNumber={i + 1} />}
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
