import { LexicalComposer } from '@lexical/react/LexicalComposer'
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

const editorConfig = {
    namespace: 'MinstrelEditor',
    theme,
    onError(error: Error) {
        console.error('Lexical Error:', error)
    },
    nodes: [
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
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <MarkdownSyncPlugin initialMarkdown={initialContent} onChange={onChange} />
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
