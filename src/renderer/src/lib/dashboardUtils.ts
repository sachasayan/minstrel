import { Project } from '@/types'

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)']

/**
 * Extracts character names from outline.
 */
function extractCharactersFromOutline(outlineContent: string): { name: string }[] {
  const characters: { name: string }[] = []
  const lines = outlineContent.split('\n')
  let inCharacterSection = false

  const lineIsCharactersHeading = (markdownString: string): boolean => {
    return markdownString.search(/^#+\s+Characters/) != -1
  }
  const lineIsHeading = (markdownString: string): boolean => {
    return markdownString.search(/^#+\s+/) != -1
  }

  for (const line of lines) {
    if (lineIsCharactersHeading(line)) {
      inCharacterSection = true
      continue
    }
    if (inCharacterSection) {
      if (lineIsHeading(line)) {
        break
      }
      // Regex breakdown:
      // - \*\*: Matches bold markdown syntax.
      // - ([\p{L} \'’. \\-]+): Captures character names with Unicode letters, apostrophes, periods, hyphens, and spaces.
      // - \*\*: Matches closing bold markdown.
      // - iu: Flags for case-insensitive and unicode matching.
      const match = line.match(/^[*-]\s+\*\*([\p{L}\s]+)[-:]\*\*/iu)

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
        chapterWordCount: file.content.split(/\s+/).length
      }

      charactersList.forEach((char, index) => {
        const escapedName = char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        chapterData[char.name] = (file.content.match(new RegExp(`\\b${escapedName}\\b`, 'g')) || []).length
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
    latestEntry.wordCount = project.wordCountCurrent
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
