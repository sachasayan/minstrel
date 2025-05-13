import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useWizard, sanitizeFilename } from '@/components/BookWizard/index'
import minstrelIcon from '@/assets/bot/base.png'
import { generateTitleSuggestions } from '@/lib/services/chatService'
import { Loader2 } from 'lucide-react'

interface TitleStepProps {
  handleProceed: (nextStep: number) => void
  currentStep: number
  isActive: boolean
}

const TitleStep = ({ handleProceed, currentStep, isActive }: TitleStepProps) => {
  const { formData, setFormData } = useWizard()
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch suggestions when the step becomes active and plot exists
  useEffect(() => {
    // Only fetch if active, plot exists, and not already fetched/loading
    if (isActive && formData.plot && suggestions.length === 0 && !isLoading) {
      const fetchTitles = async () => {
        setIsLoading(true)
        setError(null)
        try {
          const fetchedSuggestions = await generateTitleSuggestions(
            formData.plot,
            formData.genre || '',
            formData.setting || ''
          )
          setSuggestions(fetchedSuggestions)
          if (fetchedSuggestions.length === 0) {
            setError('Could not generate title suggestions. Please enter one manually.')
          }
        } catch (err) {
          console.error('Title suggestion fetch error:', err)
          setError('Failed to fetch title suggestions. Please enter one manually.')
          setSuggestions([]) // Clear any stale suggestions
        } finally {
          setIsLoading(false)
        }
      }
      fetchTitles()
    }
  }, [isActive, formData.plot, formData.genre, formData.setting, isLoading])

  const handleSuggestionClick = (title: string) => {
    setFormData({ ...formData, title: title })
  }

  const onNextClick = () => {
    if (formData.title?.trim()) handleProceed(currentStep + 1)
  }

  return (
    <div className="space-y-4">
      {/* Assistant Message */}
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow">
          <p className="text-sm font-semibold">Great! Based on the plot, genre, and setting, here are some title ideas. Feel free to pick one that resonates, or type your own custom title below.</p>
        </div>
      </div>

      {isActive ? (
        <>
          {/* Suggestions Area */}
          <div className="p-4 border rounded-lg space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center text-muted-foreground py-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {/* Use Loader2 */}
                Generating title ideas...
              </div>
            )}
            {error && !isLoading && (
              <p className="text-sm text-destructive text-center py-4">{error}</p>
            )}
            {!isLoading && !error && suggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Suggestions:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {suggestions.map((title, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1.5 whitespace-normal text-center justify-center" // Center text
                      onClick={() => handleSuggestionClick(title)} // Use handleSuggestionClick
                    >
                      {title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Input Area (always visible when active) */}
            <div className="space-y-2 pt-3">
              <label htmlFor="title" className="text-sm font-medium">
                Working Title:
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter or select a title"
                disabled={isLoading} // Disable input while loading suggestions
              />
              <p className="text-xs text-muted-foreground pt-1">
                {formData.title ? `We'll save the project as "${sanitizeFilename(formData.title)}.mns"` : ' '}
              </p>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end">
             {/* Disable button if no title OR still loading */}
            <Button onClick={onNextClick} disabled={!formData.title?.trim() || isLoading}>
              Next
            </Button>
          </div>
        </>
      ) : (
        // Inactive View
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm">We&apos;ll call it { formData.title || 'Not set'}</p>
        </div>
      )}
    </div>
  )
}

export default TitleStep
