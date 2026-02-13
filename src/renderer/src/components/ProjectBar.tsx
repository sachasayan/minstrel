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
import pdfService from '@/lib/services/pdfService'
import PdfExportConfigModal, { PdfExportConfig } from '@/components/PdfExportConfigModal'
import { Button } from '@/components/ui/button'
import { selectChatHistory } from '@/lib/store/chatSlice'
import { saveProject } from '@/lib/services/fileService'
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

const ProjectBar = () => {
  const dispatch = useDispatch()
  const activeProject = useSelector(selectActiveProject)
  const projectsState = useSelector(selectProjects)
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
    if (projectsState.activeProject) {
      const currentPath = projectsState.activeProject.projectPath
      const projectToSave = {
        ...projectsState.activeProject,
        chatHistory: currentChatHistory
      }
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
