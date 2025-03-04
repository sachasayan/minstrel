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
      <div className="flex-grow flex flex-col gap-4 py-4">


        <Label htmlFor="plot">Basic Plot</Label>

        <Textarea
          id="plot"
          placeholder="Describe main characters, environments, what the story is about, and what the climax might be. We recommend at least 200 characters."
          value={formData.plot || ''}
          onChange={handlePlotChange}
          className="mb-2 flex-grow"
        />
        <div className="text-sm text-gray-500 flex justify-between gap-4 items-top">
          <span>{`i.e "A team of explorers discovers a hidden artifact on a remote alien planet, unleashing an ancient power that threatens the galaxy."`}</span>
        </div>

      </div>
      <WizardNavigation />
    </div>
  )
}

export default PlotPage
