import React, { useState, useMemo } from 'react'
import { PDFViewer } from '@react-pdf/renderer'; // Import PDFViewer
import { useSelector } from 'react-redux'; // Import useSelector
import { selectActiveProject } from '@/lib/store/projectsSlice'; // Import selector
import { ProjectPdfDocument } from '@/lib/services/pdfService'; // Import the document component
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

// --- Configuration Options ---
const fontOptions = [
  { value: 'Times-Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica/Arial' },
  { value: 'Courier', label: 'Courier New' },
]

// Paper sizes with values expected by @react-pdf/renderer
// Standard names or [width, height] in points (1 inch = 72 points)
const paperSizeOptions = [
  { value: 'A4', label: 'A4 (210 x 297 mm)' },
  { value: 'Letter', label: 'Letter (8.5 x 11 in)' },
  { value: '6x9', label: '6 x 9 inches', dimensions: [432, 648] }, // 6*72, 9*72
  { value: '5.5x8.5', label: '5.5 x 8.5 inches', dimensions: [396, 612] }, // 5.5*72, 8.5*72
]

// --- Component Props ---
export interface PdfExportConfig {
  fontFamily: string
  paperSizeValue: string // Store the selected value ('A4', 'Letter', '6x9', etc.)
  paperSize: 'A4' | 'Letter' | [number, number] // Actual value for @react-pdf
}

interface PdfExportConfigModalProps {
  children: React.ReactNode // Trigger element
  onExport: (config: PdfExportConfig) => void

}

// --- Component ---
const PdfExportConfigModal: React.FC<PdfExportConfigModalProps> = ({ children, onExport }) => {
  const [selectedFont, setSelectedFont] = useState<string>(fontOptions[0].value)
  const [selectedPaperSizeValue, setSelectedPaperSizeValue] = useState<string>(paperSizeOptions[0].value)
  const [isOpen, setIsOpen] = useState(false); // Control dialog open state
  const activeProject = useSelector(selectActiveProject); // Get active project

  // Memoize the current config for the preview
  const currentPreviewConfig = useMemo((): PdfExportConfig | null => {
    const selectedSizeOption = paperSizeOptions.find(opt => opt.value === selectedPaperSizeValue);
    const paperSizeForPdf = selectedSizeOption?.dimensions
      ? (selectedSizeOption.dimensions as [number, number])
      : (selectedSizeOption?.value as 'A4' | 'Letter');

    if (!paperSizeForPdf) return null; // Return null if size is invalid

    return {
      fontFamily: selectedFont,
      paperSizeValue: selectedPaperSizeValue,
      paperSize: paperSizeForPdf,
    };
  }, [selectedFont, selectedPaperSizeValue]);


  const handleExportClick = () => {
    const selectedSizeOption = paperSizeOptions.find(opt => opt.value === selectedPaperSizeValue)
    const paperSizeForPdf = selectedSizeOption?.dimensions ?? selectedSizeOption?.value as 'A4' | 'Letter' // Use dimensions if available, else standard name

    if (!paperSizeForPdf) {
      console.error("Selected paper size option not found!");
      return; // Should not happen
    }

    // Assert that dimensions is [number, number] if it exists
    const finalPaperSize = selectedSizeOption?.dimensions
      ? (selectedSizeOption.dimensions as [number, number])
      : (selectedSizeOption?.value as 'A4' | 'Letter');

    if (!finalPaperSize) {
       console.error("Could not determine final paper size!");
       return;
    }

    onExport({
      fontFamily: selectedFont,
      paperSizeValue: selectedPaperSizeValue,
      paperSize: finalPaperSize, // Use the correctly typed value
    })
    setIsOpen(false); // Close dialog after export click
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* Increase max width and height for preview */}
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PDF Export Options</DialogTitle>
          <DialogDescription>
            Configure the appearance of your exported PDF document.
          </DialogDescription>
        </DialogHeader>
        {/* Use flex layout for options and preview */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {/* Options Panel */}
          <div className="md:col-span-1 space-y-4 py-4 pr-4 border-r">
            {/* Font Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="font-family" className="text-right">
              Font
            </Label>
            <Select value={selectedFont} onValueChange={setSelectedFont}>
              <SelectTrigger id="font-family" className="col-span-3">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Paper Size Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paper-size" className="text-right">
              Paper Size
            </Label>
            <Select value={selectedPaperSizeValue} onValueChange={setSelectedPaperSizeValue}>
              <SelectTrigger id="paper-size" className="col-span-3">
                <SelectValue placeholder="Select paper size" />
              </SelectTrigger>
              <SelectContent>
                {paperSizeOptions.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* End Options Panel */}
          </div>

          {/* Preview Panel */}
          {/* Changed bg-gray-100 to bg-muted and added border */}
          <div className="md:col-span-2 h-full overflow-hidden bg-muted rounded border border-border">
            {activeProject && currentPreviewConfig ? (
              <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
                <ProjectPdfDocument project={activeProject} config={currentPreviewConfig} />
              </PDFViewer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                { !activeProject ? "No active project for preview." : "Select valid options for preview."}
              </div>
            )}
          </div>
        {/* End Flex Layout */}
        </div>
        <DialogFooter className="mt-4"> {/* Add margin top to footer */}
          <DialogClose asChild>
             <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleExportClick}>Export PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PdfExportConfigModal
