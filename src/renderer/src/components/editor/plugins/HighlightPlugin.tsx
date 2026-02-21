import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectProjects, clearLastEdit } from '@/lib/store/projectsSlice'
import { getAddedRanges, stripMarkdown } from '@/lib/utils/diffUtils'
import { extractChapterId } from '@/lib/storyContent'
import { $getRoot, $isElementNode, TextNode } from 'lexical'
import { $createMarkNode, MarkNode } from '@lexical/mark'
import { $isChapterHeadingNode } from '../nodes/ChapterHeadingNode'

interface HighlightPluginProps {
    activeSection: string | null
}

export function HighlightPlugin({ activeSection }: HighlightPluginProps): null {
    const [editor] = useLexicalComposerContext()
    const { lastEdit } = useSelector(selectProjects)
    const dispatch = useDispatch()
    const processingRef = useRef(false)

    useEffect(() => {
        if (!lastEdit || processingRef.current) return

        const normalizedSection = activeSection?.toLowerCase() || ''
        const normalizedFile = lastEdit.fileTitle.toLowerCase()
        const sectionIndexParts = activeSection?.split('|||')
        const activeIdx = sectionIndexParts && sectionIndexParts.length > 1 ? parseInt(sectionIndexParts[1]) : undefined

        const activeId = sectionIndexParts && sectionIndexParts.length > 2 ? sectionIndexParts[2] : undefined

        const isMatch = (lastEdit.chapterId !== undefined && activeId === lastEdit.chapterId) ||
            (lastEdit.chapterIndex !== undefined && lastEdit.chapterIndex === activeIdx) ||
            normalizedSection.includes(normalizedFile) ||
            normalizedFile.includes(normalizedSection)

        // Listener to clear highlights as soon as the user types
        const removeUpdateListener = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
            if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
                if (!processingRef.current) {
                    dispatch(clearLastEdit())
                }
            }
        })

        if (!isMatch) {
            return () => removeUpdateListener()
        }
        if (isMatch) {
            processingRef.current = true

            // Wait to ensure MarkdownSyncPlugin has fully finished tree construction
            const timeoutIdInternal = setTimeout(() => {
                try {
                    editor.update(() => {
                        const root = $getRoot()
                        const isMonolithic = activeSection?.includes('|||')

                        const targetTextNodes: Array<{ node: TextNode, offset: number }> = []
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
                                } else if (inSection) {
                                    break // Next section reached
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

                        if (targetTextNodes.length === 0) {
                            return
                        }

                        const trimStart = accumulatedText.length - accumulatedText.trimStart().length
                        const normalizedNewText = accumulatedText.trim()
                        const oldPlainText = stripMarkdown(lastEdit.oldContent)

                        const ranges = getAddedRanges(oldPlainText, normalizedNewText)

                        if (ranges.length === 0) {
                            dispatch(clearLastEdit())
                            return
                        }

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
                                        } catch (e) {
                                            // Ignore splitting errors 
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
                    })
                } finally {
                    dispatch(clearLastEdit())
                    processingRef.current = false
                }
            }, 800)

            return () => {
                clearTimeout(timeoutIdInternal)
                removeUpdateListener()
            }
        }

        return () => removeUpdateListener()
    }, [editor, lastEdit, activeSection, dispatch])

    return null
}
