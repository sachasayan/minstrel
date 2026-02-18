import { diffWordsWithSpace } from 'diff'

export interface HighlightRange {
  start: number
  end: number
}

/**
 * Strips basic markdown syntax to approximate the plain text 
 * returned by Lexical's root.getTextContent().
 * Lexical usually keeps the structure but removes the markers.
 */
export function stripMarkdown(md: string): string {
  if (!md) return ''
  return md
    .replace(/^#+\s+/gm, '') // Headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **
    .replace(/\*(.*?)\*/g, '$1') // Italic *
    .replace(/__(.*?)__/g, '$1') // Bold __
    .replace(/_(.*?)_/g, '$1') // Italic _
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links [text](url)
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Code blocks and inline code
    .replace(/^[\s*-+>]+\s+/gm, '') // List markers and blockquotes
    // Lexical's getTextContent often uses \n\n between blocks.
    // We'll normalize all vertical whitespace to \n\n to stay consistent
    .replace(/\n\s*\n/g, '\n\n') 
    .replace(/[ \t]+/g, ' ') // Normalize horizontal whitespace
    .trim()
}

/**
 * Calculates the character ranges that were added between oldText and newText.
 * Uses word-based diffing for much better stability against minor formatting mismatches.
 */
export function getAddedRanges(oldText: string, newText: string): HighlightRange[] {
  // Normalize both strings similarly before diffing
  // Note: we can't normalize newText fully because offsets must match Lexical nodes.
  // But we can normalize the oldText to match what we expect.
  
  const changes = diffWordsWithSpace(oldText, newText)
  const ranges: HighlightRange[] = []
  let currentIndex = 0

  for (const change of changes) {
    const value = change.value || ''
    if (change.added) {
      ranges.push({
        start: currentIndex,
        end: currentIndex + value.length
      })
      currentIndex += value.length
    } else if (!change.removed) {
      currentIndex += value.length
    }
  }

  return ranges
}
