import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { useEffect, useRef } from 'react'
import { $getRoot } from 'lexical'

interface MarkdownSyncPluginProps {
    initialMarkdown: string
    onChange: (markdown: string) => void
}

export function MarkdownSyncPlugin({ initialMarkdown, onChange }: MarkdownSyncPluginProps): null {
    const [editor] = useLexicalComposerContext()
    const lastEmittedRead = useRef<string | null>(null)

    // Handle External Changes (from Redux/Agent)
    useEffect(() => {
        if (lastEmittedRead.current === null || initialMarkdown !== lastEmittedRead.current) {
            lastEmittedRead.current = initialMarkdown
            editor.update(() => {
                const root = $getRoot()
                // Use converter to see if we actually need to update
                // This prevents cursor loss if whitespace is slightly different
                const currentMarkdown = $convertToMarkdownString(TRANSFORMERS)
                if (currentMarkdown !== initialMarkdown) {
                    root.clear()
                    $convertFromMarkdownString(initialMarkdown || '', TRANSFORMERS)
                }
            })
        }
    }, [editor, initialMarkdown])

    const onChangeRef = useRef(onChange)
    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    // Handle Local Changes
    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const markdown = $convertToMarkdownString(TRANSFORMERS)
                if (markdown !== lastEmittedRead.current) {
                    lastEmittedRead.current = markdown
                    onChangeRef.current(markdown)
                }
            })
        })
    }, [editor])

    return null
}
