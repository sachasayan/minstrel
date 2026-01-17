import React, { useState, useRef, useMemo, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { bookCovers } from '@/assets/book-covers'
import { updateCoverImage } from '@/lib/store/projectsSlice'

interface CoverSelectionModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

const CoverSelectionModal: React.FC<CoverSelectionModalProps> = ({
    isOpen,
    onOpenChange,
}) => {
    const dispatch = useDispatch()
    const [selectedPrebakedCover, setSelectedPrebakedCover] = useState<string | null>(null)
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
    const [uploadedImageData, setUploadedImageData] = useState<{ base64: string; mimeType: string } | null>(null)
    const [activeTab, setActiveTab] = useState<string>('gallery')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dropZoneRef = useRef<HTMLDivElement>(null)

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedPrebakedCover(null)
            setUploadPreviewUrl(null)
            setUploadedImageData(null)
            setActiveTab('gallery')
        }
    }, [isOpen])

    // Get all covers (we show all since we're on the dashboard, not in wizard)
    const allCovers = useMemo(() => {
        // Filter out covers with empty categoryName and get unique images
        return bookCovers.filter(cover => cover.categoryName !== '')
    }, [])

    const handleFileButtonClick = () => {
        fileInputRef.current?.click()
    }

    const processImageFile = (file: File) => {
        if (!file) {
            toast.error('No file selected.')
            return
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            toast.error(`Invalid file type. Allowed types: jpg, png, webp.`)
            return
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            toast.error(`File too large. Max size ${MAX_IMAGE_SIZE_MB}MB.`)
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            const mimeTypeMatch = result.match(/^data:(.+);base64,/)
            if (mimeTypeMatch && mimeTypeMatch[1]) {
                const mimeType = mimeTypeMatch[1]
                const base64Data = result.substring(result.indexOf(',') + 1)
                setUploadPreviewUrl(result)
                setUploadedImageData({ base64: base64Data, mimeType })
                // Clear prebaked selection when uploading
                setSelectedPrebakedCover(null)
            } else {
                toast.error('Invalid image data.')
            }
        }
        reader.onerror = () => {
            toast.error('Failed to read file.')
        }
        reader.readAsDataURL(file)
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

    const handlePrebakedCoverSelect = (coverPath: string) => {
        setSelectedPrebakedCover(coverPath)
        // Clear upload when selecting prebaked
        setUploadPreviewUrl(null)
        setUploadedImageData(null)
    }

    const handleApply = async () => {
        if (activeTab === 'gallery' && selectedPrebakedCover) {
            // Load the prebaked cover image and convert to base64
            try {
                const response = await fetch(`./${selectedPrebakedCover}`)
                const blob = await response.blob()
                const reader = new FileReader()
                reader.onloadend = () => {
                    const result = reader.result as string
                    const mimeTypeMatch = result.match(/^data:(.+);base64,/)
                    if (mimeTypeMatch && mimeTypeMatch[1]) {
                        const mimeType = mimeTypeMatch[1]
                        const base64Data = result.substring(result.indexOf(',') + 1)
                        dispatch(updateCoverImage({ base64: base64Data, mimeType }))
                        toast.info('Cover image updated. Save project to persist.')
                        onOpenChange(false)
                    }
                }
                reader.readAsDataURL(blob)
            } catch (error) {
                toast.error('Failed to load cover image.')
            }
        } else if (activeTab === 'upload' && uploadedImageData) {
            dispatch(updateCoverImage(uploadedImageData))
            toast.info('Cover image updated. Save project to persist.')
            onOpenChange(false)
        }
    }

    const isApplyDisabled = useMemo(() => {
        if (activeTab === 'gallery') {
            return !selectedPrebakedCover
        }
        return !uploadedImageData
    }, [activeTab, selectedPrebakedCover, uploadedImageData])

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Book Cover</DialogTitle>
                    <DialogDescription>
                        Choose a cover from our gallery or upload your own image.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="gallery">Cover Gallery</TabsTrigger>
                        <TabsTrigger value="upload">Upload Image</TabsTrigger>
                    </TabsList>

                    <TabsContent value="gallery" className="flex-grow overflow-hidden mt-4">
                        <div className="h-full overflow-y-auto border rounded-lg p-4">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                {allCovers.map((cover) => (
                                    <Card
                                        key={cover.image}
                                        className={cn(
                                            'cursor-pointer transition-all hover:scale-105',
                                            selectedPrebakedCover === cover.image
                                                ? 'ring-2 ring-primary ring-offset-2'
                                                : 'ring-1 ring-border'
                                        )}
                                        onClick={() => handlePrebakedCoverSelect(cover.image)}
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
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="flex-grow overflow-hidden mt-4">
                        <div
                            ref={dropZoneRef}
                            className={cn(
                                'h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-200',
                                isDraggingOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                            )}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            {uploadPreviewUrl ? (
                                <div className="flex flex-col items-center gap-4">
                                    <img
                                        src={uploadPreviewUrl}
                                        alt="Upload preview"
                                        className="max-h-64 max-w-full object-contain rounded-lg border"
                                    />
                                    <Button variant="outline" onClick={handleFileButtonClick}>
                                        <Upload className="mr-2 h-4 w-4" /> Choose Different Image
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                    <Upload className="h-12 w-12" />
                                    <p className="text-lg font-medium">Drag & drop your image here</p>
                                    <p className="text-sm">or</p>
                                    <Button variant="outline" onClick={handleFileButtonClick}>
                                        <Upload className="mr-2 h-4 w-4" /> Browse Files
                                    </Button>
                                    <p className="text-xs mt-2">
                                        Supported formats: JPG, PNG, WebP (max {MAX_IMAGE_SIZE_MB}MB)
                                    </p>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept={ALLOWED_IMAGE_TYPES.join(',')}
                                className="hidden"
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleApply} disabled={isApplyDisabled}>
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CoverSelectionModal
