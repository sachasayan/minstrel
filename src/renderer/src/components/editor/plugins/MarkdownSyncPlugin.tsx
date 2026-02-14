import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { useEffect, useRef } from 'react'
import { $getRoot, $insertNodes } from 'lexical'

interface MarkdownSyncPluginProps {
    initialMarkdown: string
    onChange: (markdown: string) => void
}

export function MarkdownSyncPlugin({ initialMarkdown, onChange }: MarkdownSyncPluginProps): null {
    const [editor] = useLexicalComposerContext()
    const isFirstRender = useRef(true)

    // Handle Initial Load
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            editor.update(() => {
                const root = $getRoot()
                root.clear()
                $convertFromMarkdownString(initialMarkdown || '', TRANSFORMERS)
            })
        }
    }, [editor, initialMarkdown])

    // Handle Changes
    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const markdown = $convertToMarkdownString(TRANSFORMERS)
                onChange(markdown)
            })
        })
    }, [editor, onChange])

    return null
}
