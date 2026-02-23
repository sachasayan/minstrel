import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Star } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'

import { selectActiveProject, setWordCountHistorical } from '@/lib/store/projectsSlice'
import { colors, updateRollingWordCountHistory } from '@/lib/dashboardUtils'
import { CoverCard } from '@/components/CoverCard'
import { getChapterWordCounts } from '@/lib/storyContent'

export function DashboardRibbon() {
    const activeProject = useSelector(selectActiveProject)
    const [dialogueCountData, setDialogueCountData] = useState<any[]>([])
    const dispatch = useDispatch()

    const chapterData = useMemo(() => {
        if (!activeProject) return []
        return getChapterWordCounts(activeProject.storyContent || '').map((c, i) => ({
            chapter: i + 1,
            chapterWordCount: c.wordCount
        }))
    }, [activeProject?.storyContent])

    useEffect(() => {
        if (activeProject) {
            // Historical word count logic
            // Note: In a larger refactor, this might belong in a middleware
            // but keeping it aligned with existing NovelDashboard logic for now.
            // @ts-ignore - assuming updateRollingWordCountHistory is imported correctly or we use the logic
            const updatedHistory = updateRollingWordCountHistory ? updateRollingWordCountHistory(activeProject) : []
            const historical = activeProject.wordCountHistorical || []

            if ((!historical || historical.length === 0) && updatedHistory?.length > 0) {
                dispatch(setWordCountHistorical(updatedHistory))
            }

            // Generate dialogue count data
            const analysis = activeProject.dialogueAnalysis
            if (analysis && analysis.dialogCounts) {
                const charNames = Object.keys(analysis.dialogCounts)
                const chapterCount = Math.max(...charNames.map(name => analysis.dialogCounts[name].length))
                const transformed: any[] = []
                for (let chapterIdx = 0; chapterIdx < chapterCount; chapterIdx++) {
                    const chapterData: any = { chapter: chapterIdx + 1 }
                    for (const charName of charNames) {
                        chapterData[charName] = analysis.dialogCounts[charName][chapterIdx] ?? 0
                    }
                    transformed.push(chapterData)
                }
                setDialogueCountData(transformed)
            }
        }
    }, [activeProject, dispatch])

    if (!activeProject) return null

    function StarRating({ rating }: { rating: number }) {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-3 h-3 ${star <= rating ? 'text-highlight-500 fill-current' : 'text-gray-300'}`} />
                ))}
            </div>
        )
    }

    return (
        <div className="w-full overflow-hidden mb-12" id="project-overview">
            <div className="flex flex-row gap-4 overflow-x-auto pb-4 no-scrollbar items-stretch">

                {/* Cover Card */}
                <div className="flex-shrink-0 w-48">
                    <Card className="h-full overflow-hidden border-none shadow-sm bg-muted/30">
                        <CardContent className="p-0 h-full">
                            <CoverCard className="h-full object-cover" />
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Card */}
                {activeProject.summary && (
                    <Card className="flex-shrink-0 w-80 bg-muted/20 border-none shadow-sm h-64">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 overflow-y-auto h-44">
                            <p className="text-sm leading-relaxed text-foreground/80">{activeProject.summary}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Word Count Progress Chart */}
                {chapterData.some(c => c.chapterWordCount > 0) && (
                    <Card className="flex-shrink-0 w-96 bg-muted/20 border-none shadow-sm h-64">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Word Count per Chapter</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ChartContainer
                                className="h-44 w-full"
                                config={{
                                    chapterWordCount: { label: 'Words' }
                                }}
                            >
                                <BarChart data={chapterData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="chapter" hide />
                                    <YAxis hide />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Bar dataKey="chapterWordCount" fill="var(--color-highlight-500)" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Character Dialogue Analysis */}
                {dialogueCountData.length > 0 && (
                    <Card className="flex-shrink-0 w-96 bg-muted/20 border-none shadow-sm h-64">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dialogue Flow</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ChartContainer
                                className="h-44 w-full"
                                config={{}}
                            >
                                <LineChart data={dialogueCountData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="chapter" hide />
                                    <YAxis hide />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    {Object.keys(dialogueCountData[0] || {}).filter(k => k !== 'chapter').map((name, i) => (
                                        <Line
                                            key={name}
                                            type="monotone"
                                            dataKey={name}
                                            stroke={colors[i % colors.length]}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    ))}
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Expert Feedback Cards */}
                {activeProject.expertSuggestions.map((suggestion, index) => (
                    <Card key={index} className="flex-shrink-0 w-72 bg-muted/20 border-none shadow-sm h-64">
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-bold">{suggestion.name}</CardTitle>
                                <p className="text-[10px] text-muted-foreground italic leading-tight">{suggestion.expertise}</p>
                            </div>
                            <StarRating rating={suggestion.rating} />
                        </CardHeader>
                        <CardContent className="px-4 py-0 overflow-y-auto h-40">
                            <p className="text-[11px] leading-snug text-muted-foreground line-clamp-6">{suggestion.critique}</p>
                        </CardContent>
                    </Card>
                ))}

                {/* Placeholder for spacing */}
                <div className="flex-shrink-0 w-8"></div>
            </div>
        </div>
    )
}
