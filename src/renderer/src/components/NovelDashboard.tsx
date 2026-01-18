import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Star } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

import { selectActiveProject } from '@/lib/store/projectsSlice'
import { colors, updateRollingWordCountHistory } from '@/lib/dashboardUtils' // Removed extractCharactersFromOutline, getCharacterFrequencyData
import { updateMetaProperty } from '@/lib/store/projectsSlice'
import { ProgressTracker } from '@/components/dashboard/ProgressTracker'
import { Button } from '@/components/ui/button'
import { addChatMessage } from '@/lib/store/chatSlice'
import { CoverCard } from '@/components/CoverCard'
import FloatingToolbar from '@/components/FloatingToolbar' // Import the new toolbar


type NovelStage = 'Writing Outline' | 'Writing Chapters' | 'Editing'; // Define NovelStage type

export default function NovelDashboard() {
  const activeProject = useSelector(selectActiveProject)
  // const [progressButtonCaption, setProgressButtonCaption] = useState<Array<{ name: string }>>([])
  const [dialogueCountData, setDialogueCountData] = useState<any[]>([]);

  const dispatch = useDispatch() // Initialize useDispatch



  useEffect(() => {
    if (activeProject) {
      const updatedHistory = updateRollingWordCountHistory(activeProject)


      const historical = activeProject.wordCountHistorical || []

      // Only dispatch ONCE if it's entirely missing in Redux and we have data
      if ((!historical || historical.length === 0) && updatedHistory.length > 0) {
        dispatch(updateMetaProperty({
          property: 'wordCountHistorical',
          value: updatedHistory
        }))
      }


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



  return (
    <div className="container mx-auto p-12 pt-24 max-w-5xl">
      <div className="@container">


        <h1 className="text-3xl font-bold mb-6 text-highlight-700">Dashboard for {activeProject?.title}</h1>

        <div className="grid @lg:grid-cols-12 @lg:gap-6 grid-flow-row-dense">

          <Card className="@lg:col-span-3">

            <CardContent className="p-0 m-0 h-full">
              <CoverCard />
            </CardContent>
          </Card>

          {/* Guide */}

          <Card className="@lg:col-span-9 ">
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
          <Card className="@lg:col-span-5">
            <CardHeader>
              <CardTitle>Novel Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{activeProject?.summary || ''}</p>
            </CardContent>
          </Card>

          {/* Per-Chapter Word Count Graph */}
          <Card className="@lg:col-span-7">
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
                    <Bar dataKey="chapterWordCount" fill="var(--color-highlight-600)" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p>No active project data available.</p>
              )}
            </CardContent>
          </Card>


          {/* Expert Suggestions */}
          {activeProject?.expertSuggestions.map((suggestion, index) => (
            <Card className="@lg:col-span-6" key={index}>
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


          {/* Dialogue Sentences per Chapter */}
          <Card className="@lg:col-span-6">
            <CardHeader>
              <CardTitle>Character Dialogue Analysis</CardTitle>
              <CardDescription>Note: Estimated dialogue, may be inaccurate.</CardDescription>
            </CardHeader>
            <CardContent>
              {activeProject && dialogueCountData.length > 0 ? (
                <ChartContainer
                  style={{ aspectRatio: 'auto' }}
                  config={dialogueCountData.length > 0 ? Object.keys(dialogueCountData[0]).filter(k => k !== 'chapter').reduce((acc, key) => {
                    acc[key] = { label: key }
                    return acc
                  }, {}) : {}}
                  className="h-[400px]"
                >
                  <LineChart data={dialogueCountData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="chapter" tickFormatter={(tick: string) => tick} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {dialogueCountData.length > 0 && Object.keys(dialogueCountData[0]).filter(key => key !== 'chapter').map((charName, index) => (
                      <Line
                        key={charName}
                        type="monotone"
                        dataKey={charName}
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
      <FloatingToolbar /> {/* Add the toolbar here */}
    </div >
  )
}
