import { useState } from 'react'
import { Button } from '@/components/ui/button'
// Removed DialogHeader, DialogTitle import
// Removed Progress import
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { useDispatch, useSelector } from 'react-redux'
import { generateOutlineFromParams } from '@/lib/services/chatService' // Updated import
import { setActiveProject } from '@/lib/store/projectsSlice'
import { setActiveView } from '@/lib/store/appStateSlice' // Add setActiveView import
import { useWizard, genres, sanitizeFilename, WizardNavigation } from '@/components/BookWizard/index'


const SummaryPage = () => {
  const dispatch = useDispatch()
  const { currentStep, formData, totalSteps } = useWizard()
  const [requestPending, setRequestPending] = useState(false)
  const settingsState = useSelector(selectSettingsState)

  const handleDream = async () => {
    const projectTitle = sanitizeFilename(formData.title || 'Untitled Project')

    dispatch(
      setActiveProject({
        title: projectTitle,
        projectPath: `${settingsState?.workingRootDirectory}/${projectTitle}.mns`,
        files: [],
        genre: formData.genre,
        summary: '',
        writingSample: formData.writing_sample,
        year: new Date().getFullYear(),
        wordCountCurrent: 0,
        wordCountTarget: 0,
        expertSuggestions: [],
        knowledgeGraph: null
        // chatHistory and cover fields will be populated later or default
      })
    )
    // Navigate to dashboard after setting project
    dispatch(setActiveView('project/dashboard'))
    // Call the renamed function to generate the initial outline
    generateOutlineFromParams(formData)
    setRequestPending(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Removed DialogHeader */}
      <div className="flex flex-row w-full justify-between mt-6 gap-4 items-center"> {/* Added items-center */}
        {/* Replaced DialogTitle with a span */}
        <span className="leading-2 font-semibold">{currentStep}/5 </span>
        {/* Removed Progress component */}
      </div>
      {/* End of removed DialogHeader section */}
      <div className="flex-grow flex flex-col items-center justify-center p-8 gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Great. We&apos;re ready to create your {genres?.find((item) => item.value === formData.genre)?.label} story outline.</h2> {/* Updated text */}
          <p className="text-sm text-gray-500">This&apos;ll take a few seconds. Just hang tight.</p>
        </div>
        <div className="flex flex-row items-center justify-center">
          {!requestPending && <Button onClick={handleDream}>I&apos;m ready!</Button>}
          {!!requestPending && (
            <Button disabled>
              Generating initial outline... {/* Updated text */}
              <div className="flex items-center justify-center p-2">
                <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1"></div>
                <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-75"></div>
                <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-150"></div>
              </div>
            </Button>
          )}
        </div>
      </div>
      <WizardNavigation />
    </div>
  )
}

export default SummaryPage
