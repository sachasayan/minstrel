import { useDispatch, useSelector } from 'react-redux'
import { useRef, JSX, useCallback } from 'react'

import { setProjectHasLiveEdits, selectProjects, updateFile } from '@/lib/store/projectsSlice'
import { setActiveSection } from '@/lib/store/appStateSlice'
import { LexicalEditor } from './LexicalEditor'

interface ArticleViewerProps {
    title: string | null
    content: string
}

export function ArticleViewer({ title, content }: ArticleViewerProps): JSX.Element {
    const dispatch = useDispatch()
    const projectState = useSelector(selectProjects)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleContentChange = useCallback((newContent: string) => {
        dispatch(updateFile({ title: title || 'Untitled', content: newContent }))

        if (!projectState.projectHasLiveEdits) {
            dispatch(setProjectHasLiveEdits(true))
        }
    }, [dispatch, projectState.projectHasLiveEdits, title])

    return (
        <div ref={containerRef} className="relative w-full max-w-7xl mx-auto h-full overflow-y-auto overflow-x-hidden no-scrollbar px-6 py-1 md:px-24 md:py-12">
            {projectState.pendingFiles?.includes(title || '') && (
                <div className="absolute z-50 top-0 left-0 inset-0 bg-black opacity-50">
                    <div className="loader sticky top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 size-20"></div>
                </div>
            )}

            <div className="flex flex-row gap-6">
                <div className="flex-grow"></div>
                <div className="max-w-3xl w-full">
                    <LexicalEditor
                        initialContent={content || ''}
                        onChange={handleContentChange}
                        activeSection={title}
                        onSectionChange={(section) => dispatch(setActiveSection(section))}
                        containerRef={containerRef}
                    />
                </div>
                <div className="flex-grow"></div>
            </div>
        </div>
    )
}
