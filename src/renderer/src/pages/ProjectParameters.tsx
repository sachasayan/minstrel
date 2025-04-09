import { ReactNode, useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Genre } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectActiveProject,
  updateParameters,
  updateCoverImage,
  selectActiveProjectWithCoverDataUrl
} from '@/lib/store/projectsSlice'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

// Define constants for validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const GenreOptions = () => {
  // ... (GenreOptions component remains the same) ...
  return (
    <>
      <SelectTrigger id="genre">
        <SelectValue placeholder="Select a genre" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="science-fiction">Science Fiction</SelectItem>
        <SelectItem value="fantasy">Fantasy</SelectItem>
        <SelectItem value="mystery-thriller">Mystery/Thriller</SelectItem>
        <SelectItem value="horror">Horror</SelectItem>
        <SelectItem value="historical">Historical</SelectItem>
        <SelectItem value="romance">Romance</SelectItem>
        <SelectItem value="science-fiction-cyberpunk">Cyberpunk</SelectItem>
        <SelectItem value="science-fiction-hard-sci-fi">Hard Sci-Fi</SelectItem>
        <SelectItem value="science-fiction-post-apocalyptic">Post-Apocalyptic Sci-Fi</SelectItem>
        <SelectItem value="science-fiction-soft-sci-fi">Soft Sci-Fi</SelectItem>
        <SelectItem value="science-fiction-space-opera">Space Opera</SelectItem>
        <SelectItem value="science-fiction-time-travel">Time Travel</SelectItem>
        <SelectItem value="dystopian-post-apocalyptic-climate-fiction">Climate Fiction</SelectItem>
        <SelectItem value="dystopian-post-apocalyptic-ya-dystopia">YA Dystopia</SelectItem>
        <SelectItem value="fantasy-dark-fantasy">Dark Fantasy</SelectItem>
        <SelectItem value="fantasy-high-fantasy">High Fantasy</SelectItem>
        <SelectItem value="fantasy-low-fantasy">Low Fantasy</SelectItem>
        <SelectItem value="fantasy-portal-fantasy">Portal Fantasy</SelectItem>
        <SelectItem value="fantasy-urban-fantasy">Urban Fantasy</SelectItem>
        <SelectItem value="historical-fiction-alternate-history">Alternate History</SelectItem>
        <SelectItem value="historical-fiction-biographical-fiction">Biographical Fiction</SelectItem>
        <SelectItem value="horror-body-horror">Body Horror</SelectItem>
        <SelectItem value="horror-cosmic-horror">Cosmic Horror</SelectItem>
        <SelectItem value="horror-psychological-horror">Psychological Horror</SelectItem>
        <SelectItem value="horror-supernatural-horror">Supernatural Horror</SelectItem>
        <SelectItem value="mystery-thriller-crime-thriller">Crime Thriller</SelectItem>
        <SelectItem value="mystery-thriller-noir">Noir</SelectItem>
        <SelectItem value="mystery-thriller-police-procedural">Police Procedural</SelectItem>
        <SelectItem value="mystery-thriller-psychological-thriller">Psychological Thriller</SelectItem>
        <SelectItem value="romance-contemporary-romance">Contemporary Romance</SelectItem>
        <SelectItem value="romance-historical-romance">Historical Romance</SelectItem>
        <SelectItem value="romance-lgbtq-romance">LGBTQ+ Romance</SelectItem>
        <SelectItem value="romance-paranormal-romance">Paranormal Romance</SelectItem>
        <SelectItem value="romance-romantic-suspense">Romantic Suspense</SelectItem>
        <SelectItem value="science-technology-ai-tech">AI/Tech</SelectItem>
        <SelectItem value="science-technology">Science & Technology</SelectItem>
        <SelectItem value="self-help-personal-development-mindfulness">Mindfulness</SelectItem>
        <SelectItem value="self-help-personal-development-productivity">Productivity</SelectItem>
        <SelectItem value="slice-of-life">Slice of Life</SelectItem>
        <SelectItem value="true-crime-">True Crime</SelectItem>
        <SelectItem value="true-crime-white-collar-crime">White Collar Crime</SelectItem>
      </SelectContent>
    </>
  )
}

const ProjectParameters = (): ReactNode => {
  const rawActiveProject = useSelector(selectActiveProject);
  const activeProjectWithCover = useSelector(selectActiveProjectWithCoverDataUrl);
  const dispatch = useDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(rawActiveProject?.title || '')
  const [genre, setGenre] = useState<Genre>(rawActiveProject?.genre || 'science-fiction')
  const [summary, setSummary] = useState(rawActiveProject?.summary || '')
  const [writingSample, setWritingSample] = useState(rawActiveProject?.writingSample || '')
  const [year, setYear] = useState(rawActiveProject?.year || 0)
  const [wordCountTarget, setWordCountTarget] = useState(rawActiveProject?.wordCountTarget || 0)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(activeProjectWithCover?.cover || null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    if (rawActiveProject) {
      setTitle(rawActiveProject.title || '');
      setGenre(rawActiveProject.genre || 'science-fiction');
      setSummary(rawActiveProject.summary || '');
      setWritingSample(rawActiveProject.writingSample || '');
      setYear(rawActiveProject.year || 0);
      setWordCountTarget(rawActiveProject.wordCountTarget || 0);
      if (!coverPreviewUrl && activeProjectWithCover?.cover) {
        setCoverPreviewUrl(activeProjectWithCover.cover);
      } else if (!rawActiveProject.coverImageBase64) {
        setCoverPreviewUrl(null);
      }
    } else {
      setTitle('');
      setGenre('science-fiction');
      setSummary('');
      setWritingSample('');
      setYear(0);
      setWordCountTarget(0);
      setCoverPreviewUrl(null);
    }
  }, [rawActiveProject]);

  const handleSave = async () => {
    if (rawActiveProject) {
      dispatch(
        updateParameters({
          title,
          genre,
          summary,
          year,
          wordCountTarget,
          writingSample
        })
      )
      toast.success('Project parameters saved successfully!')
    }
  }

  const handleCoverButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Reusable function to process the selected/dropped image file with validation
  const processImageFile = (file: File) => {
    // --- Validation Start ---
    if (!file) {
      toast.error('No file selected.');
      return;
    }

    // 1. File Type Check
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}.`);
      return;
    }

    // 2. File Size Check
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`File is too large. Maximum size: ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }
    // --- Validation End ---

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const mimeTypeMatch = result.match(/^data:(.+);base64,/);
      if (mimeTypeMatch && mimeTypeMatch[1]) {
        const mimeType = mimeTypeMatch[1];
        const base64Data = result.substring(result.indexOf(',') + 1);
        setCoverPreviewUrl(result);
        dispatch(updateCoverImage({ base64: base64Data, mimeType: mimeType }));
        toast.info('Cover image updated. Save project to persist changes.');
      } else {
        toast.error('Invalid file format. Could not read image data.');
        setCoverPreviewUrl(null);
        dispatch(updateCoverImage({ base64: null, mimeType: null }));
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file.');
      setCoverPreviewUrl(null);
      dispatch(updateCoverImage({ base64: null, mimeType: null }));
    };
    reader.readAsDataURL(file);
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(event.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processImageFile(file); // Reuse validation and processing logic
    } else {
      toast.error("No file detected in drop event.");
    }
  };
  // --- End Drag and Drop Handlers ---


  return (
    <div className="container mx-auto p-24 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-highlight-700">Project Parameters </h1>

      {rawActiveProject ? (
        <div className="grid md:grid-cols-12 gap-6">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover Image Section with Drop Zone */}
              <div className="mb-4">
                <Label>Cover Image</Label>
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
                      src={coverPreviewUrl || `/covers/${genre}.png`}
                      alt="Cover Preview"
                      className="h-32 w-24 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `/covers/${genre}.png`;
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <Button type="button" variant="outline" onClick={handleCoverButtonClick} className="mb-2">
                      <Upload className="mr-2 h-4 w-4" /> Change Cover
                    </Button>
                    <p className="text-xs text-gray-500 text-center">or drag & drop (JPG, PNG, WebP, max {MAX_IMAGE_SIZE_MB}MB)</p> {/* Updated helper text */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={ALLOWED_IMAGE_TYPES.join(',')} // Update accept attribute
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Other Basic Fields */}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" disabled value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="genre">Genre</Label>
                <Select onValueChange={(value: Genre) => setGenre(value)} value={genre}>
                  <GenreOptions />
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || 0)} />
              </div>
              <div>
                <Label htmlFor="wordCountTarget">Target Word Count</Label>
                <Input id="wordCountTarget" type="number" value={wordCountTarget} onChange={(e) => setWordCountTarget(parseInt(e.target.value, 10) || 0)} />
              </div>
              <Button onClick={handleSave}>Save Parameters</Button>
            </CardContent>
          </Card>
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea id="summary" className="w-full resize-none border rounded p-2 h-64" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </CardContent>
          </Card>
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Writing Sample</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea id="writingSample" className="w-full resize-none border rounded p-2 h-64" value={writingSample} onChange={(e) => setWritingSample(e.target.value)} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <p>Loading project parameters...</p>
      )}

    </div>
  )
}

export default ProjectParameters
