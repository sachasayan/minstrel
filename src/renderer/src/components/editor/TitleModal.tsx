import { JSX, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { suggestTitles } from '@/lib/assistants/titleSuggestion'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { ProjectFile } from '@/types'

interface TitleModalProps {
  initialTitle: string
  isOpen: boolean
  projectFiles: ProjectFile[]
  onClose: () => void
  onSave: (title: string) => void
}

const stripEmoji = (value: string): string => value.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u, '').trim()

export function TitleModal({ initialTitle, isOpen, projectFiles, onClose, onSave }: TitleModalProps): JSX.Element | null {
  const settings = useSelector(selectSettingsState)
  const inputRef = useRef<HTMLInputElement>(null)
  const [editingTitle, setEditingTitle] = useState(initialTitle)
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([])
  const [isSuggestingTitles, setIsSuggestingTitles] = useState(false)

  const skeletonPatterns = useMemo(
    () => [
      ['w-2/3'],
      ['w-2/5', 'w-1/3'],
      ['w-4/5'],
      ['w-1/2', 'w-1/4'],
      ['w-1/3', 'w-2/5', 'w-1/6'],
      ['w-3/5'],
      ['w-1/4', 'w-2/4'],
      ['w-5/6'],
      ['w-1/3', 'w-1/3'],
      ['w-3/4'],
      ['w-2/5', 'w-1/5', 'w-1/4'],
      ['w-1/2']
    ],
    []
  )

  useEffect(() => {
    if (!isOpen) {
      setSuggestedTitles([])
      setIsSuggestingTitles(false)
      return
    }

    setEditingTitle(initialTitle)
    setSuggestedTitles([])

    const focusTimeout = window.setTimeout(() => inputRef.current?.focus(), 50)
    const outlineFile = projectFiles.find((file) => file.title.toLowerCase().includes('outline'))

    if (!outlineFile?.content) {
      return () => window.clearTimeout(focusTimeout)
    }

    let isCancelled = false
    setIsSuggestingTitles(true)

    suggestTitles(settings, outlineFile.content)
      .then((titles) => {
        if (!isCancelled) {
          setSuggestedTitles(titles)
        }
      })
      .catch((error) => {
        console.error('[TitleModal] suggestTitles threw:', error)
      })
      .finally(() => {
        if (!isCancelled) {
          setIsSuggestingTitles(false)
        }
      })

    return () => {
      isCancelled = true
      window.clearTimeout(focusTimeout)
    }
  }, [initialTitle, isOpen, projectFiles, settings])

  if (!isOpen) {
    return null
  }

  const handleSave = (): void => {
    const trimmed = editingTitle.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      handleSave()
    }

    if (event.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl px-8 py-6 w-full max-w-lg flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Rename story</h2>
        <input
          ref={inputRef}
          type="text"
          value={editingTitle}
          onChange={(event) => setEditingTitle(event.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-highlight-500"
          placeholder="Story title"
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            {isSuggestingTitles && <span className="inline-block size-2 rounded-full bg-highlight-500 animate-pulse" />}
            Suggested titles
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 12 }).map((_, index) => {
              const suggestion = suggestedTitles[index]
              return suggestion ? (
                <button
                  key={suggestion}
                  onClick={() => setEditingTitle(stripEmoji(suggestion))}
                  title={stripEmoji(suggestion)}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="h-8 animate-in fade-in zoom-in-95 duration-300 text-xs text-left px-2.5 rounded-md border border-border bg-background hover:bg-muted hover:border-highlight-500/40 transition-colors truncate flex items-center"
                >
                  {suggestion}
                </button>
              ) : (
                <div key={index} className="h-8 px-2.5 rounded-md border border-border bg-background flex items-center gap-1.5">
                  {skeletonPatterns[index].map((width, skeletonIndex) => (
                    <span key={skeletonIndex} style={{ animationDelay: `${skeletonIndex * 120}ms` }} className={`h-2 rounded-full bg-muted animate-pulse ${width}`} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-sm font-medium text-highlight-700 transition-colors hover:bg-highlight-500/10 hover:text-highlight-600 dark:text-highlight-300 dark:hover:text-highlight-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
