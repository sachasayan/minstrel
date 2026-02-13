import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { useDispatch, useSelector } from 'react-redux'
import llmService from '@/lib/services/llmService'
import { setActiveProject } from '@/lib/store/projectsSlice' // Assuming Project type is implicitly handled by this action
import { setActiveView } from '@/lib/store/appStateSlice'
import { useWizard, genres, sanitizeFilename } from '@/components/BookWizard/index'
import { bookCovers } from '@/assets/book-covers'
import ReactMarkdown from 'react-markdown'
import { Loader2 } from 'lucide-react'
import minstrelIcon from '@/assets/bot/base.png'
// import { v4 as uuidv4 } from 'uuid'
import type { ProjectFile, Project } from '@/types'

interface SummaryStepProps {
  currentStep: number
  isActive: boolean
}

const SummaryStep = ({ isActive }: SummaryStepProps) => {
  const dispatch = useDispatch()
  const { formData, selectedCoverPath, setSelectedCoverPath, requestScrollToBottom } = useWizard()
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const settingsState = useSelector(selectSettingsState)

  // Auto-select random cover on mount (if not already selected)
  useEffect(() => {
    if (isActive && !selectedCoverPath && formData.genre) {
      // Find label for genre
      const selectedGenreLabel = genres.find(g => g.value === formData.genre)?.label
      if (selectedGenreLabel) {
        const validCovers = bookCovers.filter(cover => cover.categoryName.startsWith(selectedGenreLabel))
        if (validCovers.length > 0) {
          const randomCover = validCovers[Math.floor(Math.random() * validCovers.length)]
          console.log(`Auto-selecting cover: ${randomCover.image}`)
          setSelectedCoverPath(randomCover.image)
        }
      }
    }
  }, [isActive, selectedCoverPath, formData.genre, setSelectedCoverPath])

  // Helper function to convert image path to base64
  const convertImageToBase64 = async (imagePath: string | null): Promise<{ base64: string | null; mimeType: string | null }> => {
    if (!imagePath) {
      return { base64: null, mimeType: null }
    }
    try {
      // Assuming images are served from the root public directory during dev/build
      const response = await fetch(`./${imagePath}`) // Relative path from public root
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          // Format: data:[<mime type>];base64,<data>
          const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'))
          const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1)
          resolve({ base64, mimeType })
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error converting image to base64:', error)
      return { base64: null, mimeType: null }
    }
  }

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
Please provide the output in Markdown format.`

    // --- Convert selected cover image to base64 ---
    let coverData: { base64: string | null; mimeType: string | null } = { base64: null, mimeType: null } // Correct type initialization
    if (selectedCoverPath) {
      try {
        coverData = await convertImageToBase64(selectedCoverPath)
      } catch (err) {
        console.error("Failed to process selected cover image:", err)
        // Optionally set an error state or proceed without cover
      }
    }
    // ---------------------------------------------

    // Initial project structure (without outline file yet)
    // Use Partial<Project> and build up, or ensure all fields are present
    const initialProjectData: Omit<Project, 'id' | 'lastModified'> = { // Use Omit or Partial from '@/types'
      title: projectTitle,
      projectPath: projectPath,
      files: [] as ProjectFile[], // Initialize files array
      genre: formData.genre,
      summary: '', // Keep summary separate or remove if outline replaces it
      year: new Date().getFullYear(),
      wordCountCurrent: 0,
      wordCountTarget: formData.length || 0,
      expertSuggestions: [],
      knowledgeGraph: null,
      chatHistory: [],
      coverImageBase64: coverData.base64,
      coverImageMimeType: coverData.mimeType,
      // 'cover' property might be deprecated or unused if base64 is primary
      // Ensure Project type definition matches - Removed isNew as it's not in Project type
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


      const outlineFile: ProjectFile = {
        title: 'Outline', // Standard name
        content: accumulatedText
        // Removed type: 'outline' as it's not in ProjectFile type
      };

      // Create the final project object including the outline file
      // Ensure the final object matches the Project type expected by setActiveProject
      const projectWithOutline: Omit<Project, 'id' | 'lastModified'> = {
        ...initialProjectData,
        files: [outlineFile],
      };

      // Dispatch setActiveProject with the complete project data (including outline)
      dispatch(setActiveProject(projectWithOutline as Project)); // Cast if necessary, ensure type alignment

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

  // Effect to scroll down as text streams in
  useEffect(() => {
    if (isGenerating || streamedText) {
      requestScrollToBottom();
    }
  }, [streamedText, isGenerating, requestScrollToBottom]); // Depend on streamedText and isGenerating

  return (
    <div className="space-y-4">
      {/* Assistant Message */}
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow text-center"> {/* Applied chat colors */}
          <h2 className="text-lg font-semibold">Great! We&apos;re ready to create your {genreLabel} story outline.</h2>
          <p className="text-sm text-muted-foreground mt-1">This&apos;ll take a few seconds once you click the button. Just hang tight.</p>
        </div>
      </div>

      {isActive && (
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg gap-4">
          <Button
            onClick={handleDream}
            disabled={isGenerating || !formData.title || !formData.genre || !formData.setting || !formData.plot || !selectedCoverPath /* Ensure cover is selected */}
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
