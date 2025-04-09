import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { useDispatch, useSelector } from 'react-redux'
import llmService from '@/lib/services/llmService'
import { setActiveProject } from '@/lib/store/projectsSlice' // Assuming Project type is implicitly handled by this action
import { setActiveView } from '@/lib/store/appStateSlice'
import { useWizard, genres, sanitizeFilename } from '@/components/BookWizard/index'
import ReactMarkdown from 'react-markdown'
import { Loader2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { ProjectFile } from '@/types' // Assuming ProjectFile type exists in types.ts

interface SummaryStepProps {
  currentStep: number
  isActive: boolean
}

const SummaryStep = ({ isActive }: SummaryStepProps) => {
  const dispatch = useDispatch()
  const { formData } = useWizard()
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const settingsState = useSelector(selectSettingsState)

  const handleDream = async () => {
    if (!formData.title || !formData.genre || !formData.setting || !formData.plot) {
      console.error("Missing required fields to create project.");
      setGenerationError("Please ensure Title, Genre, Setting, and Plot are filled in previous steps.");
      return;
    }

    setIsGenerating(true)
    setStreamedText('')
    setGenerationError(null)

    const projectTitle = sanitizeFilename(formData.title)
    const projectPath = `${settingsState?.workingRootDirectory}/${projectTitle}.mns`

    const prompt = `Generate a detailed chapter-by-chapter outline for a ${formData.length || 'standard length'} ${formData.genre} story titled "${formData.title}".
Setting: ${formData.setting}.
Plot Summary: ${formData.plot}
${formData.writing_sample ? `Writing Sample/Style Guide:\n${formData.writing_sample}` : ''}
Please provide the output in Markdown format.`

    // Initial project structure (without outline file yet)
    const initialProjectData = {
      title: projectTitle,
      projectPath: projectPath,
      files: [] as ProjectFile[], // Initialize files array
      genre: formData.genre,
      summary: '', // Keep summary separate or remove if outline replaces it
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
      // Stream the content
      const stream = llmService.streamGenerateContent(prompt, 'high')
      let accumulatedText = ''
      for await (const delta of stream) {
        accumulatedText += delta
        setStreamedText(accumulatedText)
      }

      // --- Stream finished successfully ---
      console.log("Outline generation complete.")

      // Create the outline file object
      const outlineFile: ProjectFile = {
        title: 'Outline', // Standard name
        content: accumulatedText,
      };

      // Create the final project object including the outline file
      const projectWithOutline = {
        ...initialProjectData,
        files: [outlineFile], // Add the outline file
      };

      // Dispatch setActiveProject with the complete project data (including outline)
      dispatch(setActiveProject(projectWithOutline));

      setIsGenerating(false)
      dispatch(setActiveView('project/dashboard')) // Navigate after success

    } catch (error) {
      console.error("Error during outline streaming:", error)
      setGenerationError(`Failed to generate outline: ${error instanceof Error ? error.message : String(error)}`)
      setIsGenerating(false)
      // Do not set active project if generation failed
    }
  }

  const genreLabel = genres?.find(item => item.value === formData.genre)?.label || 'story'

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg text-center">
        <h2 className="text-lg font-semibold">Great! We&apos;re ready to create your {genreLabel} story outline.</h2>
        <p className="text-sm text-muted-foreground mt-1">This&apos;ll take a few seconds once you click the button. Just hang tight.</p>
      </div>

      {isActive && (
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg gap-4">
          <Button
            onClick={handleDream}
            disabled={isGenerating || !formData.title || !formData.genre || !formData.setting || !formData.plot}
          >
            {isGenerating ? 'Generating...' : "Let's Go!"}
            {isGenerating && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>
      )}

      {(isGenerating || streamedText || generationError) && isActive && (
        <div className="p-4 border rounded-lg bg-background space-y-2">
          {isGenerating && !streamedText && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting generation...
            </div>
          )}
          {streamedText && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{streamedText}</ReactMarkdown>
            </div>
          )}
          {generationError && (
            <p className="text-sm text-red-600 dark:text-red-500 mt-2">Error: {generationError}</p>
          )}
        </div>
      )}

      {!isActive && (
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm font-medium text-muted-foreground">Summary Step</p>
        </div>
      )}
    </div>
  )
}

export default SummaryStep
