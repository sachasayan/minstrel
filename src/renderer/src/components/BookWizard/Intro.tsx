import { Button } from '@/components/ui/button'
import { useWizard, cheatData } from '@/components/BookWizard/index'
import minstrelIcon from '@/assets/bot/base.png' // <-- Import icon

const Intro = () => {
  const { setCurrentStep, setFormData, setSelectedCoverPath } = useWizard() // <-- Get setter

  const handleCheat = async () => {
    setFormData(cheatData)
    // Also set the cover path from cheatData
    if (cheatData.coverPath && setSelectedCoverPath) {
      setSelectedCoverPath(cheatData.coverPath)
    }
    console.log('Cheating... setting form data and skipping to summary.')
    // Skip directly to the summary step (now step 8)
    setCurrentStep(8)
  }

  return (

    // Restyled to match chat bubble format
    <div className="space-y-4"> {/* Outer container */}
      <div className="flex items-start gap-3"> {/* Icon + Bubble container */}
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow"> {/* Bubble */}
          <h2 className="text-lg font-semibold mb-1">Hello, Dreamer!</h2> {/* Adjusted heading size */}
          <p className="text-sm mb-4">{`A new story! that's great! Do you have an idea, or should I come up with something? `}</p> {/* Removed text-gray-500 */}

          {/* Buttons moved inside the bubble */}
          <div className="flex flex-row gap-2 justify-end mt-4">
            <Button variant="secondary" size="sm" onClick={handleCheat}> {/* Adjusted variant/size */}
              Help me!
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCurrentStep(1)}> {/* Adjusted variant/size */}
              {`I've got a story idea already.`}
            </Button>
          </div>
        </div>
      </div>
      {/* No separate "Next" button needed for Intro step */}
    </div>
  )
}

export default Intro
