import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FileDown, Loader2, Sparkles } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveProject, updateReviews } from '@/lib/store/projectsSlice'
import { runCritique } from '@/lib/assistants/criticAssistant'
import { AppDispatch, RootState } from '@/lib/store/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import pdfService from '@/lib/services/pdfService'
import PdfExportConfigModal, { PdfExportConfig } from './PdfExportConfigModal'

const FloatingToolbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const activeProject = useSelector(selectActiveProject)
  const settings = useSelector((state: RootState) => state.settings)
  const [isExporting, setIsExporting] = useState(false)
  const [isCritiquing, setIsCritiquing] = useState(false)

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

  const handleRunCritique = async () => {
    if (!activeProject || isCritiquing) return

    const outlineFile = activeProject.files.find(f => f.title.toLowerCase().includes('outline'))
    const outlineContent = outlineFile?.content || ''

    if (!outlineContent) {
      console.warn('Cannot run critique without an outline.')
      return
    }

    setIsCritiquing(true)
    console.log('[FloatingToolbar] Triggered story critique.')
    try {
      const result = await runCritique(settings, outlineContent, activeProject.storyContent)
      if (result) {
        console.log('[FloatingToolbar] Critique result received, updating store.')
        dispatch(updateReviews(result))
      }
    } catch (err) {
      console.error('[FloatingToolbar] Failed to run critique:', err)
    } finally {
      setIsCritiquing(false)
    }
  }

  if (!activeProject) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg border border-border">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRunCritique}
              disabled={isCritiquing}
              aria-label="Critique Story"
              className={cn(isCritiquing && 'animate-pulse')}
            >
              {isCritiquing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Critique Story</TooltipContent>
        </Tooltip>

        <PdfExportConfigModal onExport={handleExportConfigured}>
          <Button
            variant="outline"
            size="icon"
            title="Export Project to PDF"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
          </Button>
        </PdfExportConfigModal>
      </div>
    </div>
  )
}

export default FloatingToolbar
