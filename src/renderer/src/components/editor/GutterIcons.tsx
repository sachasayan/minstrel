import * as React from 'react'
import { LayoutDashboard, Book, Diff, Plus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ActiveSection } from '@/types'
import { isArtifactSection, isChapterSection, isOverviewSection, makeArtifactSection, makeChapterSection, makeOverviewSection } from '@/lib/activeSection'

interface GutterIconsProps {
    activeSection: ActiveSection
    chapters: Array<{ title: string; id?: string }>
    modifiedChapters?: number[]
    artifacts: Array<{ title: string; icon: React.ReactNode }>
    onSelect: (section: ActiveSection) => void
    onAddChapter?: () => void
}

export function GutterIcons({
    activeSection,
    chapters,
    modifiedChapters = [],
    artifacts,
    onSelect,
    onAddChapter
}: GutterIconsProps) {
    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col gap-2 py-4 items-center sticky top-12 z-40 p-1.5 transition-all duration-300">
                {/* Dashboard */}
                <GutterItem
                    icon={<LayoutDashboard className="h-4 w-4" />}
                    label="Dashboard"
                    isActive={isOverviewSection(activeSection)}
                    onClick={() => onSelect(makeOverviewSection())}
                />

                {artifacts.length > 0 && (
                    <div className="h-px w-6 bg-border/20 my-1" />
                )}

                {/* Artifacts */}
                <div className="flex flex-col gap-1.5">
                    {artifacts.map((artifact, i) => (
                        <GutterItem
                            key={`artifact-${i}`}
                            icon={artifact.icon}
                            label={artifact.title}
                            isActive={isArtifactSection(activeSection) && activeSection.title === artifact.title}
                            onClick={() => onSelect(makeArtifactSection(artifact.title))}
                        />
                    ))}
                </div>

                {chapters.length > 0 && (
                    <div className="h-px w-6 bg-border/20 my-1" />
                )}

                {/* Chapters */}
                <div className="flex flex-col gap-1.5">
                    {chapters.map((chapter, i) => (
                        <GutterItem
                            key={`chapter-${i}`}
                            icon={<Book className="h-4 w-4" />}
                            label={chapter.title || `Chapter ${i + 1}`}
                            isActive={isChapterSection(activeSection) && activeSection.index === i}
                            isModified={modifiedChapters.includes(i)}
                            onClick={() => onSelect(makeChapterSection(chapter.title, i, chapter.id))}
                        />
                    ))}
                    {onAddChapter && (
                        <GutterItem
                            icon={<Plus className="h-4 w-4" />}
                            label="Add Chapter"
                            isActive={false}
                            onClick={onAddChapter}
                        />
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}

interface GutterItemProps {
    icon: React.ReactNode
    label: string
    isActive: boolean
    isModified?: boolean
    onClick: () => void
}

function GutterItem({ icon, label, isActive, isModified, onClick }: GutterItemProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        onClick()
                    }}
                    className={`
            relative flex items-center justify-center size-9 rounded-lg transition-all duration-200 group
            ${isActive
                            ? 'bg-highlight-500/15 text-highlight-700 shadow-sm ring-1 ring-highlight-500/20'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
          `}
                >
                    {icon}
                    {isModified && (
                        <div className="absolute -top-0.5 -right-0.5 pointer-events-none">
                            <Diff className="size-3.5 text-orange-500 bg-background rounded-full p-0.5 shadow-sm border border-orange-500/20" />
                        </div>
                    )}
                    {isActive && (
                        <div className="absolute -left-3 w-1.5 h-6 bg-highlight-500 rounded-r-full shadow-[0px_0px_8px_rgba(var(--highlight-500-rgb),0.4)]" />
                    )}
                </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover/95 backdrop-blur-md border-border/50 text-foreground font-medium shadow-xl">
                <p className="text-xs">{label}</p>
            </TooltipContent>
        </Tooltip>
    )
}
