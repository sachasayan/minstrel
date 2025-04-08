import { useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
// Removed Label import
import { Button } from '@/components/ui/button'
import { useWizard, novelLengths } from '@/components/BookWizard/index'

// Define props type
interface StoryLengthStepProps {
  handleProceed: (nextStep: number) => void
  currentStep: number
  isActive: boolean // Added isActive prop
}

const StoryLengthStep = ({ handleProceed, currentStep, isActive }: StoryLengthStepProps) => {
  const { formData, setFormData } = useWizard()

  // Find the label for the current length
  const currentLengthLabel = novelLengths.find((length) => length.value >= (formData.length || 0))?.label || novelLengths[0].label;

  // Set default length if not present
  useEffect(() => {
    if (formData.length == null) {
      setFormData({ ...formData, length: 50000 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount

  const onNextClick = () => {
    handleProceed(currentStep + 1)
  }

  return (
    <div className="space-y-4"> {/* Reduced outer spacing */}
      {/* Assistant Message Style - Always visible */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm font-semibold">How long of a story are we writing?</p>
        {/* Optional: Add the introductory text here if needed */}
        {/* <p className="text-sm mt-1">
            Okay, let me walk you through the steps...
        </p> */}
      </div>

      {/* Conditional Rendering based on isActive */}
      {isActive ? (
        <>
          {/* Input Section - Rendered only when active */}
          <div className="space-y-4 p-4 border rounded-lg">
            <Slider
              defaultValue={[formData.length || 50000]}
              value={[formData.length || 50000]}
              max={120000}
              min={1000}
              step={1000}
              onValueChange={(value) => setFormData({ ...formData, length: value[0] })}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1k</span>
              <span>50k</span>
              <span>120k+</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {currentLengthLabel}
            </p>
          </div>

          {/* Next Button - Rendered only when active */}
          <div className="flex justify-end">
            <Button onClick={onNextClick}>
              Next
            </Button>
          </div>
        </>
      ) : (
        // Summary View - Rendered when not active
        <div className="p-4 border rounded-lg bg-background"> {/* Use background color */}
          <p className="text-sm font-medium text-muted-foreground">Selected Length:</p>
          <p className="text-sm">{currentLengthLabel} (~{formData.length?.toLocaleString()} words)</p>
        </div>
      )}
    </div>
  )
}

export default StoryLengthStep
