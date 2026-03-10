import { useDispatch, useSelector } from 'react-redux'
import { Fragment, useRef, JSX, useCallback, useState, useMemo, ReactNode } from 'react'
import { remark } from 'remark'

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
  const outlineContent = useMemo(() => {
    return projectState.activeProject?.files?.find((file) => file.title === 'Outline')?.content || ''
  }, [projectState.activeProject?.files])

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
            <ReadOnlyOutline content={outlineContent} />
            <LexicalEditor
              initialContent={content || ''}
              onChange={handleContentChange}
              activeSection={activeSection}
              onSectionChange={(section) => dispatch(setActiveSection(section))}
              containerRef={containerRef}
              editable={!isPending}
            />
          </div>
          <div className="flex-grow flex justify-start items-start pt-12">
            <div
              data-chat-dock-target="true"
              aria-hidden="true"
              className="sticky top-12 h-px w-[390px] max-w-full shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ReadOnlyOutline({ content }: { content: string }): JSX.Element {
  const tree = useMemo(() => remark().parse(content || ''), [content])

  return (
    <section
      data-outline-target="true"
      className="mb-10 rounded-2xl border border-border/50 bg-muted/10 px-6 py-6"
    >
      <div className="mb-4 flex items-center gap-2 text-highlight-700 dark:text-highlight-300">
        <ListOrdered className="h-4 w-4" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Outline</h2>
      </div>
      {tree.children.length > 0 ? (
        <div className="space-y-4 text-sm leading-7 text-foreground/90">
          {renderMarkdownNodes(tree.children)}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">No outline yet.</p>
      )}
    </section>
  )
}

function renderMarkdownNodes(nodes: any[], keyPrefix = 'md'): JSX.Element[] {
  return nodes
    .map((node, index) => renderMarkdownNode(node, `${keyPrefix}-${index}`))
    .filter((node): node is JSX.Element => node !== null)
}

function renderMarkdownNode(node: any, key: string): JSX.Element | null {
  switch (node.type) {
    case 'heading': {
      const content = renderInlineNodes(node.children, key)

      if (node.depth === 1) {
        return (
          <h3 key={key} className="text-2xl font-semibold text-foreground">
            {content}
          </h3>
        )
      }

      if (node.depth === 2) {
        return (
          <h4 key={key} className="text-lg font-semibold text-foreground">
            {content}
          </h4>
        )
      }

      return (
        <h5 key={key} className="text-base font-semibold text-foreground">
          {content}
        </h5>
      )
    }
    case 'paragraph':
      return (
        <p key={key} className="whitespace-pre-wrap">
          {renderInlineNodes(node.children, key)}
        </p>
      )
    case 'list': {
      const ListTag = node.ordered ? 'ol' : 'ul'
      return (
        <ListTag
          key={key}
          className={node.ordered ? 'space-y-2 pl-5 list-decimal' : 'space-y-2 pl-5 list-disc'}
        >
          {node.children?.map((child: any, index: number) => renderListItem(child, `${key}-${index}`))}
        </ListTag>
      )
    }
    case 'blockquote':
      return (
        <blockquote key={key} className="border-l-2 border-border/70 pl-4 italic text-muted-foreground">
          <div className="space-y-3">{renderMarkdownNodes(node.children ?? [], key)}</div>
        </blockquote>
      )
    case 'code':
      return (
        <pre key={key} className="overflow-x-auto rounded-xl bg-background/70 px-4 py-3 text-xs leading-6 text-foreground">
          <code>{node.value ?? ''}</code>
        </pre>
      )
    case 'thematicBreak':
      return <hr key={key} className="border-border/60" />
    default:
      return null
  }
}

function renderListItem(node: any, key: string): JSX.Element {
  const isTightParagraph =
    node.children?.length === 1 &&
    node.children[0]?.type === 'paragraph'

  return (
    <li key={key}>
      {isTightParagraph ? (
        <span>{renderInlineNodes(node.children[0].children ?? [], key)}</span>
      ) : (
        <div className="space-y-2">{renderMarkdownNodes(node.children ?? [], key)}</div>
      )}
    </li>
  )
}

function renderInlineNodes(nodes: any[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => renderInlineNode(node, `${keyPrefix}-inline-${index}`))
}

function renderInlineNode(node: any, key: string): ReactNode {
  switch (node.type) {
    case 'text':
      return node.value ?? ''
    case 'strong':
      return <strong key={key} className="font-semibold text-foreground">{renderInlineNodes(node.children ?? [], key)}</strong>
    case 'emphasis':
      return <em key={key} className="italic">{renderInlineNodes(node.children ?? [], key)}</em>
    case 'delete':
      return <del key={key} className="line-through opacity-70">{renderInlineNodes(node.children ?? [], key)}</del>
    case 'inlineCode':
      return <code key={key} className="rounded bg-background/80 px-1.5 py-0.5 text-[0.9em]">{node.value ?? ''}</code>
    case 'link':
      return (
        <a
          key={key}
          href={node.url ?? '#'}
          target="_blank"
          rel="noreferrer"
          className="text-highlight-700 underline decoration-highlight-500/40 underline-offset-4 hover:decoration-highlight-500 dark:text-highlight-300"
        >
          {renderInlineNodes(node.children ?? [], key)}
        </a>
      )
    case 'break':
      return <br key={key} />
    default:
      return <Fragment key={key}>{renderInlineNodes(node.children ?? [], key)}</Fragment>
  }
}
