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

import { Plus, Save, X, Diff, LayoutDashboard, Settings, FileText, ListOrdered, Squircle } from 'lucide-react'
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
import { selectAppState } from '@/lib/utils/appStateSlice'

const ChapterIcon = ({ chapterNumber }: { chapterNumber: string | number }) => {
  return (
    <div className="relative inline-block">
      <Squircle className="w-4 h-4 text-muted-foreground" />
      <span className="absolute inset-0 flex items-center justify-center leading-none text-[0.5rem] font-bold text-foreground">
        {chapterNumber}
      </span>
    </div>
  );
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useDispatch()
  const projectsState = useSelector(selectProjects)
  const appState = useSelector(selectAppState)
  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false);
  const { open: sideBarOpen, setOpen: setSideBarOpen } = useSidebar()



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
        return true;
      } else {
        toast.error(`Failed to save project: ${saveResult}`)
        return false;
      }
      dispatch(setProjectHasLiveEdits(false))
    }
  }
  const saveAndClose = async () => {
    const result = await handleSave();
    if (result) {
      handleClose()
    }
  }
  const handleCloseSafe = async () => {
    if (projectsState.projectHasLiveEdits) {
      setAlertDialogOpen(true);
      return false;
    }
    handleClose()
  }



  return (
    <>
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen} >
        <AlertDialogTrigger asChild>
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
              onClick={handleClose}
            >
              Close without Saving
            </AlertDialogAction>
            <AlertDialogAction
              onClick={saveAndClose}
            >
              Save and Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sidebar variant="sidebar" collapsible="icon"  {...props}>
        <SidebarHeader>
          <div className={`flex justify-between ${sideBarOpen ? `flex-row` : `flex-col`}`}>
            <Button
              variant="ghost"
              className="flex-grow transition-all"
              onClick={handleCloseSafe}
            >
              <X className="" /> {sideBarOpen ? 'Close' : ''}
            </Button>
            <Button
              variant="ghost"
              className="flex-grow transition-all"
              disabled={!projectsState.projectHasLiveEdits}
              onClick={handleSave}
            >
              <Save className="" />{sideBarOpen ? 'Save' : ''}
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

          <SidebarGroup key={"Structure"}>
            <SidebarGroupLabel>Structure</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem key="Parameters">
                  <SidebarMenuButton asChild isActive={false}>
                    <a onClick={() => dispatch(setActiveView('project/dashboard'))}>
                      <Settings className="mr-2 h-4 w-4" /> Parameters
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem key="Skeleton">
                  <SidebarMenuButton asChild isActive={appState.activeView === 'project/editor' && appState.activeFile === 'Skeleton.md'}>
                    <a onClick={() => handleFileSelect("Skeleton.md")}>
                      <FileText className="mr-2 h-4 w-4" /> Skeleton
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem key="Outline">
                  <SidebarMenuButton asChild isActive={appState.activeView === 'project/editor' && appState.activeFile === 'Outline.md'}>
                    <a onClick={() => handleFileSelect("Outline.md")}>
                      <ListOrdered className="mr-2 h-4 w-4" /> Outline
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>


          <SidebarGroup key="Chapters">
            <SidebarGroupLabel>Chapters</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projectsState.activeProject?.files?.filter((item) => item.title.includes('Chapter')).map((item) => {
                  const chapterNumber = item.title.match(/Chapter-(\d+)/)?.[1] || '';
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={false}>
                        <a onClick={() => handleFileSelect(item.title)} className="flex items-center">
                          <ChapterIcon chapterNumber={chapterNumber} />
                          <span className="flex-grow ml-2">{item.title.replace('.md', '').replace('-', ' ')}</span> {item.hasEdits && <Diff className="float-right text-orange-500" />}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                <SidebarMenuItem key="addChapter">
                  <SidebarMenuButton asChild isActive={true}>
                    <a onClick={() => handleFileSelect("Outline.md")}><Plus /> Add Chapter</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>




        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
