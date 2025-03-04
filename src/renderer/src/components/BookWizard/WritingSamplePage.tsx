import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useWizard, WizardNavigation } from '@/components/BookWizard'


const WritingSamplePage = () => {
  const { currentStep, formData, setFormData, totalSteps } = useWizard()

  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <div className="flex flex-row w-full justify-between mt-6 gap-4 align-center">
          <DialogTitle className="leading-2 ">{currentStep}/5 </DialogTitle>
          <Progress value={(currentStep / (totalSteps - 1)) * 100} className="mb-4" />
        </div>
      </DialogHeader>
      <div className="flex-grow flex flex-col items-center justify-center gap-4">
        <div>
          <Label htmlFor="writing_sample">Writing Sample</Label>
          <Textarea
            id="writing_sample"
            placeholder="Provide a writing sample. The tool will mirror your writing style."
            value={formData.writing_sample || ''}
            onChange={(e) => setFormData({ ...formData, writing_sample: e.target.value })}
          />
        </div>
      </div>
      <WizardNavigation />
    </div>
  )
}

export default WritingSamplePage
