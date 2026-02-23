import { useDispatch, useSelector } from 'react-redux'
import { useRef, JSX, useCallback, useState, useMemo } from 'react'

import { setProjectHasLiveEdits, selectProjects, updateFile, updateParameters } from '@/lib/store/projectsSlice'
import { setActiveSection } from '@/lib/store/appStateSlice'
import { selectChat } from '@/lib/store/chatSlice'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { getChaptersFromStoryContent } from '@/lib/storyContent'
import { suggestTitles } from '@/lib/assistants/titleSuggestion'
import { DashboardRibbon } from './DashboardRibbon'
import { LexicalEditor } from './LexicalEditor'

interface StoryViewerProps {
    title: string | null
    content: string
}

export function StoryViewer({ title, content }: StoryViewerProps): JSX.Element {
    const dispatch = useDispatch()
    const projectState = useSelector(selectProjects)
    const chatState = useSelector(selectChat)
    const settings = useSelector(selectSettingsState)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isTitleModalOpen, setIsTitleModalOpen] = useState(false)
    const [editingTitle, setEditingTitle] = useState('')
    const [suggestedTitles, setSuggestedTitles] = useState<string[]>([])
    const [isSuggestingTitles, setIsSuggestingTitles] = useState(false)
    const titleInputRef = useRef<HTMLInputElement>(null)

    const isPending = chatState.pendingChat

    const handleContentChange = useCallback((newContent: string) => {
        // Don't write back empty/whitespace content — this can happen during the brief
        // window between setActiveProjectFromFragment (skeleton state) and setActiveProject
        // (real data loaded). Writing blank content here would clobber the real data on save.
        if (!newContent || !newContent.trim()) return

        const isChapter = title?.includes('|||')
        const targetTitle = 'Story'

        let chapterIndex: number | undefined = undefined
        if (isChapter && title) {
            const parts = title.split('|||')
            chapterIndex = parseInt(parts[parts.length - 1])
        }

        dispatch(updateFile({ title: targetTitle, content: newContent, chapterIndex }))

        // Synchronize the activeSection title if it changed in the text
        if (isChapter && title) {
            const parts = title.split('|||')
            const index = parseInt(parts[parts.length - 1])
            const chapters = getChaptersFromStoryContent(newContent)

            if (chapters[index] && (chapters[index].title !== parts[0] || chapters[index].id !== parts[2])) {
                const newSection = `${chapters[index].title}|||${index}${chapters[index].id ? `|||${chapters[index].id}` : ''}`
                dispatch(setActiveSection(newSection))
            }
        }

        if (!projectState.projectHasLiveEdits) {
            dispatch(setProjectHasLiveEdits(true))
        }
    }, [dispatch, projectState.projectHasLiveEdits, title])

    const openTitleModal = useCallback(() => {
        setEditingTitle(projectState.activeProject?.title ?? '')
        setSuggestedTitles([])
        setIsTitleModalOpen(true)
        // Focus input on next tick after render
        setTimeout(() => titleInputRef.current?.focus(), 50)

        // Kick off title suggestions from the Outline file
        const files = projectState.activeProject?.files ?? []
        console.log('[TitleModal] All project files:', files.map(f => f.title))
        console.log('[TitleModal] Settings provider:', settings.provider, '| has googleApiKey:', !!settings.googleApiKey, '| has openaiApiKey:', !!settings.openaiApiKey)

        const outlineFile = files.find((f) => f.title.toLowerCase().includes('outline'))
        console.log('[TitleModal] Outline file found:', !!outlineFile, '| content length:', outlineFile?.content?.length ?? 0)

        if (outlineFile?.content) {
            setIsSuggestingTitles(true)
            suggestTitles(settings, outlineFile.content)
                .then((titles) => {
                    console.log('[TitleModal] Suggestions received:', titles)
                    setSuggestedTitles(titles)
                })
                .catch((err) => console.error('[TitleModal] suggestTitles threw:', err))
                .finally(() => setIsSuggestingTitles(false))
        } else {
            console.warn('[TitleModal] No outline content — skipping suggestions.')
        }
    }, [projectState.activeProject, settings])

    const closeTitleModal = useCallback(() => {
        setIsTitleModalOpen(false)
        setSuggestedTitles([])
        setIsSuggestingTitles(false)
    }, [])

    const saveTitleEdit = useCallback(() => {
        if (!projectState.activeProject) return
        const trimmed = editingTitle.trim()
        if (!trimmed) return
        dispatch(updateParameters({
            title: trimmed,
            genre: projectState.activeProject.genre,
            summary: projectState.activeProject.summary ?? '',
            year: projectState.activeProject.year ?? new Date().getFullYear(),
            wordCountTarget: projectState.activeProject.wordCountTarget ?? 80000
        }))
        closeTitleModal()
    }, [dispatch, editingTitle, projectState.activeProject, closeTitleModal])

    /** Strip a leading emoji + optional space from an LLM-suggested title */
    const stripEmoji = (s: string) =>
        s.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u, '').trim()

    /** 12 unique skeleton patterns — each is an array of bar widths to render side-by-side */
    const skeletonPatterns = useMemo(() => [
        ['w-2/3'],                      // 0: single medium
        ['w-2/5', 'w-1/3'],            // 1: two short bars
        ['w-4/5'],                      // 2: single long
        ['w-1/2', 'w-1/4'],            // 3: long + short
        ['w-1/3', 'w-2/5', 'w-1/6'],  // 4: three tiny bars
        ['w-3/5'],                      // 5: single medium-long
        ['w-1/4', 'w-2/4'],            // 6: short + medium
        ['w-5/6'],                      // 7: nearly full
        ['w-1/3', 'w-1/3'],            // 8: two equal bars
        ['w-3/4'],                      // 9: three-quarter
        ['w-2/5', 'w-1/5', 'w-1/4'],  // 10: three mixed
        ['w-1/2'],                      // 11: half
    ], [])

    return (
        <div ref={containerRef} className="relative w-full max-w-7xl mx-auto h-full overflow-y-auto overflow-x-hidden no-scrollbar px-6 py-1 md:px-24 md:py-12">
            <div id="overview-target" className="w-full h-1" />

            {projectState.activeProject && (
                <div className="group flex items-center gap-3 mb-8">
                    <h1 className="text-4xl font-bold text-highlight-700">
                        {projectState.activeProject.title}
                    </h1>
                    <button
                        onClick={openTitleModal}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
                        aria-label="Edit story title"
                    >
                        Edit
                    </button>
                </div>
            )}

            {isTitleModalOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) closeTitleModal() }}
                >
                    <div className="bg-card border border-border rounded-xl shadow-2xl px-8 py-6 w-full max-w-lg flex flex-col gap-4">
                        <h2 className="text-base font-semibold text-foreground">Rename story</h2>
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveTitleEdit()
                                if (e.key === 'Escape') closeTitleModal()
                            }}
                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-highlight-500"
                            placeholder="Story title"
                        />

                        {/* AI title suggestions — always rendered once modal is open to avoid height jump */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                {isSuggestingTitles && (
                                    <span className="inline-block size-2 rounded-full bg-highlight-500 animate-pulse" />
                                )}
                                Suggested titles
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const suggestion = suggestedTitles[i]
                                    return suggestion ? (
                                        <button
                                            key={suggestion}
                                            onClick={() => setEditingTitle(stripEmoji(suggestion))}
                                            title={stripEmoji(suggestion)}
                                            style={{ animationDelay: `${i * 80}ms` }}
                                            className="h-8 animate-in fade-in zoom-in-95 duration-300 text-xs text-left px-2.5 rounded-md border border-border bg-background hover:bg-muted hover:border-highlight-500/40 transition-colors truncate flex items-center"
                                        >
                                            {suggestion}
                                        </button>
                                    ) : (
                                        <div
                                            key={i}
                                            className="h-8 px-2.5 rounded-md border border-border bg-background flex items-center gap-1.5"
                                        >
                                            {skeletonPatterns[i].map((w, j) => (
                                                <span
                                                    key={j}
                                                    style={{ animationDelay: `${j * 120}ms` }}
                                                    className={`h-2 rounded-full bg-muted animate-pulse ${w}`}
                                                />
                                            ))}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={closeTitleModal}
                                className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveTitleEdit}
                                className="text-sm font-medium text-highlight-700 hover:text-highlight-600 px-3 py-1.5 rounded-lg hover:bg-highlight-500/10 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DashboardRibbon />

            {isPending && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="bg-background/80 backdrop-blur-md border border-highlight-500/20 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="size-3 bg-highlight-500 rounded-full animate-pulse"></div>
                        <span className="text-lg font-semibold text-highlight-700">Agent is thinking...</span>
                    </div>
                </div>
            )}


            <div className={`flex flex-row gap-6 transition-opacity duration-500 ${isPending ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex-grow"></div>
                <div className="max-w-3xl w-full">
                    <LexicalEditor
                        initialContent={content || ''}
                        onChange={handleContentChange}
                        activeSection={title}
                        onSectionChange={(section) => dispatch(setActiveSection(section))}
                        containerRef={containerRef}
                        editable={!isPending}
                    />
                </div>
                <div className="flex-grow"></div>
            </div>
        </div>
    )
}
