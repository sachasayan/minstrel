import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
// Removed DialogHeader, DialogTitle import
// Removed Progress import
import { useWizard, WizardNavigation } from '@/components/BookWizard'


const WritingSamplePage = () => {
  const { currentStep, formData, setFormData, totalSteps } = useWizard()

  return (
    <div className="flex flex-col h-full">
      {/* Removed DialogHeader */}
      <div className="flex flex-row w-full justify-between mt-6 gap-4 items-center"> {/* Added items-center */}
        {/* Replaced DialogTitle with a span */}
        <span className="leading-2 font-semibold">{currentStep}/5 </span>
        {/* Removed Progress component */}
      </div>
      {/* End of removed DialogHeader section */}
      <div className="flex-grow flex flex-col  gap-4 py-4">

        <Label htmlFor="writing_sample">Writing Sample</Label>
        <Textarea
          className="flex-grow"
          id="writing_sample"
          placeholder="Provide an optional writing sample. The tool will mirror your writing style."
          value={formData.writing_sample || ''}
          onChange={(e) => setFormData({ ...formData, writing_sample: e.target.value })}
        />

      </div>
      <WizardNavigation />
    </div>
  )
}

export default WritingSamplePage
