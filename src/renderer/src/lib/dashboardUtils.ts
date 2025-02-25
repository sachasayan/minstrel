import { Project } from '@/types'
import { Star } from 'lucide-react'
import { Line } from 'recharts'

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)']

/**
 * Extracts character names from outline.
 */
function extractCharactersFromOutline(outlineContent: string): { name: string }[] {
  const characters: { name: string }[] = []
  const lines = outlineContent.split('\n')
  let inCharacterSection = false

  for (const line of lines) {
    if (line.startsWith('## Characters')) {
      inCharacterSection = true
      continue
    }

    if (inCharacterSection) {
      if (line.startsWith('#') && !line.startsWith('###')) {
        break
      }
      // Regex breakdown:
      // - \*\*: Matches bold markdown syntax.
      // - ([\p{L} \'’. \\-]+): Captures character names with Unicode letters, apostrophes, periods, hyphens, and spaces.
      // - \*\*: Matches closing bold markdown.
      // - iu: Flags for case-insensitive and unicode matching.
      const match = line.match(/\*\*([\p{L} \'’. \\-]+).*\*\*/iu)
      if (match) {
        characters.push({ name: match[1].trim() })
      }
    }
  }
  return characters
}

/**
 * Character mention frequency per chapter.
 */
function getCharacterFrequencyData(activeProject: Project): any[] {
  const charactersList = extractCharactersFromOutline(activeProject.files.find((f) => f.title.indexOf('Outline') != -1)?.content || '')

  return activeProject.files
    .filter((file) => file.title.indexOf('Chapter') != -1)
    .map((file, i) => {
      const chapterData: { [key: string]: number | string } = {
        chapter: i + 1,
        wordCount: file.content.split(/\s+/).length
      }

      charactersList.forEach((char, index) => {
        const escapedName = char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        chapterData[char.name] = (file.content.match(new RegExp(`\\b${escapedName}\\b`, 'g')) || []).length
        chapterData[`${char.name}_color`] = colors[index % colors.length]
      })
      return chapterData
    })
}


export { extractCharactersFromOutline, getCharacterFrequencyData, colors }
