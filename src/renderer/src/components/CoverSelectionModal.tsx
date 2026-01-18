import React, { useState, useMemo, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Re-use data from BookWizard
import { bookCovers } from '@/assets/book-covers'
import { genres } from '@/components/BookWizard/index'

interface CoverSelectionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectCover: (data: { base64: string | null; mimeType: string | null }) => void
}

const CoverSelectionModal: React.FC<CoverSelectionModalProps> = ({
    open,
    onOpenChange,
    onSelectCover,
}) => {
    const [selectedTab, setSelectedTab] = useState('gallery')
    const [selectedGenre, setSelectedGenre] = useState<string>('fantasy') // Default to fantasy or none
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null)

    // Upload state
    const [uploadPreview, setUploadPreview] = useState<string | null>(null)
    const [uploadedFileData, setUploadedFileData] = useState<{ base64: string; mimeType: string, file: File } | null>(null)
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dropZoneRef = useRef<HTMLDivElement>(null)

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const MAX_IMAGE_SIZE_MB = 5
    const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

    // Filter covers logic (ported from CoverStep.tsx)
    const filteredCovers = useMemo(() => {
        if (!selectedGenre) return []
        const selectedGenreLabel = genres.find(g => g.value === selectedGenre)?.label
        if (!selectedGenreLabel) return []

        return bookCovers.filter(cover =>
            cover.categoryName.startsWith(selectedGenreLabel)
        )
    }, [selectedGenre])

    // --- Helper to convert gallery path to base64 (ported from SummaryStep) ---
    const convertImageToBase64 = async (imagePath: string): Promise<{ base64: string | null; mimeType: string | null }> => {
        try {
            const response = await fetch(`./${imagePath}`)
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
            const blob = await response.blob()
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const dataUrl = reader.result as string
                    const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'))
                    const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1)
                    resolve({ base64, mimeType })
                }
                reader.onerror = reject
                reader.readAsDataURL(blob)
            })
        } catch (error) {
            console.error('Error converting image to base64:', error)
            toast.error("Failed to load selected gallery image.")
            return { base64: null, mimeType: null }
        }
    }

    // --- Upload Handlers ---
    const processImageFile = (file: File) => {
        if (!file) return

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            toast.error(`Invalid file type. Allowed: jpg, png, webp.`);
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
                setUploadPreview(result);
                setUploadedFileData({ base64: base64Data, mimeType, file });
            }
        }
        reader.readAsDataURL(file);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processImageFile(file)
        if (e.target) e.target.value = ''
    }

    // Drag and Drop
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true);
    }
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(false);
        }
    }
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true);
    }
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) processImageFile(files[0]);
    }


    // --- Final Selection ---
    const handleConfirm = async () => {
        if (selectedTab === 'gallery') {
            if (!selectedGalleryImage) {
                toast.error("Please select an image from the gallery.");
                return;
            }
            // Convert and send
            const data = await convertImageToBase64(selectedGalleryImage);
            if (data.base64) {
                onSelectCover(data);
                onOpenChange(false);
            }
        } else {
            // Upload tab
            if (!uploadedFileData) {
                toast.error("Please upload an image.");
                return;
            }
            onSelectCover({ base64: uploadedFileData.base64, mimeType: uploadedFileData.mimeType });
            onOpenChange(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b">
                    <DialogTitle>Select Book Cover</DialogTitle>
                    <DialogDescription>
                        Choose a pre-designed cover or upload your own.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-grow overflow-hidden flex flex-col">
                    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
                        <div className="px-6 pt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                                <TabsTrigger value="upload">Upload Custom</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* GALLERY TAB */}
                        <TabsContent value="gallery" className="flex-grow overflow-hidden flex flex-col data-[state=inactive]:hidden p-6 pt-4 h-full">
                            {/* Genre Filter */}
                            <div className="flex items-center gap-4 mb-4 shrink-0">
                                <Label htmlFor="genre-select" className="shrink-0">Filter by Genre:</Label>
                                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                                    <SelectTrigger className="w-[200px]" id="genre-select">
                                        <SelectValue placeholder="Select genre" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {genres.map(g => (
                                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Grid */}
                            <div className="flex-grow overflow-y-auto border rounded-md p-4 bg-muted/20">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {filteredCovers.map((cover) => (
                                        <Card
                                            key={cover.image}
                                            className={cn(
                                                'cursor-pointer transition-all hover:scale-105 border-2',
                                                selectedGalleryImage === cover.image ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/25'
                                            )}
                                            onClick={() => setSelectedGalleryImage(cover.image)}
                                        >
                                            <CardContent className="p-0 aspect-[2/3] relative">
                                                <img
                                                    src={`./${cover.image}`} // Assuming relative to public root
                                                    alt={cover.categoryName}
                                                    className="object-cover w-full h-full rounded-sm"
                                                    loading="lazy"
                                                />
                                                {selectedGalleryImage === cover.image && (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                                                            <div className="w-3 h-3 rounded-full bg-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {filteredCovers.length === 0 && (
                                        <div className="col-span-full h-40 flex items-center justify-center text-muted-foreground">
                                            No covers found for this genre.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>


                        {/* UPLOAD TAB */}
                        <TabsContent value="upload" className="flex-grow overflow-hidden flex flex-col data-[state=inactive]:hidden p-6 pt-4 h-full">
                            <div
                                ref={dropZoneRef}
                                className={cn(
                                    "flex-grow border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-10 text-center transition-colors",
                                    isDraggingOver ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
                                )}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                {uploadPreview ? (
                                    <div className="relative h-full w-full flex items-center justify-center">
                                        <img src={uploadPreview} alt="Preview" className="max-h-full max-w-full object-contain shadow-lg rounded-md" />
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                            <Button variant="secondary" onClick={() => { setUploadPreview(null); setUploadedFileData(null); }}>
                                                Remove & Upload Different
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                                            <Upload className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">Drag & Drop or Click to Upload</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Supports JPG, PNG, WebP (Max {MAX_IMAGE_SIZE_MB}MB)
                                            </p>
                                        </div>
                                        <Button onClick={() => fileInputRef.current?.click()}>
                                            Select File
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="p-4 border-t bg-background">
                    <DialogClose asChild>
                        <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleConfirm} disabled={selectedTab === 'gallery' ? !selectedGalleryImage : !uploadedFileData}>
                        {selectedTab === 'gallery' ? 'Select Cover' : 'Use Uploaded Image'}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}

export default CoverSelectionModal
