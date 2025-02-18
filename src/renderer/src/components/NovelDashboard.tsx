import { useSelector } from 'react-redux'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Star } from 'lucide-react'
import { Project } from '@/types'
// import { chapterData, characters } from './mockData'; // Removed mock data
import { selectActiveProject } from '@/lib/utils/projectsSlice'

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)']

function extractCharactersFromOutline(outlineContent: string): { name: string }[] {
  console.log(outlineContent)
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
      console.log(line)
      const match = line.match(/\*\*([A-z -]+).*\*\*/i) // Capture the character name, should be in bold
      if (match) {
        characters.push({ name: match[1].trim() })
      }
    }
  }
  console.log(characters)
  return characters
}


function getCharacterFrequencyData(activeProject: Project): any[] {
  const characters = extractCharactersFromOutline(activeProject.files.find((f) => f.title === 'Outline.md')?.content || '')
  return activeProject.files
    .filter((file) => file.title.startsWith('Chapter-'))
    .map((file) => {
      const chapterData: { [key: string]: number | string } = {
        chapter: file.title,
        wordCount: file.content.split(/\s+/).length
      }

      characters.forEach((char, index) => {
        const escapedName = char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        chapterData[char.name] = (file.content.match(`\\b${escapedName}\\b`) || []).length
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

  // const novelData = { chapterData, characters };  // Replaced with dynamic data


  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* <h1 className="text-3xl font-bold mb-6">{novelData.title} - Dashboard</h1> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2 ">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>Looks like you're on a streak!</CardContent>
        </Card>

        {/* Novel Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Novel Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{activeProject?.summary || ''}</p>
          </CardContent>
        </Card>

        {/* Per-Chapter Word Count Graph */}
        <Card>
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
                      chapter: file.title,
                      wordCount: file.content.split(/\s+/).length
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="chapter"
                    tickFormatter={(tick: string) => {
                      const match = tick.match(/(\d+)/)
                      return match ? match[1] : tick
                    }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="wordCount" fill="black" />
                </BarChart>
              </ChartContainer>
            ) : (
              <p>No active project data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Character Mentions per Chapter */}
        <Card>
          <CardHeader>
            <CardTitle>Character Mentions per Chapter</CardTitle>
            <CardDescription>Stacked bar graph showing mentions of each character per chapter</CardDescription>
          </CardHeader>
          <CardContent>
            {activeProject ? (
              <ChartContainer
                style={{ aspectRatio: 'auto' }}
                config={extractCharactersFromOutline(activeProject.files.find((file) => file.title === 'Outline.md')?.content || '').reduce((acc, char) => {
                  acc[char.name] = {
                    label: char.name
                  }
                  return acc
                }, {})}
                className="h-[400px]"
              >
                <BarChart
                  data={getCharacterFrequencyData(activeProject)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="chapter"
                    tickFormatter={(tick: string) => {
                      const match = tick.match(/(\d+)/)
                      return match ? match[1] : tick
                    }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {extractCharactersFromOutline(activeProject.files.find((file) => file.title === 'Outline.md')?.content || '').map((character, index) => (
                    <Bar key={character.name} dataKey={character.name} stackId="a" fill={colors[index % colors.length]} />
                  ))}
                </BarChart>
              </ChartContainer>
            ) : (
              <p>No active project data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Expert Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>Expert Suggestions</CardTitle>
            <CardDescription>Feedback and improvement suggestions from literary experts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeProject?.expertSuggestions.map((suggestion, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{suggestion.expert}</CardTitle>
                    <CardDescription>{suggestion.publication}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StarRating rating={suggestion.rating} />
                    <p className="mt-2 text-sm text-muted-foreground">{suggestion.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
