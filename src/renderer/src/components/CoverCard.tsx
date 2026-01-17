import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { selectActiveProjectWithCoverDataUrl } from '@/lib/store/projectsSlice'
import CoverSelectionModal from './CoverSelectionModal'

export function CoverCard() {
  const activeProjectWithCover = useSelector(selectActiveProjectWithCoverDataUrl)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(activeProjectWithCover?.cover || null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (activeProjectWithCover?.cover) {
      setCoverPreviewUrl(activeProjectWithCover.cover)
    } else {
      setCoverPreviewUrl(null)
    }
  }, [activeProjectWithCover])

  const handleCoverButtonClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <div
        className={cn(
          `group border-2 rounded-xl p-4 transition-colors duration-200 ease-in-out flex flex-col mx-auto h-full cursor-pointer`,
          "border-gray-300 hover:border-gray-400",
          `bg-cover bg-center`
        )}
        style={{ backgroundImage: `url(${coverPreviewUrl})` }}
        onClick={handleCoverButtonClick}
      >
        <div className="flex flex-col items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button type="button" variant="outline" className="mb-2" onClick={(e) => { e.stopPropagation(); handleCoverButtonClick(); }}>
            <Upload className="mr-2 h-4 w-4" /> Change Cover
          </Button>
          <p className="text-xs text-white shadow-lg text-center">
            Click to select a cover
          </p>
        </div>
      </div>

      <CoverSelectionModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}
