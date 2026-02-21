import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { TextNode } from 'lexical'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { TRANSFORMERS } from '@lexical/markdown'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import Prism from 'prismjs'
import { MarkNode } from '@lexical/mark'
import { ChapterHeadingNode, $createChapterHeadingNode, $isChapterHeadingNode } from './nodes/ChapterHeadingNode'

// @lexical/code depends on Prism being available globally
if (typeof window !== 'undefined') {
    (window as any).Prism = Prism
}

import { theme } from './EditorTheme'
import { MarkdownSyncPlugin } from './plugins/MarkdownSyncPlugin'
import { ScrollSyncPlugin } from './plugins/ScrollSyncPlugin'
import { FloatingToolbarPlugin } from './plugins/FloatingToolbarPlugin'
import { HighlightPlugin } from './plugins/HighlightPlugin'
import { JSX } from 'react'
import { ElementTransformer } from '@lexical/markdown'

const CHAPTER_HEADING_TRANSFORMER: ElementTransformer = {
    dependencies: [ChapterHeadingNode],
    export: (node) => {
        if (!$isChapterHeadingNode(node)) {
            return null
        }
        const tag = node.getTag()
        const id = node.getChapterId()
        const text = node.getTextContent()

        const level = parseInt(tag.replace('h', ''))
        const prefix = '#'.repeat(level)

        // Only H1 headers are treated as chapters with IDs
        if (tag === 'h1') {
            return `${prefix} ${text}${id ? ` <!-- id: ${id} -->` : ''}`
        }

        return `${prefix} ${text}`
    },
    regExp: /^(#{1,6})\s/,
    replace: (parentNode, children, match) => {
        const level = match[1].length
        const tag = ('h' + level) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

        let id: string | undefined = undefined

        // Try to find and extract ID from children
        if (tag === 'h1' && children.length > 0) {
            const lastChild = children[children.length - 1]
            if (lastChild instanceof TextNode) {
                const text = lastChild.getTextContent()
                const idMatch = text.match(/<!--\s*id:\s*([a-zA-Z0-9-]+)\s*-->/)
                if (idMatch) {
                    id = idMatch[1]
                    const cleanedText = text.replace(/<!--\s*id:\s*([a-zA-Z0-9-]+)\s*-->/, '').trim()
                    if (cleanedText) {
                        lastChild.setTextContent(cleanedText)
                    } else {
                        children.pop()
                    }
                }
            }
        }

        const node = $createChapterHeadingNode(tag, id)
        node.append(...children)
        parentNode.replace(node)
    },
    type: 'element',
}

// Filter out standard heading transformer so it doesn't collide
const FILTERED_TRANSFORMERS = TRANSFORMERS.filter(t =>
    t.type !== 'element' ||
    !/^(#{1,6})\s/.test((t as ElementTransformer).regExp.source)
)

const CUSTOM_TRANSFORMERS = [CHAPTER_HEADING_TRANSFORMER, ...FILTERED_TRANSFORMERS]

const editorConfig = {
    namespace: 'MinstrelEditor',
    theme,
    onError(error: Error) {
        console.error('Lexical Error:', error)
    },
    nodes: [
        ChapterHeadingNode,
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        MarkNode
    ]
}

interface LexicalEditorProps {
    initialContent: string
    onChange: (markdown: string) => void
    activeSection: string | null
    onSectionChange: (section: string) => void
    containerRef: React.RefObject<HTMLDivElement | null>
    editable?: boolean
}

export function LexicalEditor({
    initialContent,
    onChange,
    activeSection,
    onSectionChange,
    containerRef,
    editable = true
}: LexicalEditorProps): JSX.Element {
    const config = {
        ...editorConfig,
        editable
    }

    return (
        <LexicalComposer initialConfig={config}>
            <div className="editor-container relative">
                <EditablePlugin editable={editable} />
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable className="outline-none py-4 min-h-[500px]" />
                    }
                    placeholder={
                        <div className="absolute top-4 left-0 pointer-events-none opacity-40 italic">
                            Start writing your story...
                        </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <MarkdownShortcutPlugin transformers={CUSTOM_TRANSFORMERS} />
                <MarkdownSyncPlugin initialMarkdown={initialContent} onChange={onChange} transformers={CUSTOM_TRANSFORMERS} />
                <ScrollSyncPlugin
                    activeSection={activeSection}
                    onSectionChange={onSectionChange}
                    containerRef={containerRef}
                />
                <HighlightPlugin activeSection={activeSection} />
                <FloatingToolbarPlugin />
            </div>
        </LexicalComposer>
    )
}

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

function EditablePlugin({ editable }: { editable: boolean }) {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
        editor.setEditable(editable)
    }, [editor, editable])

    return null
}
