import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useWizard, WizardNavigation } from '@/components/BookWizard/index' // Updated imports


const PlotPage = () => {
  const { currentStep, formData, setFormData, totalSteps } = useWizard()

  const handlePlotChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, plot: e.target.value })
  }

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
          <Label htmlFor="plot">Basic Plot</Label>

          <p className="text-sm text-gray-500">We recommend at least 200 characters.</p>
          <Textarea
            id="plot"
            placeholder="Describe main characters, environments, what the story is about, and what the climax might be."
            value={formData.plot || ''}
            onChange={handlePlotChange}
            className="mb-2"
          />
        </div>
      </div>
      <WizardNavigation />
    </div>
  )
}

export default PlotPage
