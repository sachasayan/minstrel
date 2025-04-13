import { useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { useWizard, novelLengths } from '@/components/BookWizard/index'
import minstrelIcon from '@/assets/bot/base.png'

// Define props type
interface StoryLengthStepProps {
  handleProceed: (nextStep: number) => void
  currentStep: number
  isActive: boolean
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
  }, [])

  const onNextClick = () => {
    handleProceed(currentStep + 1)
  }

  return (
    <div className="space-y-4"> {/* Reduced outer spacing */}
      {/* Assistant Message Style - Always visible */}
      {/* Wrap icon and message bubble in a flex container */}
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" /> {/* Icon */}
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow"> {/* Message Bubble - Applied chat colors */}
          <p className="text-sm font-semibold">Got it! How long of a story are we writing?</p>
          {/* Optional text can go here if needed */}
        </div>
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
          <p className="text-sm">Let&apos;s write a {currentLengthLabel} (~{formData.length?.toLocaleString()} words)</p>
        </div>
      )}
    </div>
  )
}

export default StoryLengthStep
