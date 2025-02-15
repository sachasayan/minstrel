import { useSelector } from 'react-redux'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Star } from 'lucide-react'
import { chapterData, characters } from './mockData'
import { selectProjects } from '@/lib/utils/projectsSlice'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function NovelDashboard() {
  const projectState = useSelector(selectProjects)

  const novelData = { chapterData, characters }

  const characterColors = {
    aria: '#669900ff', // avocado
    thorne: '#99cc33ff', // yellow-green
    elara: '#ccee66ff', // mindaro
    cassius: '#006699ff', // lapis-lazuli
    lyra: '#3399ccff', // celestial-blue
    zephyr: '#990066ff', // murrey
    sage: '#cc3399ff', // red-violet
    rook: '#ff6600ff' // pumpkin
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* <h1 className="text-3xl font-bold mb-6">{novelData.title} - Dashboard</h1> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Novel Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Novel Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {projectState.activeProject?.summary || ''}
            </p>
          </CardContent>
        </Card>

        {/* Per-Chapter Word Count Graph */}
        <Card>
          <CardHeader>
            <CardTitle>Word Count per Chapter</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              style={{ aspectRatio: 'auto' }}
              config={{
                wordCount: {
                  label: 'Word Count',
                  color: 'black'
                }
              }}
              className="h-[300px]"
            >

              <LineChart data={novelData.chapterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="chapter" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="wordCount"
                  stroke="black"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>

            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Character Mentions per Chapter */}
      <Card>
        <CardHeader>
          <CardTitle>Character Mentions per Chapter</CardTitle>
          <CardDescription>
            Stacked bar graph showing mentions of each character per chapter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            style={{ aspectRatio: 'auto' }}
            config={novelData.characters.reduce((acc, char, index) => {
              acc[char.name] = {
                label: char.name,
                color: 'black'
              }
              return acc
            }, {})}
            className="h-[400px]"
          >

            <BarChart data={novelData.chapterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="chapter" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {novelData.characters.map((character) => (
                <Bar
                  key={character.name}
                  dataKey={character.name}
                  stackId="a"
                  fill={characterColors[character.name.toLowerCase()]}
                />
              ))}
            </BarChart>

          </ChartContainer>
        </CardContent>
      </Card>

      {/* Critic Suggestions */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Critic Suggestions</CardTitle>
          <CardDescription>
            Feedback and improvement suggestions from literary critics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {criticSuggestions.map((suggestion, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{suggestion.critic}</CardTitle>
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
      </Card> */}
    </div>
  )
}
