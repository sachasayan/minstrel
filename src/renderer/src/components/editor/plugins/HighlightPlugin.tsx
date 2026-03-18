import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectProjects } from '@/lib/store/projectsSlice'
import { getAddedRanges, stripMarkdown } from '@/lib/utils/diffUtils'
import { extractChapterId } from '@/lib/storyContent'
import { $getRoot, $isElementNode, TextNode } from 'lexical'
import { $createMarkNode, MarkNode } from '@lexical/mark'
import { $isChapterHeadingNode } from '../nodes/ChapterHeadingNode'
import { ActiveSection } from '@/types'
import { isChapterSection, isOverviewSection } from '@/lib/activeSection'

interface HighlightPluginProps {
  activeSection: ActiveSection
}

export function HighlightPlugin({ activeSection }: HighlightPluginProps): null {
  const [editor] = useLexicalComposerContext()
  const { lastEdit } = useSelector(selectProjects)
  const processingRef = useRef(false)

  useEffect(() => {
    if (!lastEdit || processingRef.current) return

    const applyHighlights = () => {
      if (processingRef.current) return
      processingRef.current = true

      try {
        editor.update(
          () => {
            const root = $getRoot()
            const normalizedSection = activeSection?.kind === 'artifact' ? activeSection.title.toLowerCase() : activeSection?.kind === 'chapter' ? activeSection.title.toLowerCase() : ''
            const normalizedFile = lastEdit.fileTitle.toLowerCase()
            const activeIdx = isChapterSection(activeSection) ? activeSection.index : undefined
            const activeId = isChapterSection(activeSection) ? activeSection.chapterId : undefined

            const isOverview = isOverviewSection(activeSection)
            const isChapterEdit = lastEdit.chapterId !== undefined || lastEdit.chapterIndex !== undefined

            const isMatch =
              (isOverview && isChapterEdit) ||
              (lastEdit.chapterId !== undefined && activeId === lastEdit.chapterId) ||
              (lastEdit.chapterIndex !== undefined && lastEdit.chapterIndex === activeIdx) ||
              normalizedSection.includes(normalizedFile) ||
              normalizedFile.includes(normalizedSection)

            if (!isMatch) return

            const isMonolithic = (isChapterSection(activeSection) || isOverview) && (lastEdit.chapterId !== undefined || lastEdit.chapterIndex !== undefined)

            const targetTextNodes: Array<{ node: TextNode; offset: number }> = []
            let accumulatedText = ''

            const rootChildren = root.getChildren()
            let inSection = !isMonolithic
            let currentChapterCount = 0

            for (const child of rootChildren) {
              const childText = child.getTextContent()
              const childType = child.getType()
              const isHeading = childType === 'heading' || childType === 'chapter-heading'

              if (isMonolithic && isHeading) {
                let currentId: string | undefined = undefined
                if ($isChapterHeadingNode(child)) {
                  currentId = child.getChapterId()
                } else {
                  currentId = extractChapterId(childText) || undefined
                }

                let isTarget = false
                if (lastEdit.chapterId && currentId) {
                  isTarget = currentId === lastEdit.chapterId
                } else if (lastEdit.chapterIndex !== undefined) {
                  isTarget = currentChapterCount === lastEdit.chapterIndex
                }

                if (isTarget) {
                  inSection = true
                  const descendantNodes = $isElementNode(child) ? child.getAllTextNodes() : []
                  for (const node of descendantNodes) {
                    targetTextNodes.push({
                      node,
                      offset: accumulatedText.length
                    })
                    accumulatedText += node.getTextContent().replace(/<!--\s*id:.*-->/, '')
                  }
                  accumulatedText += '\n\n'
                  currentChapterCount++
                  continue
                } else if (inSection) {
                  break
                }
                currentChapterCount++
              }

              if (inSection && $isElementNode(child)) {
                const descendantTextNodes = child.getAllTextNodes()
                for (const node of descendantTextNodes) {
                  targetTextNodes.push({
                    node,
                    offset: accumulatedText.length
                  })
                  accumulatedText += node.getTextContent()
                }
                accumulatedText += '\n\n'
              }
            }

            if (targetTextNodes.length === 0) return

            const trimStart = accumulatedText.length - accumulatedText.trimStart().length
            const normalizedNewText = accumulatedText.trim()
            const oldPlainText = stripMarkdown(lastEdit.oldContent)

            const ranges = getAddedRanges(oldPlainText, normalizedNewText)
            if (ranges.length === 0) return

            const nodesToWrap: TextNode[] = []
            for (const range of ranges) {
              const rangeStart = range.start + trimStart
              const rangeEnd = range.end + trimStart

              for (const item of targetTextNodes) {
                const nodeStart = item.offset
                const nodeEnd = nodeStart + item.node.getTextContentSize()

                if (rangeStart < nodeEnd && rangeEnd > nodeStart) {
                  const relativeStart = Math.max(0, rangeStart - nodeStart)
                  const relativeEnd = Math.min(item.node.getTextContentSize(), rangeEnd - nodeStart)

                  if (relativeStart > 0 || relativeEnd < item.node.getTextContentSize()) {
                    try {
                      const splitNodes = item.node.splitText(relativeStart, relativeEnd)
                      const targetNode = relativeStart > 0 ? splitNodes[1] : splitNodes[0]
                      if (targetNode) nodesToWrap.push(targetNode)
                    } catch {
                      /* ignore */
                    }
                  } else {
                    nodesToWrap.push(item.node)
                  }
                }
              }
            }

            for (const node of nodesToWrap) {
              if (node.isAttached()) {
                const parent = node.getParent()
                if (parent instanceof MarkNode) continue
                const markNode = $createMarkNode(['agent-edit'])
                node.replace(markNode)
                markNode.append(node)
              }
            }
          },
          { tag: 'apply-highlights' }
        )
      } finally {
        processingRef.current = false
      }
    }

    // 1. Listen for the 'import-markdown' tag from MarkdownSyncPlugin
    let unregister: (() => void) | null = null
    let fallbackTimeoutId: NodeJS.Timeout | null = null

    const registerListener = () => {
      unregister = editor.registerUpdateListener(({ tags }) => {
        if (tags.has('import-markdown')) {
          if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId)
          applyHighlights()
          if (unregister) unregister()
        }
      })
    }

    // 2. Set a small fallback timeout in case the markdown was already synced or tag is missed
    fallbackTimeoutId = setTimeout(() => {
      applyHighlights()
      if (unregister) unregister()
    }, 300)

    registerListener()

    return () => {
      if (unregister) unregister()
      if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId)
    }
  }, [editor, lastEdit, activeSection])

  return null
}
