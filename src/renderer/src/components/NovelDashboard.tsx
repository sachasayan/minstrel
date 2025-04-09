import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Star } from 'lucide-react'
import { useEffect, useState, useCallback, useRef } from 'react'

import { selectActiveProject, selectActiveProjectWithCoverDataUrl, updateCoverImage } from '@/lib/store/projectsSlice'
import { extractCharactersFromOutline, getCharacterFrequencyData, colors } from '@/lib/dashboardUtils'
import { ProgressTracker } from '@/components/dashboard/ProgressTracker'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addChatMessage } from '@/lib/store/chatSlice'

type NovelStage = 'Writing Outline' | 'Writing Chapters' | 'Editing'; // Define NovelStage type

export default function NovelDashboard() {
  const activeProject = useSelector(selectActiveProject)
  // const [progressButtonCaption, setProgressButtonCaption] = useState<Array<{ name: string }>>([])
  const [characters, setCharacters] = useState<Array<{ name: string }>>([])
  const [characterFrequencyData, setCharacterFrequencyData] = useState<any[]>([]);
  const [dialogueCountData, setDialogueCountData] = useState<any[]>([]);
  const dispatch = useDispatch() // Initialize useDispatch

  useEffect(() => {
    if (activeProject) {
      const extractedCharacters = extractCharactersFromOutline(
        activeProject.files.find((file) => file.title.indexOf('Outline') != -1)?.content || ''
      );
      setCharacters(extractedCharacters);
      setCharacterFrequencyData(getCharacterFrequencyData(activeProject));

      // Generate dialogue count data if available
      const analysis = activeProject.dialogueAnalysis
      if (analysis && analysis.dialogCounts) {
        const charNames = Object.keys(analysis.dialogCounts)
        const chapterCount = Math.max(
          ...charNames.map(name => analysis.dialogCounts[name].length)
        )
        const transformed: any[] = []
        for (let chapterIdx = 0; chapterIdx < chapterCount; chapterIdx++) {
          const chapterData: any = { chapter: chapterIdx + 1 }
          for (const charName of charNames) {
            chapterData[charName] = analysis.dialogCounts[charName][chapterIdx] ?? 0
          }
          transformed.push(chapterData)
        }
        setDialogueCountData(transformed)
      } else {
        setDialogueCountData([])
      }
    } else {
      setCharacters([]);
      setCharacterFrequencyData([]);
      setDialogueCountData([]);
    }
  }, [activeProject]);

  function StarRating({ rating }: { rating: number }) {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    )
  }

  // Function to determine current novel stage
  const getCurrentStage = useCallback((): NovelStage => { // Explicitly return NovelStage
    if (!activeProject) return 'Writing Outline' // Default to Outline if no project
    const hasOutline = activeProject.files.some(file => file.title.toLowerCase().includes('outline'))



    if (!hasOutline) return 'Writing Outline'
    return 'Writing Chapters'
  }, [activeProject])

  const stages: NovelStage[] = ['Writing Outline', 'Writing Chapters', 'Editing'] // Use NovelStage type for stages
  const currentStage = getCurrentStage()

  const captions = {
    'Writing Outline': {
      caption: 'Add the outline.',
      instruction: 'Please add the outline.',
      guidance: `Woohoo! You're on your way! At this stage, you can edit the Outline to your heart's content.`
    },
    'Writing Chapters': {
      caption: 'Write the next chapter.',
      instruction: 'Please write the next chapter.',
      guidance: `You've got an outline! That's great! If you have any more tweaks to make you can go ahead and make those changes. Otherwise, let's start our first chapter!`
    },
    'Editing': {
      caption: 'Explore your options. ',
      instruction: 'Please write a review of the story so far.',
      guidance: `All the chapters are done! Incredible! Feel free to do more editing, seek counsel from the critics, or start publishing!`
    }
  };
  // Function to handle progress to next stage
  const handleNextStage = () => {
    dispatch(addChatMessage({ sender: 'User', text: captions[currentStage].instruction }));
  }


  function CoverCard() {
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cover Image</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Cover</Label>
          <div
            ref={dropZoneRef}
            className={cn(
              "mt-2 border-2 border-dashed rounded-md p-4 transition-colors duration-200 ease-in-out flex flex-col items-center",
              isDraggingOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mb-4 flex justify-center">
              <img
                src={coverPreviewUrl || '/covers/science-fiction.png'}
                alt="Cover Preview"
                className="h-32 w-24 object-cover rounded border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/covers/science-fiction.png'
                }}
              />
            </div>
            <div className="flex flex-col items-center">
              <Button type="button" variant="outline" onClick={handleCoverButtonClick} className="mb-2">
                <Upload className="mr-2 h-4 w-4" /> Change Cover
              </Button>
              <p className="text-xs text-gray-500 text-center">
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
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-24 space-y-6">
      <CoverCard />
      <h1 className="text-3xl font-bold mb-6 text-highlight-700">Your Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Guide */}
        <Card className="md:col-span-12 ">
          <CardHeader>
            <CardTitle>Current Stage: {currentStage}</CardTitle>


          </CardHeader>
          <CardContent className="space-y-4">
            <p>{captions[currentStage].guidance}</p>

            <Button variant="outline" size="sm" onClick={handleNextStage}>
              {captions[currentStage].caption}
            </Button>

            <ProgressTracker stages={stages} currentStage={currentStage} />
            <div className="flex items-center justify-between">

              {/* {currentStage !== 'Editing' && ( // Now comparison is valid */}

              {/* )} */}
            </div>
          </CardContent>
        </Card>

        {/* Novel Summary */}
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>Novel Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{activeProject?.summary || ''}</p>
          </CardContent>
        </Card>

        {/* Per-Chapter Word Count Graph */}
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Word Count per Chapter</CardTitle>
          </CardHeader>
          <CardContent>
            {activeProject ? (
              <ChartContainer
                style={{ aspectRatio: 'auto' }}
                config={{
                  chapterWordCount: {
                    label: 'Word Count'
                  }
                }}
                className="h-[300px]"
              >
                <BarChart
                  data={activeProject.files
                    .filter((file) => file.title.startsWith('Chapter'))
                    .map((file, index) => ({
                      index: index,
                      chapter: index + 1,
                      chapterWordCount: file.content.split(/\s+/).length
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="chapter"
                    tickFormatter={(tick: string) => tick}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="chapterWordCount" fill="var(--color-highlight-900)" />
                </BarChart>
              </ChartContainer>
            ) : (
              <p>No active project data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Character Mentions per Chapter */}
        <Card className="col-span-9">
          <CardHeader>
            <CardTitle>Character Mentions per Chapter</CardTitle>
            <CardDescription>Line graph showing mentions of each character per chapter</CardDescription>
          </CardHeader>
          <CardContent>
            {activeProject ? (
              <ChartContainer
                style={{ aspectRatio: 'auto' }}
                config={characters.reduce((acc, char) => { // Use characters state
                  acc[char.name] = {
                    label: char.name
                  }
                  return acc
                }, {})}
                className="h-[400px]"
              >
                <LineChart data={characterFrequencyData}> {/* Use characterFrequencyData state */}
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="chapter"
                    tickFormatter={(tick: string) => tick}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {characters.map((character, index) => ( // Use characters state
                    <Line key={character.name} type="monotone" dataKey={character.name} stroke={colors[index % colors.length]} strokeWidth={2} />
                  ))}
                </LineChart>
              </ChartContainer>
            ) : (
              <p>No active project data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Expert Suggestions */}
        {activeProject?.expertSuggestions.map((suggestion, index) => (
          <Card className="col-span-3" key={index}>
            <CardHeader>
              <CardTitle>Expert feedback: {suggestion.name}</CardTitle>
              <CardDescription>{suggestion.expertise}</CardDescription>
            </CardHeader>
            <CardContent>
              <StarRating rating={suggestion.rating} />
              <p className="mt-2 text-sm text-muted-foreground">{suggestion.critique}</p>
            </CardContent>
          </Card>
        ))}

        {/* Progress */}
        <Card className="md:col-span-12 ">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>Looks like you&apos;re on a streak!</CardContent>
        </Card>
        {/* Dialogue Sentences per Chapter */}
        <Card className="col-span-12">
          <CardHeader>
            <CardTitle>Dialogue Sentences per Chapter</CardTitle>
            <CardDescription>Total number of spoken sentences per main character, for each chapter.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeProject && dialogueCountData.length > 0 ? (
              <ChartContainer
                style={{ aspectRatio: 'auto' }}
                config={characters.reduce((acc, char) => {
                  acc[char.name] = { label: char.name }
                  return acc
                }, {})}
                className="h-[400px]"
              >
                <LineChart data={dialogueCountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="chapter" tickFormatter={(tick: string) => tick} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {characters.map((character, index) => (
                    <Line
                      key={character.name}
                      type="monotone"
                      dataKey={character.name}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            ) : (
              <p>No dialogue analysis data available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
