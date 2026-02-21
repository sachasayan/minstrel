import { diffMain, DIFF_INSERT, DIFF_EQUAL } from 'diff-match-patch-es'

export interface HighlightRange {
  start: number
  end: number
}

/**
 * Strips basic markdown syntax and normalizes whitespace to match Lexical's behavior.
 * Lexical usually has two newlines between blocks.
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
    .replace(/^[ \t]*[*+-][ \t]+/gm, '') // List markers
    .replace(/^[ \t]*>[ \t]+/gm, '') // Blockquotes
    // Horizontal normalization
    .replace(/[ \t]+/g, ' ')
    .trim()
    // Vertical normalization: exactly one blank line between non-empty lines
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n')
}

/**
 * Splits text into segments (sentences or paragraphs) for diffing.
 * Includes trailing whitespace to preserve character offsets consistently.
 */
function getSegments(text: string): string[] {
  if (!text) return []
  // Matches content ending in punctuation or end of string, followed by optional trailing whitespace.
  const regex = /[^.!?]*[.!?]+\s*|[^.!?]+\s*/g
  return text.match(regex) || []
}

/**
 * Calculates the character ranges that were added between oldText and newText.
 * Uses sentence-level diffing for stable contextual highlights.
 */
export function getAddedRanges(oldText: string, newText: string): HighlightRange[] {
  if (!oldText) {
    if (!newText) return []
    return [{ start: 0, end: newText.length }]
  }

  // 1. Prepare segments
  const oldSegments = getSegments(oldText)
  const newSegments = getSegments(newText)

  // 2. Map segments to characters for DMP
  const segmentToChar = new Map<string, string>()
  const charToSegment = new Map<string, string>()
  let nextChar = 0x2400 // Start in a safe Unicode range

  function tokenize(segments: string[]): string {
    return segments.map(seg => {
      // Normalize segment for comparison (alphanumeric only)
      const normalized = seg.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!segmentToChar.has(normalized)) {
        const char = String.fromCharCode(nextChar++)
        segmentToChar.set(normalized, char)
        charToSegment.set(char, seg)
      }
      return segmentToChar.get(normalized)
    }).join('')
  }

  const oldTokenized = tokenize(oldSegments)
  const newTokenized = tokenize(newSegments)

  // 3. Perform diff
  // We skip diffCleanupSemantic here because we want to preserve 
  // our specific sentence boundaries exactly as tokenized.
  const diffs = diffMain(oldTokenized, newTokenized)

  // 4. Map back to character ranges in newText
  const ranges: HighlightRange[] = []
  let currentIndex = 0
  let tokenIndex = 0

  for (const [type, text] of diffs) {
    if (type === DIFF_INSERT) {
      const start = currentIndex
      for (let i = 0; i < text.length; i++) {
        const segment = newSegments[tokenIndex + i]
        if (segment) {
          currentIndex += segment.length
        }
      }
      if (currentIndex > start) {
        ranges.push({ start, end: currentIndex })
      }
      tokenIndex += text.length
    } else if (type === DIFF_EQUAL) {
      for (let i = 0; i < text.length; i++) {
        const segment = newSegments[tokenIndex + i]
        if (segment) {
          currentIndex += segment.length
        }
      }
      tokenIndex += text.length
    } else {
      // Deletions in oldText don't advance the current index in newText
    }
  }

  return ranges
}
