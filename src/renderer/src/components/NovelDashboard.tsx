import { useSelector, useDispatch } from 'react-redux' // Import useDispatch
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react' // Corrected import for useState and useEffect
// import { chapterData, characters } from './mockData'; // Removed mock data
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { extractCharactersFromOutline, getCharacterFrequencyData, colors } from '@/lib/dashboardUtils'
import { ProgressTracker } from '@/components/dashboard/ProgressTracker' // Import ProgressTracker
import { Button } from '@/components/ui/button' // Import Button
import { addChatMessage } from '@/lib/store/chatSlice' // Import addChatMessage
import { current } from '@reduxjs/toolkit'

type NovelStage = 'Writing Skeleton' | 'Writing Outline' | 'Writing Chapters' | 'Editing'; // Define NovelStage type

export default function NovelDashboard() {
  const activeProject = useSelector(selectActiveProject)
  // const [progressButtonCaption, setProgressButtonCaption] = useState<Array<{ name: string }>>([])
  const [characters, setCharacters] = useState<Array<{ name: string }>>([])
  const [characterFrequencyData, setCharacterFrequencyData] = useState<any[]>([]);
  const dispatch = useDispatch() // Initialize useDispatch

  useEffect(() => {
    if (activeProject) {
      const extractedCharacters = extractCharactersFromOutline(
        activeProject.files.find((file) => file.title.indexOf('Outline') != -1)?.content || ''
      );
      setCharacters(extractedCharacters);
      setCharacterFrequencyData(getCharacterFrequencyData(activeProject));
    } else {
      setCharacters([]);
      setCharacterFrequencyData([]);
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
  const getCurrentStage = (): NovelStage => { // Explicitly return NovelStage
    if (!activeProject) return 'Writing Skeleton' // Default to Skeleton if no project
    const hasSkeleton = activeProject.files.some(file => file.title.toLowerCase().includes('skeleton'))
    const hasOutline = activeProject.files.some(file => file.title.toLowerCase().includes('outline'))
    const chapterFiles = activeProject.files.filter(file => file.title.toLowerCase().startsWith('chapter'))
    const hasChapters = chapterFiles.length > 0;
    const chapterCount = chapterFiles.length;


    if (!hasSkeleton) return 'Writing Skeleton'
    if (!hasOutline) return 'Writing Outline'
    return 'Writing Chapters'
    if (!hasChapters) return 'Writing Chapters' // Stage is Write Chapters if outline and some chapters exist but less than 3
    return 'Editing' // Default to 'Write Chapters' if both Skeleton and Outline exist but no chapters
  }

  const stages: NovelStage[] = ['Writing Skeleton', 'Writing Outline', 'Writing Chapters', 'Editing'] // Use NovelStage type for stages
  const currentStage = getCurrentStage()


  const getButtonCaption = () => {
    switch (currentStage) {
      case 'Writing Skeleton': return 'Write the skeleton..';
      case 'Writing Outline': return 'Add the outline.';
      case 'Writing Chapters': return 'Write the next chapter.';
      case 'Editing': return 'Write a review.';
      default: return 'Exploring your options.'
    }
  }
  // Function to handle progress to next stage
  const handleNextStage = () => {
    let nextStageInstruction = '';
    switch (currentStage) {
      case 'Writing Skeleton':
        nextStageInstruction = 'Please create a skeleton.';
        break;
      case 'Writing Outline':
        nextStageInstruction = 'Please add the outline.';
        break;
      case 'Writing Chapters':
        nextStageInstruction = 'Please write the next chapter.';
        break;
      case 'Editing':
        nextStageInstruction = 'Please write a review of the story so far.';
        break;
      default:
        nextStageInstruction = 'Hey there. What can I do next?';
    }

    if (nextStageInstruction) {
      dispatch(addChatMessage({ sender: 'User', text: nextStageInstruction }));
    }
  }


  return (
    <div className="container mx-auto p-24 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-highlight-700">Your Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Guide */}
        <Card className="md:col-span-12 ">
          <CardHeader>
            <CardTitle>Progress So Far</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressTracker stages={stages} currentStage={currentStage} />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Current Stage: {currentStage}</p>
              {/* {currentStage !== 'Editing' && ( // Now comparison is valid */}
              <div>
                <div className="inline-block mr-4">What&apos;s next? Try...</div>
                <Button variant="outline" size="sm" onClick={handleNextStage}>
                  {getButtonCaption()}
                </Button>
              </div>
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
      </div>
    </div>
  )
}
