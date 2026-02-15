import { MDXEditor, MDXEditorMethods, headingsPlugin, listsPlugin, thematicBreakPlugin } from '@mdxeditor/editor'
import { UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin, BlockTypeSelect, ListsToggle } from '@mdxeditor/editor'
import { useDispatch, useSelector } from 'react-redux'
import { useRef, useEffect, JSX, useCallback, useMemo } from 'react'

import '@mdxeditor/editor/style.css'
import { setProjectHasLiveEdits, selectProjects, updateFile } from '@/lib/store/projectsSlice'
import { setActiveSection } from '@/lib/store/appStateSlice'
import { DashboardRibbon } from './editor/DashboardRibbon'

interface MarkdownViewerProps {
  title: string | null // Allow null
  content: string
}

export default function MarkdownViewer({ title, content }: MarkdownViewerProps): JSX.Element {
  const dispatch = useDispatch()
  const projectState = useSelector(selectProjects)
  const ref = useRef<MDXEditorMethods>(null)
  const isProgrammaticScroll = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleContentChange = useCallback((newContent: string) => {
    const targetTitle = title?.includes('|||') ? 'Story' : title || 'Story'
    dispatch(updateFile({ title: targetTitle, content: newContent }))
    if (!projectState.projectHasLiveEdits) {
      dispatch(setProjectHasLiveEdits(true))
    }
  }, [dispatch, projectState.projectHasLiveEdits, title])

  // Initial load
  useEffect(() => {
    ref.current?.setMarkdown(content || '')
  }, [content])

  // Scroll to section when title changes (e.g. from sidebar)
  useEffect(() => {
    if (title === 'Overview') {
      isProgrammaticScroll.current = true
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => { isProgrammaticScroll.current = false }, 1000)
      return
    }

    if (title && title.includes('|||')) {
      const [, indexStr] = title.split('|||')
      const index = parseInt(indexStr)

      // Find all H1s and navigate to the N-th one
      setTimeout(() => {
        const headings = containerRef.current?.querySelectorAll('h1')
        if (headings && headings[index]) {
          isProgrammaticScroll.current = true
          headings[index].scrollIntoView({ behavior: 'smooth', block: 'start' })

          // Release the lock after animation finishes (approx 1s)
          setTimeout(() => {
            isProgrammaticScroll.current = false
          }, 1000)
        }
      }, 100)
    }
  }, [title])

  // Bi-directional sync: IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // IGNORE if we are mid-programmatic-scroll to avoid feedback loops
        if (isProgrammaticScroll.current) return

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            if (entry.target.id === 'overview-target') {
              if (title !== 'Overview') {
                dispatch(setActiveSection('Overview'))
              }
              return
            }

            const heading = entry.target as HTMLElement
            const headings = Array.from(containerRef.current?.querySelectorAll('h1') || [])
            const index = headings.indexOf(heading as HTMLHeadingElement)
            if (index !== -1) {
              const chapterTitle = heading.innerText.trim()
              // Only dispatch if it's different to avoid loops
              const newSection = `${chapterTitle}|||${index}`
              if (title !== newSection) {
                dispatch(setActiveSection(newSection))
              }
            }
          }
        })
      },
      {
        root: null,
        rootMargin: '-10% 0px -70% 0px', // Focus on the top 20ish percent
        threshold: [0, 0.5, 1]
      }
    )

    // Observe dashboard overview
    const overview = containerRef.current?.querySelector('#overview-target')
    if (overview) observer.observe(overview)

    const headings = containerRef.current?.querySelectorAll('h1')
    headings?.forEach((h) => observer.observe(h))

    return () => observer.disconnect()
  }, [content, dispatch, title])

  const handleError = (error: { error: string; source: string }) => {
    console.error('MDXEditor Error:', error.error)
    console.error('Source Markdown:', error.source)
  }

  const plugins = useMemo(() => [
    headingsPlugin(),
    listsPlugin(),
    thematicBreakPlugin(),
    toolbarPlugin({
      toolbarClassName: 'mdx-toolbar',
      toolbarContents: () => (
        <>
          <UndoRedo />
          <BoldItalicUnderlineToggles />
          <BlockTypeSelect />
          <ListsToggle options={['number', 'bullet']} />
        </>
      )
    })
  ], [])

  return (
    <>
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
            <div className="loader sticky top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  size-20"></div>
          </div>
        )}

        <div className="flex flex-row gap-6 ">
          <div className="flex-grow"></div>
          <div className=" max-w-2xl w-full">
            <MDXEditor
              ref={ref}
              className="mdx-theme h-full"
              markdown={content || ''}
              onChange={handleContentChange}
              onError={handleError}
              plugins={plugins}
              contentEditableClassName="prose max-w-none"
            />
          </div>
          <div className="flex-grow"></div>
        </div>
      </div>
    </>
  )
}
