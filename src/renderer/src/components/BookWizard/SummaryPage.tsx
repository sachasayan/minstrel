import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { useDispatch, useSelector } from 'react-redux'
import { generateOutlineFromParams } from '@/lib/services/chatService'
import { setActiveProject } from '@/lib/store/projectsSlice'
import { setActiveView } from '@/lib/store/appStateSlice'
import { useWizard, genres, sanitizeFilename } from '@/components/BookWizard/index'

interface SummaryStepProps {
  currentStep: number
  isActive: boolean
}

const SummaryStep = ({ isActive }: SummaryStepProps) => {
  const dispatch = useDispatch()
  const { formData } = useWizard()
  const [requestPending, setRequestPending] = useState(false)
  const settingsState = useSelector(selectSettingsState)

  const handleDream = async () => {
    if (!formData.title || !formData.genre || !formData.setting || !formData.plot) {
      console.error("Missing required fields to create project.");
      return;
    }

    setRequestPending(true)
    const projectTitle = sanitizeFilename(formData.title)
    const projectPath = `${settingsState?.workingRootDirectory}/${projectTitle}.mns`

    const newProject = {
      title: projectTitle,
      projectPath: projectPath,
      files: [],
      genre: formData.genre,
      summary: '',
      writingSample: formData.writing_sample || '',
      year: new Date().getFullYear(),
      wordCountCurrent: 0,
      wordCountTarget: formData.length || 0,
      expertSuggestions: [],
      knowledgeGraph: null,
      chatHistory: [],
      coverImageBase64: null,
      coverImageMimeType: null,
      cover: undefined,
    };

    try {
      dispatch(setActiveProject(newProject))

      // Move navigation to after outline generation completes
      await generateOutlineFromParams(formData)
      // Add a slight delay for UX feedback if needed (optional)
      dispatch(setActiveView('project/dashboard'))

      setRequestPending(false) // Not necessary if we navigate away
    } catch (error) {
      console.error("Error during outline generation:", error)
      setRequestPending(false)
      // Add error handling (e.g., toast notification)
    }
  }

  const genreLabel = genres?.find(item => item.value === formData.genre)?.label || 'story'

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg text-center">
        <h2 className="text-lg font-semibold">Great! We're ready to create your {genreLabel} story outline.</h2>
        <p className="text-sm text-muted-foreground mt-1">This'll take a few seconds once you click the button. Just hang tight.</p>
      </div>

      {isActive ? (
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg gap-4">
          <div className="flex flex-row items-center justify-center">
            {!requestPending && (
              <Button onClick={handleDream}
                disabled={!formData.title || !formData.genre || !formData.setting || !formData.plot}>
                Let's Go!
              </Button>
            )}
            {requestPending && (
              <Button disabled>
                Generating initial outline...
                <div className="flex items-center justify-center p-2 ml-2">
                  <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1"></div>
                  <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-75"></div>
                  <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-150"></div>
                </div>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm font-medium text-muted-foreground">Summary Complete</p>
        </div>
      )}
    </div>
  )
}

export default SummaryStep
