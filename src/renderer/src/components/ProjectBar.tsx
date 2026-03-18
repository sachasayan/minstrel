import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { FileDown, Loader2, Save, X } from 'lucide-react'
import { selectActiveProject, selectProjects, setActiveProject, setAllFilesAsSaved, setProjectHasLiveEdits, setProjectPath } from '@/lib/store/projectsSlice'
import { addRecentProject, selectSettingsState } from '@/lib/store/settingsSlice'
import pdfService from '@/lib/services/pdfService'
import PdfExportConfigModal, { PdfExportConfig } from '@/components/PdfExportConfigModal'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { selectChatHistory } from '@/lib/store/chatSlice'
import { saveProject, createSqliteProject } from '@/lib/services/fileService'
import { selectAppState, setActiveView } from '@/lib/store/appStateSlice'
import { bridge } from '@/lib/bridge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { saveAppSettings } from '@/lib/services/settingsService'
import { buildRecentProjectEntry } from '@/lib/recentProjects'
import { Project } from '@/types'

const ProjectBar = () => {
  const dispatch = useDispatch()
  const activeProject = useSelector(selectActiveProject)
  const projectsState = useSelector(selectProjects)
  const appState = useSelector(selectAppState)
  const settings = useSelector(selectSettingsState)
  const currentChatHistory = useSelector(selectChatHistory)
  const [isExporting, setIsExporting] = useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)

  const refreshRecentProjects = async (project: Project) => {
    const recentEntry = buildRecentProjectEntry(project)
    const updatedRecents = [recentEntry, ...(settings.recentProjects ?? []).filter((recentProject) => recentProject.projectPath !== project.projectPath)].slice(0, 3)

    dispatch(addRecentProject(recentEntry))
    try {
      await saveAppSettings({ ...settings, recentProjects: updatedRecents })
    } catch (error) {
      console.error('Failed to persist recent projects after save:', error)
      toast.error('Project saved, but recent projects could not be updated.')
    }
  }

  const handleExportConfigured = async (config: PdfExportConfig) => {
    if (!activeProject || isExporting) {
      if (!activeProject) toast.error('No active project selected.')
      return
    }

    setIsExporting(true)
    const exportToastId = toast.loading(`Generating PDF for ${activeProject.title}...`)

    try {
      const blob = await pdfService.generateProjectPdf(activeProject, config)

      if (blob) {
        const filename = `${activeProject.title || 'Untitled Project'}.pdf`
        pdfService.triggerDownload(blob, filename)
        toast.success(`Successfully exported ${filename}`, { id: exportToastId })
      } else {
        toast.dismiss(exportToastId)
      }
    } catch (error) {
      console.error('Unexpected error during PDF export:', error)
      toast.error('An unexpected error occurred during PDF export.', { id: exportToastId })
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = async () => {
    dispatch(setProjectHasLiveEdits(false))
    dispatch(setActiveProject(null))
    dispatch(setActiveView('intro'))
  }

  const handleSave = async () => {
    if (!projectsState.activeProject) return false

    const currentPath = projectsState.activeProject.projectPath
    const projectToSave = {
      ...projectsState.activeProject,
      chatHistory: currentChatHistory,
      lastViewedSection: appState.activeSection
    }

    // ─── First-time save: no path yet ────────────────────────────────────────
    if (!currentPath) {
      // 1. Resolve the save directory
      let saveDir = settings.workingRootDirectory
      if (!saveDir) {
        saveDir = await bridge.selectDirectory('save')
        if (!saveDir) {
          toast.info('Save cancelled — no folder selected.')
          return false
        }
      }

      // 2. Show a save-file dialog so the user names the file
      const chosenPath = await bridge.showSaveDialog({
        defaultPath: `${saveDir}/untitled.mns`,
        filters: [{ name: 'Minstrel Project', extensions: ['mns'] }]
      })
      if (!chosenPath) {
        toast.info('Save cancelled.')
        return false
      }

      // 3. Derive the title from the chosen filename (no extension)
      const chosenFilename = chosenPath.split('/').pop() ?? 'untitled'
      const titleFromFilename = chosenFilename
        .replace(/\.mns$/i, '')
        .replace(/_/g, ' ')
        .trim()

      // 4. Build the project with the derived title + path, then persist
      const projectWithTitleAndPath = {
        ...projectToSave,
        title: titleFromFilename,
        projectPath: chosenPath
      }
      const created = await createSqliteProject(chosenPath, projectWithTitleAndPath)

      if (!created) {
        toast.error('Failed to create project file.')
        return false
      }

      // 5. Persist title + path to Redux so subsequent saves work normally
      dispatch(setProjectPath({ title: titleFromFilename, projectPath: chosenPath }))
      dispatch(setAllFilesAsSaved())
      await refreshRecentProjects(projectWithTitleAndPath)
      toast.success('Project saved!')
      return true
    }

    // ─── Regular save ─────────────────────────────────────────────────────────
    const saveResult = await saveProject(projectToSave)

    if (saveResult.success && saveResult.finalPath) {
      toast.success('Project saved successfully!')
      dispatch(setAllFilesAsSaved())

      const savedProject = {
        ...projectToSave,
        projectPath: saveResult.finalPath
      }

      if (currentPath !== saveResult.finalPath) {
        dispatch(setProjectPath({ title: projectToSave.title, projectPath: saveResult.finalPath }))
        toast.info('Project format updated to the latest version.')
      }

      await refreshRecentProjects(savedProject)
      return true
    }

    toast.error('Failed to save project.')
    return false
  }

  const saveAndClose = async () => {
    const result = await handleSave()
    if (result) await handleClose()
  }

  const handleCloseSafe = () => {
    if (projectsState.projectHasLiveEdits) {
      setAlertDialogOpen(true)
      return
    }
    void handleClose()
  }

  return (
    <>
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved changes. Closing will lose your progress.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleClose()}>Close without Saving</AlertDialogAction>
            <AlertDialogAction onClick={saveAndClose}>Save and Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-1 rounded-full border bg-background/80 p-1 shadow-sm backdrop-blur-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Save Project" onClick={handleSave} className="h-8 w-8 rounded-full">
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Save Project</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Close Project" onClick={handleCloseSafe} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close Project</TooltipContent>
        </Tooltip>

        <PdfExportConfigModal onExport={handleExportConfigured} triggerTooltip="Export Project to PDF">
          <Button variant="ghost" size="icon" aria-label="Export Project to PDF" disabled={isExporting} className="h-8 w-8 rounded-full">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          </Button>
        </PdfExportConfigModal>
      </div>
    </>
  )
}

export default ProjectBar
