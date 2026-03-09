import { useDispatch, useSelector } from 'react-redux'
import { useRef, JSX, useCallback, useState, useMemo } from 'react'

import { setProjectHasLiveEdits, selectProjects, updateFile, updateParameters, addChapter } from '@/lib/store/projectsSlice'
import { setActiveSection } from '@/lib/store/appStateSlice'
import { selectChat } from '@/lib/store/chatSlice'
import { getChaptersFromStoryContent } from '@/lib/storyContent'
import { DashboardRibbon } from './DashboardRibbon'
import { LexicalEditor } from './LexicalEditor'
import { GutterIcons } from './GutterIcons'
import { TitleModal } from './TitleModal'
import { ListOrdered } from 'lucide-react'
import { ActiveSection } from '@/types'
import { isChapterSection, makeChapterSection } from '@/lib/activeSection'

interface StoryViewerProps {
  activeSection: ActiveSection
  content: string
}

export function StoryViewer({ activeSection, content }: StoryViewerProps): JSX.Element {
  const dispatch = useDispatch()
  const projectState = useSelector(selectProjects)
  const chatState = useSelector(selectChat)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false)

  const chapters = useMemo(() => {
    return projectState.activeProject ? getChaptersFromStoryContent(projectState.activeProject.storyContent) : []
  }, [projectState.activeProject?.storyContent])

  const modifiedChapters = projectState.modifiedChapters || []

  const artifacts = useMemo(
    () => [
      {
        title: 'Outline',
        icon: <ListOrdered className="h-4 w-4" />
      }
    ],
    []
  )

  const isPending = chatState.pendingChat

  const handleContentChange = useCallback(
    (newContent: string) => {
      // Don't write back empty/whitespace content — this can happen during the brief
      // window between setActiveProjectFromFragment (skeleton state) and setActiveProject
      // (real data loaded). Writing blank content here would clobber the real data on save.
      if (!newContent || !newContent.trim()) return

      const isChapter = isChapterSection(activeSection)
      const targetTitle = 'Story'

      let chapterIndex: number | undefined = undefined
      if (isChapter) {
        chapterIndex = activeSection.index
      }

      dispatch(updateFile({ title: targetTitle, content: newContent, chapterIndex }))

      // Synchronize the activeSection title if it changed in the text
      if (isChapter) {
        const index = activeSection.index
        const chapters = getChaptersFromStoryContent(newContent)

        if (chapters[index] && (chapters[index].title !== activeSection.title || chapters[index].id !== activeSection.chapterId)) {
          const newSection = makeChapterSection(chapters[index].title, index, chapters[index].id)
          dispatch(setActiveSection(newSection))
        }
      }

      if (!projectState.projectHasLiveEdits) {
        dispatch(setProjectHasLiveEdits(true))
      }
    },
    [activeSection, dispatch, projectState.projectHasLiveEdits]
  )

  const openTitleModal = useCallback(() => {
    setIsTitleModalOpen(true)
  }, [])

  const closeTitleModal = useCallback(() => {
    setIsTitleModalOpen(false)
  }, [])

  const saveTitleEdit = useCallback(
    (nextTitle: string) => {
      if (!projectState.activeProject) return
      dispatch(
        updateParameters({
          title: nextTitle,
          genre: projectState.activeProject.genre,
          summary: projectState.activeProject.summary ?? '',
          year: projectState.activeProject.year ?? new Date().getFullYear(),
          wordCountTarget: projectState.activeProject.wordCountTarget ?? 80000
        })
      )
      closeTitleModal()
    },
    [dispatch, projectState.activeProject, closeTitleModal]
  )

  return (
    <div ref={containerRef} className="story-viewer-scroll relative h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 py-1 md:px-24 md:py-12">
        <div id="overview-target" className="w-full h-1" />

        {projectState.activeProject && (
          <div className="group flex items-center gap-3 mb-8">
            <h1 className="text-4xl font-bold text-highlight-700 dark:text-highlight-300">{projectState.activeProject.title}</h1>
            <button
              onClick={openTitleModal}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
              aria-label="Edit story title"
            >
              Edit
            </button>
          </div>
        )}

        <TitleModal
          initialTitle={projectState.activeProject?.title ?? ''}
          isOpen={isTitleModalOpen}
          projectFiles={projectState.activeProject?.files ?? []}
          onClose={closeTitleModal}
          onSave={saveTitleEdit}
        />

        <DashboardRibbon />

        {isPending && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="bg-background/80 backdrop-blur-md border border-highlight-500/20 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
              <div className="size-3 bg-highlight-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold text-highlight-700 dark:text-highlight-300">Agent is thinking...</span>
            </div>
          </div>
        )}

        <div className={`flex flex-row gap-6 transition-opacity duration-500 ${isPending ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex-grow flex justify-end items-start pt-12">
            <GutterIcons
              activeSection={activeSection}
              chapters={chapters}
              modifiedChapters={modifiedChapters}
              artifacts={artifacts}
              onSelect={(section) => dispatch(setActiveSection(section))}
              onAddChapter={() => dispatch(addChapter())}
            />
          </div>
          <div className="max-w-3xl w-full">
            <LexicalEditor
              initialContent={content || ''}
              onChange={handleContentChange}
              activeSection={activeSection}
              onSectionChange={(section) => dispatch(setActiveSection(section))}
              containerRef={containerRef}
              editable={!isPending}
            />
          </div>
          <div className="flex-grow"></div>
        </div>
      </div>
    </div>
  )
}
