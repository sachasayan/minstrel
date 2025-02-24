import { useSelector } from 'react-redux'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Star } from 'lucide-react'
import { Project } from '@/types'
// import { chapterData, characters } from './mockData'; // Removed mock data
import { selectActiveProject } from '@/lib/store/projectsSlice'

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)']

function extractCharactersFromOutline(outlineContent: string): { name: string }[] {
  const characters: { name: string }[] = []
  const lines = outlineContent.split('\n')
  let inCharacterSection = false

  for (const line of lines) {
    if (line.startsWith('## Characters')) {
      inCharacterSection = true
      continue
    }

    if (inCharacterSection) {
      // Stop parsing when we reach another heading of the same or higher level
      if (line.startsWith('#') && !line.startsWith('###')) {
        break
      }
      const match = line.match(/\*\*([A-z -]+).*\*\*/i) // Capture the character name, should be in bold
      if (match) {
        characters.push({ name: match[1].trim() })
      }
    }
  }
  return characters
}

function getCharacterFrequencyData(activeProject: Project): any[] {
  const characters = extractCharactersFromOutline(activeProject.files.find((f) => f.title.indexOf('Outline') != -1)?.content || '')

  return activeProject.files
    .filter((file) => file.title.indexOf('Chapter') != -1)
    .map((file, i) => {
      const chapterData: { [key: string]: number | string } = {
        chapter: i + 1,
        wordCount: file.content.split(/\s+/).length
      }

      characters.forEach((char, index) => {
        const escapedName = char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        chapterData[char.name] = (file.content.match(new RegExp(`\\b${escapedName}\\b`, 'g')) || []).length
        chapterData[`${char.name}_color`] = colors[index % colors.length] // Store color
      })
      return chapterData
    })
}

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

export default function NovelDashboard() {
  const activeProject = useSelector(selectActiveProject)

  return (
    <div className="container mx-auto p-24 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-highlight-700">Your Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        {/* Novel Summary */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Novel Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{activeProject?.summary || ''}</p>
          </CardContent>
        </Card>

        {/* Per-Chapter Word Count Graph */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Word Count per Chapter</CardTitle>
          </CardHeader>
          <CardContent>
            {activeProject ? (
              <ChartContainer
                style={{ aspectRatio: 'auto' }}
                config={{
                  wordCount: {
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
                      wordCount: file.content.split(/\s+/).length
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="chapter"
                    tickFormatter={(tick: string) => tick}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="wordCount" fill="var(--color-highlight-900)" />
                </BarChart>
              </ChartContainer>
            ) : (
              <p>No active project data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Character Mentions per Chapter */}
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>Character Mentions per Chapter</CardTitle>
            <CardDescription>Line graph showing mentions of each character per chapter</CardDescription>
          </CardHeader>
          <CardContent>
            {activeProject ? (
              <ChartContainer
                style={{ aspectRatio: 'auto' }}
                config={extractCharactersFromOutline(activeProject.files.find((file) => file.title.indexOf('Outline') != -1)?.content || '').reduce((acc, char) => {
                  acc[char.name] = {
                    label: char.name
                  }
                  return acc
                }, {})}
                className="h-[400px]"
              >
                <LineChart data={getCharacterFrequencyData(activeProject)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="chapter"
                    tickFormatter={(tick: string) => tick}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {extractCharactersFromOutline(activeProject.files.find((file) => file.title.indexOf('Outline') != -1)?.content || '').map((character, index) => (
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
          <Card className="col-span-2" key={index}>
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
        <Card className="md:col-span-7 ">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>Looks like you&apos;re on a streak!</CardContent>
        </Card>
      </div>
    </div>
  )
}
