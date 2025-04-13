import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useWizard, sanitizeFilename } from '@/components/BookWizard/index'
import minstrelIcon from '@/assets/bot/base.png' // <-- Import icon

interface TitleStepProps {
  handleProceed: (nextStep: number) => void
  currentStep: number
  isActive: boolean
}

const TitleStep = ({ handleProceed, currentStep, isActive }: TitleStepProps) => {
  const { formData, setFormData } = useWizard()

  const onNextClick = () => {
    if (formData.title) handleProceed(currentStep + 1)
  }

  return (
    <div className="space-y-4">
      {/* Assistant Message */}
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow"> {/* Applied chat colors */}
          <p className="text-sm font-semibold">Now, what should we call your story?</p>
        </div>
      </div>

      {isActive ? (
        <>
          <div className="p-4 border rounded-lg space-y-2">
            <Input
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter a working title"
            />
            <p className="text-xs text-muted-foreground pt-1">
              {formData.title ? `Folder: "${sanitizeFilename(formData.title)}.mns"` : ' '}
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={onNextClick} disabled={!formData.title}>
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm font-medium text-muted-foreground">Title:</p>
          <p className="text-sm">{formData.title || 'Not set'}</p>
        </div>
      )}
    </div>
  )
}

export default TitleStep
