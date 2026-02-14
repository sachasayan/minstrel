import { Project } from '@/types'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { getChapterWordCounts } from '@/lib/storyContent'

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)']

/**
 * Extracts character names from outline.
 */
function extractCharactersFromOutline(outlineContent: string): { name: string }[] {
  const characters: { name: string }[] = []
  let inCharacterSection = false
  const tree = remark().parse(outlineContent)

  visit(tree, (node) => {
    // Handle Headings to define the section
    if (node.type === 'heading') {
      const headingText = toString(node).trim()
      if (headingText.toLowerCase() === 'characters') {
        inCharacterSection = true
      } else if (inCharacterSection) {
        // Found a subsequent heading, stop processing lists
        inCharacterSection = false
      }
    }

    // Handle Lists within the character section
    if (inCharacterSection && node.type === 'list') {
      visit(node, 'listItem', (listItemNode) => {
        // Find the bolded name within the list item
        // We only visit the direct children to avoid deeply nested strong tags if any
        visit(listItemNode, 'strong', (strongNode, index, parent) => {
          // Only process the first strong tag found directly under the listItem's paragraph
          // Assumes format like '* **Name**: description' or '- **Name** - description'
          if (parent?.type === 'paragraph') {
            // Extract text, trim whitespace, and remove trailing colons/hyphens/spaces
            const rawName = toString(strongNode).trim()
            const name = rawName.replace(/[-\s:]+$/, '').trim()
            if (name) {
              characters.push({ name })
              // Stop visiting further strong tags within this listItem
              return 'skip'
            }
          }
          return undefined // Continue visiting other nodes
        })
      })
      // After processing a list within the character section,
      // we might want to stop if the structure guarantees only one list.
      // However, allowing multiple lists might be more flexible.
      // For now, we continue visiting other nodes after the list.
    }
  })

  return characters
}

/**
 * Character mention frequency per chapter.
 */
function getCharacterFrequencyData(activeProject: Project): any[] {
  const charactersList = extractCharactersFromOutline(activeProject.files.find((f) => f.title.indexOf('Outline') != -1)?.content || '')

  return getChapterWordCounts(activeProject.storyContent || '')
    .map((chapter, i) => {
      const chapterData: { [key: string]: number | string } = {
        chapter: i + 1,
        chapterWordCount: chapter.wordCount
      }

      charactersList.forEach((char, index) => {
        const escapedName = char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        chapterData[char.name] = (chapter.content.match(new RegExp(`\\b${escapedName}\\b`, 'g')) || []).length
        chapterData[`${char.name}_color`] = colors[index % colors.length]
      })
      return chapterData
    })
}

/**
 * Updates project's rolling 30-day wordCountHistorical array.
 */
function updateRollingWordCountHistory(project: Project) {
  const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
  const history = Array.isArray(project.wordCountHistorical) ? [...project.wordCountHistorical] : []

  history.sort((a, b) => a.date.localeCompare(b.date))

  const latestEntry = history[history.length - 1]

  if (latestEntry && latestEntry.date === today) {
    // Already has today's entry, update word count
    const updatedEntry = { ...latestEntry, wordCount: project.wordCountCurrent }
    history[history.length - 1] = updatedEntry
  } else {
    const lastCount = latestEntry ? latestEntry.wordCount : project.wordCountCurrent
    const lastDateStr = latestEntry ? latestEntry.date : null
    const fillStartDate = lastDateStr ? new Date(lastDateStr) : new Date(today)

    // Advance fillStartDate by 1 day if exists, else use today
    if (latestEntry) {
      fillStartDate.setDate(fillStartDate.getDate() + 1)
    }

    const fillDates: { date: string; wordCount: number }[] = []
    const todayDate = new Date(today)

    while (fillStartDate <= todayDate) {
      fillDates.push({
        date: fillStartDate.toISOString().slice(0, 10),
        wordCount: fillStartDate.getTime() === todayDate.getTime() ? project.wordCountCurrent : lastCount
      })
      fillStartDate.setDate(fillStartDate.getDate() + 1)
    }

    history.push(...fillDates)
  }

  // Only keep last 30 days
  if (history.length > 30) {
    history.splice(0, history.length - 30)
  }

  return history
}

export { extractCharactersFromOutline, getCharacterFrequencyData, colors, updateRollingWordCountHistory }
