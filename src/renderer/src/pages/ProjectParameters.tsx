import { ReactNode, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Genre } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectActiveProject,
  updateParameters,
} from '@/lib/store/projectsSlice'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

// Define constants for validation

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
  const dispatch = useDispatch()

  const [title, setTitle] = useState(rawActiveProject?.title || '')
  const [genre, setGenre] = useState<Genre>(rawActiveProject?.genre || 'science-fiction')
  const [summary, setSummary] = useState(rawActiveProject?.summary || '')
  const [writingSample, setWritingSample] = useState(rawActiveProject?.writingSample || '')
  const [year, setYear] = useState(rawActiveProject?.year || 0)
  const [wordCountTarget, setWordCountTarget] = useState(rawActiveProject?.wordCountTarget || 0)

  useEffect(() => {
    if (rawActiveProject) {
      setTitle(rawActiveProject.title || '');
      setGenre(rawActiveProject.genre || 'science-fiction');
      setSummary(rawActiveProject.summary || '');
      setWritingSample(rawActiveProject.writingSample || '');
      setYear(rawActiveProject.year || 0);
      setWordCountTarget(rawActiveProject.wordCountTarget || 0);
    } else {
      setTitle('');
      setGenre('science-fiction');
      setSummary('');
      setWritingSample('');
      setYear(0);
      setWordCountTarget(0);
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
