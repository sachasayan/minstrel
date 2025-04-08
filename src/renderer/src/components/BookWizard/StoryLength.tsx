import { useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
// Removed DialogHeader, DialogTitle import
// Removed Progress import
import { useWizard, WizardNavigation, novelLengths } from '@/components/BookWizard/index' // Updated imports


const StoryLength = () => {
  const { currentStep, formData, setFormData, totalSteps } = useWizard()

  useEffect(() => {
    setFormData(formData.length || 50000)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Removed DialogHeader */}
      <div className="flex flex-row w-full justify-between mt-6 gap-4 items-center"> {/* Added items-center */}
        {/* Replaced DialogTitle with a span */}
        <span className="leading-2 font-semibold">{currentStep}/5 </span>
        {/* Removed Progress component */}
      </div>
      {/* End of removed DialogHeader section */}
      <div className="flex-grow flex flex-col justify-center gap-4">
        <div>
          <p className="text-sm text-gray-500">{`Okay, let me walk you through the steps. First let's get an idea of where we should go with this. Don't worry, we can change everything later.`}</p>
        </div>
        <div>
          <Label>How long of a story are we writing?</Label>
          <Slider defaultValue={[50000]} max={120000} step={1} onValueChange={(value) => setFormData({ ...formData, length: value[0] })} className="mt-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {novelLengths.map((length) => (
              <span key={length.value}>{length.value}</span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">{novelLengths.find((length) => length.value >= (formData.length || 0))?.label}</p>
        </div>
      </div>
      <WizardNavigation />
    </div>
  )
}

export default StoryLength
