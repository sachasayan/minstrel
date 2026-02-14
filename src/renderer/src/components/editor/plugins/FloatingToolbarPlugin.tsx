import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical'
import { useCallback, useEffect, useRef, useState, JSX } from 'react'
import { createPortal } from 'react-dom'
import { Bold, Italic, Link, Heading1, Heading2, Heading3 } from 'lucide-react'
import { mergeRegister, $getNearestNodeOfType } from '@lexical/utils'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, $isHeadingNode, HeadingTagType } from '@lexical/rich-text'

export function FloatingToolbarPlugin(): JSX.Element | null {
    const [editor] = useLexicalComposerContext()
    const [isBold, setIsBold] = useState(false)
    const [isItalic, setIsItalic] = useState(false)
    const [blockType, setBlockType] = useState('paragraph')
    const [isShowing, setIsShowing] = useState(false)
    const toolbarRef = useRef<HTMLDivElement>(null)

    const updateToolbar = useCallback(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat('bold'))
            setIsItalic(selection.hasFormat('italic'))

            const anchorNode = selection.anchor.getNode()
            const element = anchorNode.getKey() === 'root'
                ? anchorNode
                : anchorNode.getTopLevelElementOrThrow()

            if ($isHeadingNode(element)) {
                setBlockType(element.getTag())
            } else {
                setBlockType('paragraph')
            }

            const nativeSelection = window.getSelection()
            const rootElement = editor.getRootElement()

            if (
                nativeSelection !== null &&
                !nativeSelection.isCollapsed &&
                rootElement !== null &&
                rootElement.contains(nativeSelection.anchorNode)
            ) {
                setIsShowing(true)
            } else {
                setIsShowing(false)
            }
        } else {
            setIsShowing(false)
        }
    }, [editor])

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar()
                })
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateToolbar()
                    return false
                },
                1
            )
        )
    }, [editor, updateToolbar])

    const formatHeading = (tag: HeadingTagType) => {
        if (blockType !== tag) {
            editor.update(() => {
                const selection = $getSelection()
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode(tag))
                }
            })
        }
    }

    return createPortal(
        <div
            ref={toolbarRef}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 p-1 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl transition-all duration-300 pointer-events-auto transform ${isShowing ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
                }`}
        >
            <div className="flex items-center gap-0.5 px-1 border-r border-neutral-200 dark:border-neutral-800 mr-1">
                <button
                    onClick={() => formatHeading('h1')}
                    className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${blockType === 'h1' ? 'text-highlight-600 bg-highlight-50 dark:bg-highlight-900/20' : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                    title="Heading 1"
                >
                    <Heading1 size={18} />
                </button>
                <button
                    onClick={() => formatHeading('h2')}
                    className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${blockType === 'h2' ? 'text-highlight-600 bg-highlight-50 dark:bg-highlight-900/20' : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                    title="Heading 2"
                >
                    <Heading2 size={18} />
                </button>
                <button
                    onClick={() => formatHeading('h3')}
                    className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${blockType === 'h3' ? 'text-highlight-600 bg-highlight-50 dark:bg-highlight-900/20' : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                    title="Heading 3"
                >
                    <Heading3 size={18} />
                </button>
            </div>

            <button
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
                className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${isBold ? 'text-highlight-600 bg-highlight-50 dark:bg-highlight-900/20' : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
                className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${isItalic ? 'text-highlight-600 bg-highlight-50 dark:bg-highlight-900/20' : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                title="Italic"
            >
                <Italic size={18} />
            </button>

            <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />

            <button
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400 disabled:opacity-30"
                title="Add Link (Coming Soon)"
                disabled
            >
                <Link size={18} />
            </button>
        </div>,
        document.body
    )
}
