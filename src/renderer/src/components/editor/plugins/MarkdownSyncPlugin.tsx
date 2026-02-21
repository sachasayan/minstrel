import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { useEffect, useRef } from 'react'
import { $getRoot } from 'lexical'

interface MarkdownSyncPluginProps {
    initialMarkdown: string
    onChange: (markdown: string) => void
    transformers?: typeof TRANSFORMERS
}

export function MarkdownSyncPlugin({ initialMarkdown, onChange, transformers = TRANSFORMERS }: MarkdownSyncPluginProps): null {
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
                const currentMarkdown = $convertToMarkdownString(transformers)

                if (currentMarkdown !== initialMarkdown) {
                    root.clear()
                    $convertFromMarkdownString(initialMarkdown || '', transformers)
                }
            })
        }
    }, [editor, initialMarkdown, transformers])

    const onChangeRef = useRef(onChange)
    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    // Handle Local Changes
    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const markdown = $convertToMarkdownString(transformers)

                if (markdown !== lastEmittedRead.current) {
                    lastEmittedRead.current = markdown
                    onChangeRef.current(markdown)
                }
            })
        })
    }, [editor, transformers])

    return null
}
