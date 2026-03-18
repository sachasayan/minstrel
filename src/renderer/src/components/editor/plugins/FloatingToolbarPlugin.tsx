import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical'
import { useCallback, useEffect, useRef, useState, JSX } from 'react'
import { createPortal } from 'react-dom'
import { Bold, Italic, Link, Heading1, Heading2, Heading3 } from 'lucide-react'
import { mergeRegister } from '@lexical/utils'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, $isHeadingNode, HeadingTagType } from '@lexical/rich-text'

export function FloatingToolbarPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [blockType, setBlockType] = useState('paragraph')
  const [isEditorFocused, setIsEditorFocused] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))

      const anchorNode = selection.anchor.getNode()
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow()

      if ($isHeadingNode(element)) {
        setBlockType(element.getTag())
      } else {
        setBlockType('paragraph')
      }
    } else {
      setIsBold(false)
      setIsItalic(false)
      setBlockType('paragraph')
    }
  }, [])

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

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (rootElement === null) {
      return
    }

    const handleFocusIn = () => {
      setIsEditorFocused(true)
    }

    const handleFocusOut = () => {
      requestAnimationFrame(() => {
        const activeElement = document.activeElement
        setIsEditorFocused(activeElement !== null && rootElement.contains(activeElement))
      })
    }

    rootElement.addEventListener('focusin', handleFocusIn)
    rootElement.addEventListener('focusout', handleFocusOut)

    return () => {
      rootElement.removeEventListener('focusin', handleFocusIn)
      rootElement.removeEventListener('focusout', handleFocusOut)
    }
  }, [editor])

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
      className={`fixed top-8 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border bg-background/90 p-1 text-foreground shadow-2xl backdrop-blur-xl transition-all duration-300 pointer-events-auto transform ${
        isEditorFocused ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-4 scale-95 opacity-0'
      }`}
    >
      <div className="mr-1 flex items-center gap-0.5 border-r border-border px-1">
        <button
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => formatHeading('h1')}
          className={`rounded-lg p-2 transition-colors hover:bg-muted ${
            blockType === 'h1' ? 'bg-highlight-50 text-highlight-600 dark:bg-highlight-900/20 dark:text-highlight-300' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => formatHeading('h2')}
          className={`rounded-lg p-2 transition-colors hover:bg-muted ${
            blockType === 'h2' ? 'bg-highlight-50 text-highlight-600 dark:bg-highlight-900/20 dark:text-highlight-300' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>
        <button
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => formatHeading('h3')}
          className={`rounded-lg p-2 transition-colors hover:bg-muted ${
            blockType === 'h3' ? 'bg-highlight-50 text-highlight-600 dark:bg-highlight-900/20 dark:text-highlight-300' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </button>
      </div>

      <button
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={`rounded-lg p-2 transition-colors hover:bg-muted ${
          isBold ? 'bg-highlight-50 text-highlight-600 dark:bg-highlight-900/20 dark:text-highlight-300' : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className={`rounded-lg p-2 transition-colors hover:bg-muted ${
          isItalic ? 'bg-highlight-50 text-highlight-600 dark:bg-highlight-900/20 dark:text-highlight-300' : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Italic"
      >
        <Italic size={18} />
      </button>

      <div className="mx-1 h-6 w-px bg-border" />

      <button
        onMouseDown={(event) => event.preventDefault()}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
        title="Add Link (Coming Soon)"
        disabled
      >
        <Link size={18} />
      </button>
    </div>,
    document.body
  )
}
