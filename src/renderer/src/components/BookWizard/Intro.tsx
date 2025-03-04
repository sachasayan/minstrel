import { Button } from '@/components/ui/button'
import { useWizard, WizardNavigation, cheatData } from '@/components/BookWizard/index' // Updated import path for useWizard


const Intro = () => {
  const { setCurrentStep, setFormData, currentStep } = useWizard()
  const handleCheat = async () => {
    setFormData(cheatData)
    console.log('Cheating...')
    if (currentStep < 5) {
      setCurrentStep(5)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow space-y-4 flex flex-col items-center justify-center p-16 ">
        <h2 className="text-2xl font-bold text-center">Hello, Dreamer</h2>
        <p className="text-center text-sm text-gray-500">{`It's nice to meet you! Do you have an idea for a story, or should I come up with something? `}</p>
        <div className="flex flex-row w-full gap-4 justify-between">
          {/* <Button disabled>Start from existing file (Coming soon)</Button> */}
          <Button className="mx-1" onClick={handleCheat}>
            Help me!
          </Button>
          <Button onClick={() => setCurrentStep(1)}>{`I've got a story idea already.`} </Button>
        </div>
      </div>
      <WizardNavigation />
    </div>
  )
}

export default Intro
