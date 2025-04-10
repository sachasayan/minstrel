import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { selectActiveProjectWithCoverDataUrl, updateCoverImage } from '@/lib/store/projectsSlice'

export function CoverCard() {
  const dispatch = useDispatch()
  const activeProjectWithCover = useSelector(selectActiveProjectWithCoverDataUrl)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(activeProjectWithCover?.cover || null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_IMAGE_SIZE_MB = 5
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

  useEffect(() => {
    if (activeProjectWithCover?.cover) {
      setCoverPreviewUrl(activeProjectWithCover.cover)
    } else {
      setCoverPreviewUrl(null)
    }
  }, [activeProjectWithCover])

  const handleCoverButtonClick = () => {
    fileInputRef.current?.click()
  }

  const processImageFile = (file: File) => {
    if (!file) {
      toast.error('No file selected.')
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`Invalid file type. Allowed types: jpg, png, webp.`);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`File too large. Max size ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const mimeTypeMatch = result.match(/^data:(.+);base64,/);
      if (mimeTypeMatch && mimeTypeMatch[1]) {
        const mimeType = mimeTypeMatch[1];
        const base64Data = result.substring(result.indexOf(',') + 1);
        setCoverPreviewUrl(result);
        dispatch(updateCoverImage({ base64: base64Data, mimeType }));
        toast.info('Cover image updated. Save project to persist.');
      } else {
        toast.error('Invalid image data.');
        setCoverPreviewUrl(null);
        dispatch(updateCoverImage({ base64: null, mimeType: null }));
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read file.')
      setCoverPreviewUrl(null);
      dispatch(updateCoverImage({ base64: null, mimeType: null }));
    }
    reader.readAsDataURL(file);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
    if (e.target) {
      e.target.value = ''
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false)
    }
  }
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processImageFile(files[0])
    } else {
      toast.error('No file detected.')
    }
  }

  return (
    <>

      <div
        ref={dropZoneRef}
        className={cn(
          `group border-2 rounded-xl p-4 transition-colors duration-200 ease-in-out flex flex-col mx-auto h-full`,
          isDraggingOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          `bg-cover bg-center`
        )}
        onDragEnter={handleDragEnter}
        style={{ backgroundImage: `url(${coverPreviewUrl})` }}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}

      >

        <div className="flex flex-col items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button type="button" variant="outline" onClick={handleCoverButtonClick} className="mb-2">
            <Upload className="mr-2 h-4 w-4" /> Change Cover
          </Button>
          <p className="text-xs text-white shadow-lg text-center ">
            or drag & drop (JPG, PNG, WebP, max {MAX_IMAGE_SIZE_MB}MB)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            className="hidden"
          />
        </div>
      </div>
    </>
  )
}
