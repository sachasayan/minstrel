import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { selectActiveProjectWithCoverDataUrl, updateCoverImage } from '@/lib/store/projectsSlice'
import CoverSelectionModal from './CoverSelectionModal'

export function CoverCard() {
  const dispatch = useDispatch()
  const activeProjectWithCover = useSelector(selectActiveProjectWithCoverDataUrl)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(activeProjectWithCover?.cover || null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (activeProjectWithCover?.cover) {
      setCoverPreviewUrl(activeProjectWithCover.cover)
    } else {
      setCoverPreviewUrl(null)
    }
  }, [activeProjectWithCover])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCoverSelection = (data: { base64: string | null; mimeType: string | null }) => {
    if (data.base64 && data.mimeType) {
      // Construct preview URL immediately for better responsiveness, though Redux will eventually update it
      const preview = `data:${data.mimeType};base64,${data.base64}`
      setCoverPreviewUrl(preview)

      dispatch(updateCoverImage({ base64: data.base64, mimeType: data.mimeType }))
      toast.success('Cover image updated. Save project to persist.')
    } else {
      toast.error('Failed to process selected cover.')
    }
  }

  return (
    <>
      <div
        className={cn(
          `group border-2 rounded-xl p-4 transition-colors duration-200 ease-in-out flex flex-col mx-auto h-full relative overflow-hidden`,
          "border-gray-300 hover:border-gray-400",
          `bg-cover bg-center`
        )}
        style={{ backgroundImage: `url(${coverPreviewUrl})` }}
      >
        {/* Overlay for actions - always visible if no cover, or on hover if cover exists */}
        <div className={cn(
          "flex flex-col items-center justify-center h-full transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]",
          coverPreviewUrl ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}>
          <Button type="button" variant={coverPreviewUrl ? "secondary" : "default"} onClick={handleOpenModal} className="mb-2 shadow-lg">
            <Upload className="mr-2 h-4 w-4" /> {coverPreviewUrl ? 'Change Cover' : 'Add Cover'}
          </Button>
          {!coverPreviewUrl && (
            <p className="text-xs text-muted-foreground text-white text-center shadow-sm">
              Choose from gallery or upload
            </p>
          )}
        </div>
      </div>

      <CoverSelectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSelectCover={handleCoverSelection}
      />
    </>
  )
}
