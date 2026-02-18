import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Star } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'

import { selectActiveProject, updateMetaProperty } from '@/lib/store/projectsSlice'
import { colors, updateRollingWordCountHistory } from '@/lib/dashboardUtils'
import { CoverCard } from '@/components/CoverCard'
import { getChapterWordCounts } from '@/lib/storyContent'

export default function NovelDashboard() {
  const activeProject = useSelector(selectActiveProject)
  const [dialogueCountData, setDialogueCountData] = useState<any[]>([]);

  const chapterData = useMemo(() => {
    if (!activeProject) return []
    return getChapterWordCounts(activeProject.storyContent || '').map((chapter, index) => ({
      index: index,
      chapter: index + 1,
      chapterWordCount: chapter.wordCount
    }))
  }, [activeProject?.storyContent])

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
                  <BarChart data={chapterData}>
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
    </div >
  )
}
