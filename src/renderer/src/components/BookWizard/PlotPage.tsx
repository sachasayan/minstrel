import { useMemo } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useWizard } from '@/components/BookWizard/index'

// Define props type
interface PlotStepProps {
  handleProceed: (nextStep: number) => void
  currentStep: number
  isActive: boolean
}

const PlotStep = ({ handleProceed, currentStep, isActive }: PlotStepProps) => {
  const { formData, setFormData } = useWizard()

  const handlePlotChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, plot: e.target.value })
  }

  const isNextDisabled = useMemo(() => {
    // Disable if plot is empty or just whitespace
    return !formData.plot?.trim()
  }, [formData.plot])

  const onNextClick = () => {
    if (!isNextDisabled) {
      handleProceed(currentStep + 1)
    }
  }

  // Generate a summary snippet for inactive view
  const plotSnippet = useMemo(() => {
    const plotText = formData.plot || '';
    return plotText.length > 100 ? plotText.substring(0, 100) + '...' : plotText;
  }, [formData.plot]);


  return (
    <div className="space-y-4"> {/* Reduced outer spacing */}
      {/* Assistant Message Style - Always visible */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm font-semibold">
          Excellent. Now, let's sketch out the core story. Describe the main characters, environments, what the story is generally about, and perhaps the climax. Don't worry about perfection, just the basics!
        </p>
      </div>

      {/* Conditional Rendering based on isActive */}
      {isActive ? (
        <>
          {/* Input Section - Rendered only when active */}
          <div className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor="plot">Basic Plot</Label>
            <Textarea
              id="plot"
              placeholder="Describe main characters, environments, what the story is about, and what the climax might be. We recommend at least 200 characters."
              value={formData.plot || ''}
              onChange={handlePlotChange}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground pt-1">
              {`e.g., "A team of explorers discovers a hidden artifact on a remote alien planet, unleashing an ancient power that threatens the galaxy."`}
            </p>
          </div>

          {/* Next Button - Rendered only when active */}
          <div className="flex justify-end">
            <Button onClick={onNextClick} disabled={isNextDisabled}>
              Next
            </Button>
          </div>
        </>
      ) : (
        // Summary View - Rendered when not active
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm font-medium text-muted-foreground">Plot Summary:</p>
          <p className="text-sm whitespace-pre-wrap">{plotSnippet || 'Not set'}</p>
        </div>
      )}
    </div>
  )
}

export default PlotStep
