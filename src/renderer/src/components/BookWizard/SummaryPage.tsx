import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { useDispatch, useSelector } from 'react-redux'
import { generateSkeleton } from '@/lib/services/chatService'
import { setActiveProject } from '@/lib/store/projectsSlice'
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
        projectPath: `${settingsState?.workingRootDirectory}/${projectTitle}`,
        files: [],
        genre: formData.genre,
        summary: '',
        writingSample: formData.writing_sample,
        year: new Date().getFullYear(),
        wordCountCurrent: 0,
        wordCountTarget: 0,
        expertSuggestions: [],
        knowledgeGraph: null
      })
    )
    generateSkeleton(formData)
    setRequestPending(true)
  }

  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <div className="flex flex-row w-full justify-between mt-6 gap-4 align-center">
          <DialogTitle className="leading-2 ">{currentStep}/5 </DialogTitle>
          <Progress value={(currentStep / (totalSteps - 1)) * 100} className="mb-4" />
        </div>
      </DialogHeader>
      <div className="flex-grow flex flex-col items-center justify-center p-8 gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Great. We&apos;re ready to create your {genres?.find((item) => item.value === formData.genre)?.label} story.</h2>
          <p className="text-sm text-gray-500">This&apos;ll take a few seconds. Just hang tight.</p>
        </div>
        <div className="flex flex-row items-center justify-center">
          {!requestPending && <Button onClick={handleDream}>I&apos;m ready!</Button>}
          {!!requestPending && (
            <Button disabled>
              Creating your story...
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
