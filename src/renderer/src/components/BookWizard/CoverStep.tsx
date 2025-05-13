import { ReactNode, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { bookCovers } from '@/assets/book-covers'
import { genres } from '@/components/BookWizard/index' // Import genres to get labels
import { cn } from '@/lib/utils'
import minstrelIcon from '@/assets/bot/base.png'

interface CoverStepProps {
  handleProceed: () => void
  // currentStep: number // Removed as unused
  isActive: boolean
  selectedGenre: string // Genre selected in a previous step
  selectedCoverPath: string | null // The path of the selected cover, e.g., 'covers/fantasy.png'
  setSelectedCoverPath: (path: string | null) => void // Function to update the selected cover path
}

// No longer needed:
// const getBaseGenre = (categoryName: string): string => {
//   return categoryName.split(' - ')[0].trim()
// }

const CoverStep = ({
  handleProceed,
  // currentStep, // Removed as unused
  isActive,
  selectedGenre,
  selectedCoverPath,
  setSelectedCoverPath
}: CoverStepProps): ReactNode => {
  // Filter covers based on the selected genre
  const filteredCovers = useMemo(() => {
    if (!selectedGenre) {
       // If no genre is selected yet, maybe show nothing or a placeholder?
       // Showing all covers might be confusing if the intent is genre-based selection.
       // Let's return empty array if no genre is selected. User must select genre first.
       return []
    }
    // Find the display label for the selected genre value
    const selectedGenreLabel = genres.find(g => g.value === selectedGenre)?.label
    if (!selectedGenreLabel) {
      return [] // Should not happen if selectedGenre is valid, but good practice
    }

    // Filter covers where the categoryName starts with the selected genre's label
    // This handles both top-level genres (e.g., "Fantasy") and subgenres (e.g., "Fantasy - Dark Fantasy")
    const genreMatches = bookCovers.filter(cover =>
      cover.categoryName.startsWith(selectedGenreLabel)
    )
    return genreMatches
  }, [selectedGenre])

  const isNextDisabled = useMemo(() => {
    return !selectedCoverPath
  }, [selectedCoverPath])

  const onNextClick = () => {
    if (!isNextDisabled) {
      handleProceed()
    }
  }

  // Find the category name for the selected cover (for summary view)
  const selectedCoverInfo = useMemo(() => {
    return bookCovers.find(cover => cover.image === selectedCoverPath)
  }, [selectedCoverPath])


  return (
    <div className="space-y-4"> {/* Use consistent outer spacing */}
       {/* Assistant Message */}
       <div className="flex items-start gap-3">
         <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
         <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow"> {/* Applied chat colors */}
           <p className="text-sm font-semibold">Choose a cover image. Again, don&apos;t worry, we can change this later!</p>
         </div>
       </div>

      {/* Conditional Rendering based on isActive */}
      {isActive ? (
         // Active Step: Show Gallery and Next button
        <>
          <div className="flex-grow overflow-y-auto p-1 space-y-4 border rounded-lg"> {/* Add border like other active steps */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4"> {/* Add padding */}
              {filteredCovers.map((cover) => (
                <Card
                  key={cover.image}
                  className={cn(
                    'cursor-pointer transition-all hover:scale-105',
                    selectedCoverPath === cover.image ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-border'
                  )}
                  onClick={() => setSelectedCoverPath(cover.image)}
                >
                  <CardContent className="p-0 aspect-w-2 aspect-h-3">
                    <img
                      src={`./${cover.image}`}
                      alt={cover.categoryName}
                      className="object-cover w-full h-full rounded-md"
                    />
                  </CardContent>
                </Card>
              ))}
              {/* Updated messages based on new filtering */}
              {filteredCovers.length === 0 && selectedGenre && (
                <p className="text-muted-foreground col-span-full text-center">No covers found matching the selected genre: {selectedGenre}.</p>
              )}
              {filteredCovers.length === 0 && !selectedGenre && (
                <p className="text-muted-foreground col-span-full text-center">Please select a genre first to see available covers.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end"> {/* Removed border-t as it's part of the step container now */}
            <Button onClick={onNextClick} disabled={isNextDisabled}>
              Next
            </Button>
          </div>
        </>
      ) : (
        // Summary View - Rendered when not active
        <div className="p-4 border rounded-lg bg-background flex items-center gap-4">

          {selectedCoverPath ? (
            <img
              src={`./${selectedCoverPath}`}
              alt={selectedCoverInfo?.categoryName || 'Selected Cover'}
              className="h-48 w-auto rounded-md border object-cover" // Increased height to h-48 (3x h-16)
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">(No cover selected)</p>
          )}
        </div>
      )}
    </div>
  )
}

export default CoverStep
