import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectProjects, clearLastEdit } from '@/lib/store/projectsSlice'
import { getAddedRanges, stripMarkdown } from '@/lib/utils/diffUtils'
import { $getRoot, $isElementNode, TextNode } from 'lexical'
import { $createMarkNode, MarkNode } from '@lexical/mark'

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

        const isMatch = activeSection?.includes(lastEdit.fileTitle) || activeSection === lastEdit.fileTitle

        if (isMatch) {
            processingRef.current = true

            // Wait to ensure MarkdownSyncPlugin has fully finished tree construction
            const timeoutId = setTimeout(() => {
                editor.update(() => {
                    const root = $getRoot()
                    const sectionTitle = activeSection?.split('|||')[0] || activeSection || ''
                    const isMonolithic = activeSection?.includes('|||')

                    let targetTextNodes: Array<{ node: TextNode, offset: number }> = []
                    let accumulatedText = ''

                    const rootChildren = root.getChildren()
                    let inSection = !isMonolithic

                    for (const child of rootChildren) {
                        const childText = child.getTextContent()
                        const isHeading = child.getType() === 'heading'

                        if (isMonolithic && isHeading) {
                            if (childText.trim() === sectionTitle) {
                                inSection = true
                            } else if (inSection) {
                                break // Next section reached
                            }
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
                            // Add newlines between blocks to match stripMarkdown's \n\n
                            accumulatedText += '\n\n'
                        }
                    }

                    if (targetTextNodes.length === 0) {
                        processingRef.current = false
                        return
                    }

                    const normalizedNewText = accumulatedText.trim()
                    const oldPlainText = stripMarkdown(lastEdit.oldContent)

                    const ranges = getAddedRanges(oldPlainText, normalizedNewText)

                    if (ranges.length === 0) {
                        dispatch(clearLastEdit())
                        processingRef.current = false
                        return
                    }

                    const nodesToWrap: TextNode[] = []
                    for (const range of ranges) {
                        const { start: rangeStart, end: rangeEnd } = range
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
                                        // Ignore splitting errors on already modified nodes
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

                            const markNode = $createMarkNode('agent-edit')
                            node.replace(markNode)
                            markNode.append(node)
                        }
                    }
                })

                dispatch(clearLastEdit())
                processingRef.current = false
            }, 300)

            return () => clearTimeout(timeoutId)
        }
    }, [editor, lastEdit, activeSection, dispatch])

    return null
}
