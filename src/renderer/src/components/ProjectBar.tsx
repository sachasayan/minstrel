import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { FileDown, Loader2, Save, X } from 'lucide-react'
import {
  selectActiveProject,
  selectProjects,
  setActiveProject,
  setAllFilesAsSaved,
  setProjectHasLiveEdits,
  updateMetaProperty
} from '@/lib/store/projectsSlice'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import pdfService from '@/lib/services/pdfService'
import PdfExportConfigModal, { PdfExportConfig } from '@/components/PdfExportConfigModal'
import { Button } from '@/components/ui/button'
import { selectChatHistory } from '@/lib/store/chatSlice'
import { saveProject, createSqliteProject } from '@/lib/services/fileService'
import { setActiveView } from '@/lib/store/appStateSlice'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

/** Converts a project title into a safe file-system base name. */
const sanitizeFilename = (title: string): string =>
  title
    .trim()
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .slice(0, 80) || 'untitled_project'

const PLACEHOLDER_TITLE = 'Untitled Project'

const ProjectBar = () => {
  const dispatch = useDispatch()
  const activeProject = useSelector(selectActiveProject)
  const projectsState = useSelector(selectProjects)
  const settings = useSelector(selectSettingsState)
  const currentChatHistory = useSelector(selectChatHistory)
  const [isExporting, setIsExporting] = useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)

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

  const handleClose = () => {
    dispatch(setProjectHasLiveEdits(false))
    dispatch(setActiveProject(null))
    dispatch(setActiveView('intro'))
  }

  const handleSave = async () => {
    if (!projectsState.activeProject) return false

    const currentPath = projectsState.activeProject.projectPath
    const projectToSave = {
      ...projectsState.activeProject,
      chatHistory: currentChatHistory
    }

    // ─── First-time save: no path yet ────────────────────────────────────────
    if (!currentPath) {
      // 1. Validate title
      if (!projectToSave.title || projectToSave.title === PLACEHOLDER_TITLE) {
        toast.error('Please give your story a title before saving.', {
          description: 'Click the title at the top of the editor to rename it.'
        })
        return false
      }

      // 2. Resolve the save directory
      let saveDir = settings.workingRootDirectory
      if (!saveDir) {
        saveDir = await window.electron.ipcRenderer.invoke('select-directory', 'save')
        if (!saveDir) {
          toast.info('Save cancelled — no folder selected.')
          return false
        }
      }

      // 3. Build the full path and create the project file
      const filename = sanitizeFilename(projectToSave.title)
      const newPath = `${saveDir}/${filename}.mns`
      const created = await createSqliteProject(newPath, projectToSave)

      if (!created) {
        toast.error('Failed to create project file.')
        return false
      }

      // 4. Persist the new path to Redux so subsequent saves work normally
      dispatch(updateMetaProperty({ property: 'projectPath', value: newPath }))
      dispatch(setAllFilesAsSaved())
      toast.success('Project saved!')
      return true
    }

    // ─── Regular save ─────────────────────────────────────────────────────────
    const saveResult = await saveProject(projectToSave)

    if (saveResult.success && saveResult.finalPath) {
      toast.success('Project saved successfully!')
      dispatch(setAllFilesAsSaved())

      if (currentPath !== saveResult.finalPath) {
        dispatch(updateMetaProperty({ property: 'projectPath', value: saveResult.finalPath }))
        toast.info('Project format updated to the latest version.')
      }
      return true
    }

    toast.error('Failed to save project.')
    return false
  }

  const saveAndClose = async () => {
    const result = await handleSave()
    if (result) handleClose()
  }

  const handleCloseSafe = () => {
    if (projectsState.projectHasLiveEdits) {
      setAlertDialogOpen(true)
      return
    }
    handleClose()
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
            <AlertDialogAction onClick={handleClose}>Close without Saving</AlertDialogAction>
            <AlertDialogAction onClick={saveAndClose}>Save and Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-2 rounded-full border p-2">
        <Button
          variant="outline"
          size="icon"
          title="Save Project"
          onClick={handleSave}
          className="h-7 w-7 rounded-full"
        >
          <Save className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Close Project"
          onClick={handleCloseSafe}
          className="h-7 w-7 rounded-full"
        >
          <X className="h-3 w-3" />
        </Button>
        <PdfExportConfigModal onExport={handleExportConfigured}>
          <Button
            variant="outline"
            size="icon"
            title="Export Project to PDF"
            disabled={isExporting}
            className="h-7 w-7 rounded-full"
          >
            {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
          </Button>
        </PdfExportConfigModal>
      </div>
    </>
  )
}

export default ProjectBar
