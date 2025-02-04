import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setActiveFile,
  setActiveView
} from '@/lib/utils/appStateSlice'
import { toast } from 'sonner'

import { saveProject } from '@/lib/projectManager'
import {
  setAllFilesAsSaved,
  setActiveProject,
  setProjectHasLiveEdits,
  selectProjects,
} from "@/lib/utils/projectsSlice";

import { ChevronRight, Save, X, Diff } from 'lucide-react'
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
    console.log("handleNextStage called"); // Add this line
    dispatch(addChatMessage({ sender: 'User', text: 'Proceed to outline.' }));
  };


  const handleSave = async () => {
    if (projectsState.activeProject) {
      const saveResult = await saveProject(projectsState.activeProject)
      if (saveResult) {
        toast.success('Project saved successfully!')
        dispatch(setAllFilesAsSaved())
      } else {
        toast.error('Failed to save project.')
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
                  <AlertDialogAction onClick={() => {
                    dispatch(setProjectHasLiveEdits(false))
                    dispatch(setActiveProject(null))
                    dispatch(setActiveView('intro'))
                  }}>
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
            <Button
              variant="outline"
              className=""
              onClick={() => dispatch(setActiveView('intro'))}
            >
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
        {/* Create an overview area for the project */}
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem key="Dashboard">
              <SidebarMenuButton asChild isActive={false}>
                <a onClick={() => dispatch(setActiveView('project/dashboard'))}>Dashboard</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem key="Outline">
              <SidebarMenuButton asChild isActive={false}>
                <a onClick={() => dispatch(setActiveView('project/outline'))}>Outline</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>

        {/* We create a collapsible SidebarGroup for Chapters */}

        <Collapsible key={'chapters'} title={'Chapters'} defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel
              asChild
              className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <CollapsibleTrigger>
                Chapters
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectsState.activeProject?.files?.map((item) => {
                    const fileNameWithoutExtension = item.title.split('.').slice(0, -1).join('.')
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={true}>
                          <a onClick={() => handleFileSelect(item.title)}>
                            {fileNameWithoutExtension} {item.hasEdits && <Diff />}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <div className="border-t p-2 absolute bottom-16 w-full"> {/* Position at the bottom */}
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
