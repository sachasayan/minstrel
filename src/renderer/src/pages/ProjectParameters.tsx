import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Genre } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSelector, useDispatch } from 'react-redux'
import { selectActiveProject, updateParameters } from '@/lib/utils/projectsSlice'
import type { RootState } from '@/lib/utils/store'
import { toast } from 'sonner'

const ProjectParameters = () => {
  const activeProject = useSelector((state: RootState) => selectActiveProject(state))
  const dispatch = useDispatch()

  const [title, setTitle] = useState(activeProject?.title || '')
  const [genre, setGenre] = useState<Genre>(activeProject?.genre || 'science-fiction')
  const [summary, setSummary] = useState(activeProject?.summary || '')
  const [year, setYear] = useState(activeProject?.year || 0)
  const [totalWordCount, setTotalWordCount] = useState(activeProject?.totalWordCount || 0)

  const handleSave = async () => {
    if (activeProject) {
      dispatch(
        updateParameters({
          title,
          genre,
          summary,
          year,
          totalWordCount
        })
      )
      // Provide some user feedback that the save was successful.
      toast.success('Project parameters saved successfully!')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Project Parameters</h1>
      {activeProject ? (
        <>
          <div className="mb-4">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="mb-4">
            <Label htmlFor="genre">Genre</Label>
            <Select onValueChange={(value: Genre) => setGenre(value)} defaultValue={genre}>
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
            </Select>
          </div>
          <div className="mb-4">
            <Label htmlFor="summary">Summary</Label>
            <textarea id="summary" className="w-full border rounded p-2" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="mb-4">
            <Label htmlFor="year">Year</Label>
            <Input id="year" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} />
          </div>
          <div className="mb-4">
            <Label htmlFor="totalWordCount">Total Word Count</Label>
            <Input id="totalWordCount" type="number" value={totalWordCount} onChange={(e) => setTotalWordCount(parseInt(e.target.value, 10))} />
          </div>
          <Button onClick={handleSave}>Save</Button>
        </>
      ) : (
        <p>Loading project parameters...</p>
      )}
    </div>
  )
}

export default ProjectParameters
