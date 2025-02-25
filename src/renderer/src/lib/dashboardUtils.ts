import { Project } from '@/types'
import { Star } from 'lucide-react'
import { Line } from 'recharts'

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)']

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
      // Stop parsing when we reach another heading of the same or higher level
      if (line.startsWith('#') && !line.startsWith('###')) {
        break
      }
      const match = line.match(/\*\*([A-z -]+).*\*\*/i) // Capture the character name, should be in bold
      if (match) {
        characters.push({ name: match[1].trim() })
      }
    }
  }
  return characters
}

function getCharacterFrequencyData(activeProject: Project): any[] {
  const characters = extractCharactersFromOutline(activeProject.files.find((f) => f.title.indexOf('Outline') != -1)?.content || '')

  return activeProject.files
    .filter((file) => file.title.indexOf('Chapter') != -1)
    .map((file, i) => {
      const chapterData: { [key: string]: number | string } = {
        chapter: i + 1,
        wordCount: file.content.split(/\s+/).length
      }

      characters.forEach((char, index) => {
        const escapedName = char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        chapterData[char.name] = (file.content.match(new RegExp(`\\b${escapedName}\\b`, 'g')) || []).length
        chapterData[`${char.name}_color`] = colors[index % colors.length] // Store color
      })
      return chapterData
    })
}


export { extractCharactersFromOutline, getCharacterFrequencyData, colors }
