import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveFile, setActiveView } from '@/lib/utils/appStateSlice'
import { toast } from 'sonner'

import { saveProject } from '@/lib/projectManager'
import {
  setAllFilesAsSaved,
  setActiveProject,
  setProjectHasLiveEdits,
  selectProjects
} from '@/lib/utils/projectsSlice'

import { ChevronRight, Plus, Save, X, Diff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  SidebarRail
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
import { addChatMessage } from '@/lib/utils/chatSlice'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useDispatch()
  const projectsState = useSelector(selectProjects)

  const handleFileSelect = (fileName: string) => {
    dispatch(setActiveFile(fileName))
    dispatch(setActiveView('project/editor'))
  }

  const handleNextStage = () => {
    console.log('handleNextStage called') // Add this line
    dispatch(addChatMessage({ sender: 'User', text: `Let's build the outline based on our story skeleton.` }))
  }

  const handleSave = async () => {
    if (projectsState.activeProject) {
      const saveResult = await saveProject(projectsState.activeProject)
      if (saveResult) {
        toast.success('Project saved successfully!')
        dispatch(setAllFilesAsSaved())
      } else {
        toast.error(`Failed to save project: ${saveResult}`)
      }
      dispatch(setProjectHasLiveEdits(false))
    }
  }

  return (
    <Sidebar variant="sidebar" {...props}>
      <SidebarHeader>
        <div className="grid grid-cols-3 gap-2">
          {projectsState.projectHasLiveEdits ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="">
                  <X className="" /> Close
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have unsaved changes. Closing will lose your progress.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      dispatch(setProjectHasLiveEdits(false))
                      dispatch(setActiveProject(null))
                      dispatch(setActiveView('intro'))
                    }}
                  >
                    Close without Saving
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={async () => {
                      await handleSave()
                      dispatch(setProjectHasLiveEdits(false))
                      dispatch(setActiveProject(null))
                      dispatch(setActiveView('intro'))
                    }}
                  >
                    Save and Close
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="outline" className="" onClick={() => dispatch(setActiveView('intro'))}>
              <X className="" /> Close
            </Button>
          )}
          <Button
            variant="outline"
            className="col-span-2"
            disabled={!projectsState.projectHasLiveEdits}
            onClick={handleSave}
          >
            <Save className="" />
            Save
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">





        <SidebarGroup key="Dashboard">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="Dashboard">
                <SidebarMenuButton asChild isActive={false}>
                  <a onClick={() => dispatch(setActiveView('project/dashboard'))}>Dashboard</a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarGroup key={"Structure"}>
          <SidebarGroupLabel>Structure</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="Parameters">
                <SidebarMenuButton asChild isActive={false}>
                  <a onClick={() => dispatch(setActiveView('project/dashboard'))}>Parameters</a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem key="Skeleton">
                <SidebarMenuButton asChild isActive={true}>
                  <a onClick={() => handleFileSelect("Skeleton.md")}>Skeleton</a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem key="Outline">
                <SidebarMenuButton asChild isActive={false}>
                  <a onClick={() => handleFileSelect("Outline.md")}>Outline</a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarGroup key="Chapters">
          <SidebarGroupLabel>Chapters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projectsState.activeProject?.files?.filter((item) => item.title.includes('Chapter')).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={true}>
                    <a onClick={() => handleFileSelect(item.title)}>
                      {item.title.replace('.md', '').replace('-', ' ')} {item.hasEdits && <Diff />}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              ))}
              <SidebarMenuItem key="addChapter">
                <SidebarMenuButton asChild isActive={true}>
                  <a onClick={() => handleFileSelect("Outline.md")}><Plus /> Add Chapter</a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>




        <div className="border-t p-2 absolute bottom-16 w-full">
          {' '}
          {/* Position at the bottom */}
          <button
            onClick={handleNextStage}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full z-10" // Add z-index
          >
            Proceed to Outline
          </button>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
