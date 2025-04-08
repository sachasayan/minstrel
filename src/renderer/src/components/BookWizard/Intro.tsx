import { Button } from '@/components/ui/button'
import { useWizard, cheatData } from '@/components/BookWizard/index' // Removed WizardNavigation import

const Intro = () => {
  const { setCurrentStep, setFormData } = useWizard() // Removed currentStep as it's always 0 here

  const handleCheat = async () => {
    setFormData(cheatData)
    console.log('Cheating... setting form data and skipping to summary.')
    // Skip directly to the summary step (now step 7)
    setCurrentStep(7)
  }

  return (
    // Removed h-full and flex-col as the parent now controls layout
    <div className="flex-grow space-y-4 flex flex-col items-center justify-center p-16 ">
      <h2 className="text-2xl font-bold text-center">Hello, Dreamer</h2>
      <p className="text-center text-sm text-gray-500">{`It's nice to meet you! Do you have an idea for a story, or should I come up with something? `}</p>
      <div className="flex flex-row w-full gap-4 justify-between">
        {/* <Button disabled>Start from existing file (Coming soon)</Button> */}
        <Button className="mx-1" onClick={handleCheat}>
          Help me!
        </Button>
        {/* Start the regular flow at step 1 */}
        <Button onClick={() => setCurrentStep(1)}>{`I've got a story idea already.`} </Button>
      </div>
      {/* Removed WizardNavigation component */}
    </div>
  )
}

export default Intro
