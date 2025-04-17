import React, { useState } from 'react' // Import useState
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react' // Import Loader2
import { useSelector } from 'react-redux'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { toast } from 'sonner'
import pdfService from '@/lib/services/pdfService' // Import the service

const FloatingToolbar: React.FC = () => {
  const activeProject = useSelector(selectActiveProject)
  const [isExporting, setIsExporting] = useState(false) // State for loading indicator

  const handleExportClick = async () => { // Make async
    if (!activeProject || isExporting) {
      if (!activeProject) toast.error('No active project to export.')
      return
    }

    setIsExporting(true)
    const exportToastId = toast.loading(`Generating PDF for ${activeProject.title}...`)

    try {
      const blob = await pdfService.generateProjectPdf(activeProject)

      if (blob) {
        const filename = `${activeProject.title || 'Untitled Project'}.pdf`
        pdfService.triggerDownload(blob, filename)
        toast.success(`Successfully exported ${filename}`, { id: exportToastId })
      } else {
        // Error toast is handled within generateProjectPdf
        toast.dismiss(exportToastId) // Dismiss loading toast if blob is null
      }
    } catch (error) {
      // Catch any unexpected errors during the process
      console.error('Unexpected error during PDF export:', error)
      toast.error('An unexpected error occurred during PDF export.', { id: exportToastId })
    } finally {
      setIsExporting(false)
    }
  }

  // Only render the toolbar if there is an active project
  if (!activeProject) {
    return null
  }

  return (
    // Changed positioning classes: removed right-4, added left-1/2 -translate-x-1/2
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg border border-border">
      <Button
        variant="outline"
        size="icon"
        onClick={handleExportClick}
        title="Export Project to PDF"
        disabled={isExporting} // Disable button while exporting
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

export default FloatingToolbar
