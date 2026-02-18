import { useDispatch, useSelector } from 'react-redux'
import { useRef, JSX, useCallback } from 'react'

import { setProjectHasLiveEdits, selectProjects, updateFile } from '@/lib/store/projectsSlice'
import { setActiveSection } from '@/lib/store/appStateSlice'
import { getChaptersFromStoryContent } from '@/lib/storyContent'
import { DashboardRibbon } from './DashboardRibbon'
import { LexicalEditor } from './LexicalEditor'

interface StoryViewerProps {
    title: string | null
    content: string
}

export function StoryViewer({ title, content }: StoryViewerProps): JSX.Element {
    const dispatch = useDispatch()
    const projectState = useSelector(selectProjects)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleContentChange = useCallback((newContent: string) => {
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

            if (chapters[index] && chapters[index].title !== parts[0]) {
                dispatch(setActiveSection(`${chapters[index].title}|||${index}`))
            }
        }

        if (!projectState.projectHasLiveEdits) {
            dispatch(setProjectHasLiveEdits(true))
        }
    }, [dispatch, projectState.projectHasLiveEdits, title])

    return (
        <div ref={containerRef} className="relative w-full max-w-7xl mx-auto h-full overflow-y-auto overflow-x-hidden no-scrollbar px-6 py-1 md:px-24 md:py-12">
            <div id="overview-target" className="w-full h-1" />

            {projectState.activeProject && (
                <h1 className="text-4xl font-bold mb-8 text-highlight-700">
                    {projectState.activeProject.title}
                </h1>
            )}

            <DashboardRibbon />

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
