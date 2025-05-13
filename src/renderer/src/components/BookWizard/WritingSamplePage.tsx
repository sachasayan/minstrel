import { useMemo } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useWizard } from '@/components/BookWizard'
import minstrelIcon from '@/assets/bot/base.png'

// Define props type
interface WritingSampleStepProps {
  handleProceed: (nextStep: number) => void
  currentStep: number
  isActive: boolean
}

const WritingSampleStep = ({ handleProceed, currentStep, isActive }: WritingSampleStepProps) => {
  const { formData, setFormData } = useWizard()

  const onNextClick = () => {
    // No validation needed as it's optional
    handleProceed(currentStep + 1)
  }

  // Generate a summary snippet for inactive view
  const sampleSnippet = useMemo(() => {
    const sampleText = formData.writing_sample || '';
    if (!sampleText) return 'Skipped';
    return sampleText.length > 100 ? sampleText.substring(0, 100) + '...' : sampleText;
  }, [formData.writing_sample]);


  return (
    <div className="space-y-4">
      {/* Assistant Message */}
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow"> {/* Applied chat colors */}
          <p className="text-sm font-semibold">
            Almost there! If you have a sample of your writing style you&apos;d like the AI to emulate, paste it here. This is optional, feel free to skip it. {/* Escaped apostrophe */}
          </p>
        </div>
      </div>

      {/* Conditional Rendering based on isActive */}
      {isActive ? (
        <>
          {/* Input Section - Rendered only when active */}
          <div className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor="writing_sample">Writing Sample (Optional)</Label>
            <Textarea
              id="writing_sample"
              placeholder="Provide an optional writing sample. The tool will mirror your writing style."
              value={formData.writing_sample || ''}
              onChange={(e) => setFormData({ ...formData, writing_sample: e.target.value })}
              className="min-h-[150px]"
            />
          </div>

          {/* Next Button - Always enabled, Rendered only when active */}
          <div className="flex justify-end">
            <Button onClick={onNextClick}>
              Next
            </Button>
          </div>
        </>
      ) : (
        // Summary View - Rendered when not active
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm whitespace-pre-wrap">{sampleSnippet}</p>
        </div>
      )}
    </div>
  )
}

export default WritingSampleStep
