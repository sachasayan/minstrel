import { useDispatch, useSelector } from 'react-redux'
import { useRef, JSX, useCallback } from 'react'

import { setProjectHasLiveEdits, selectProjects, updateFile } from '@/lib/store/projectsSlice'
import { setActiveSection } from '@/lib/store/appStateSlice'
import { selectChat } from '@/lib/store/chatSlice'
import { LexicalEditor } from './LexicalEditor'

interface ArticleViewerProps {
    title: string | null
    content: string
}

export function ArticleViewer({ title, content }: ArticleViewerProps): JSX.Element {
    const dispatch = useDispatch()
    const projectState = useSelector(selectProjects)
    const chatState = useSelector(selectChat)
    const containerRef = useRef<HTMLDivElement>(null)

    const isPending = chatState.pendingChat

    const handleContentChange = useCallback((newContent: string) => {
        dispatch(updateFile({ title: title || 'Untitled', content: newContent }))

        if (!projectState.projectHasLiveEdits) {
            dispatch(setProjectHasLiveEdits(true))
        }
    }, [dispatch, projectState.projectHasLiveEdits, title])

    return (
        <div ref={containerRef} className="relative w-full max-w-7xl mx-auto h-full overflow-y-auto overflow-x-hidden no-scrollbar px-6 py-1 md:px-24 md:py-12">
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
