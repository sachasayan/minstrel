import { useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Star } from 'lucide-react'
import { useMemo } from 'react'

import { selectActiveProject } from '@/lib/store/projectsSlice'
import { colors } from '@/lib/dashboardUtils'
import { CoverCard } from '@/components/CoverCard'
import { getChapterWordCounts } from '@/lib/storyContent'

type DialogueCountRow = {
    chapter: number
    [characterName: string]: number
}

export function DashboardRibbon() {
    const activeProject = useSelector(selectActiveProject)

    const chapterData = useMemo(() => {
        if (!activeProject) return []
        return getChapterWordCounts(activeProject.storyContent || '').map((c, i) => ({
            chapter: i + 1,
            chapterWordCount: c.wordCount
        }))
    }, [activeProject?.storyContent])

    const dialogueCountData = useMemo<DialogueCountRow[]>(() => {
        const dialogCounts = activeProject?.dialogueAnalysis?.dialogCounts
        if (!dialogCounts) return []

        const charNames = Object.keys(dialogCounts)
        if (charNames.length === 0) return []

        const chapterCount = Math.max(...charNames.map((name) => dialogCounts[name]?.length ?? 0))
        return Array.from({ length: chapterCount }, (_, chapterIdx) => {
            const chapterData: DialogueCountRow = { chapter: chapterIdx + 1 }
            for (const charName of charNames) {
                chapterData[charName] = dialogCounts[charName]?.[chapterIdx] ?? 0
            }
            return chapterData
        })
    }, [activeProject?.dialogueAnalysis])

    if (!activeProject) return null

    const hasSummary = Boolean(activeProject.summary?.trim())
    const hasWordCountChart = chapterData.some((c) => c.chapterWordCount > 0)
    const hasDialogueChart = dialogueCountData.length > 0
    const hasExpertSuggestions = activeProject.expertSuggestions.length > 0
    const hasVisibleSections = hasSummary || hasWordCountChart || hasDialogueChart || hasExpertSuggestions

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
        <div
            className={`w-full overflow-hidden transition-all ${hasVisibleSections ? 'mb-12' : 'mb-0 max-h-0'}`}
            data-state={hasVisibleSections ? 'expanded' : 'collapsed'}
            id="project-overview"
        >
            <div className="grid grid-flow-dense auto-rows-[minmax(220px,_auto)] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                {/* Cover Card */}
                {hasSummary && (
                    <div className="md:col-span-1 xl:col-span-1 xl:row-span-2">
                        <Card className="h-full min-h-[220px] overflow-hidden border-none bg-muted/30 shadow-sm">
                            <CardContent className="p-0 h-full">
                                <CoverCard className="h-full object-cover" />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Summary Card */}
                {hasSummary && (
                    <Card className="min-h-[220px] border-none bg-muted/20 shadow-sm md:col-span-1 xl:col-span-1">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[160px] overflow-y-auto px-4">
                            <p className="text-sm leading-relaxed text-foreground/80">{activeProject.summary}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Word Count Progress Chart */}
                {hasWordCountChart && (
                    <Card className="min-h-[220px] border-none bg-muted/20 shadow-sm md:col-span-2 xl:col-span-2">
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
                {hasDialogueChart && (
                    <Card className="min-h-[220px] border-none bg-muted/20 shadow-sm md:col-span-2 xl:col-span-2">
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
                    <Card
                        key={index}
                        className="min-h-[220px] border-none bg-muted/20 shadow-sm md:col-span-1 xl:col-span-1"
                    >
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
            </div>
        </div>
    )
}
