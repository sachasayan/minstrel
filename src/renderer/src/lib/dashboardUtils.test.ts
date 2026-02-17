import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  extractCharactersFromOutline,
  getCharacterFrequencyData,
  updateRollingWordCountHistory
} from './dashboardUtils'

describe('dashboardUtils', () => {
  describe('extractCharactersFromOutline', () => {
    it('should extract bolded names from Characters section', () => {
      const outline = `
# Outline
Some plot.

# Characters
* **Aria**: A pilot.
* **Kael** - A rogue.
* Just a normal list item without bold name.

# Setting
Space.
      `
      const characters = extractCharactersFromOutline(outline)
      expect(characters).toEqual([
        { name: 'Aria' },
        { name: 'Kael' }
      ])
    })

    it('should handle different list markers and spacing', () => {
      const outline = `
# Characters
- **Protagonist** : Description
1. **Antagonist**- Description
      `
      const characters = extractCharactersFromOutline(outline)
      expect(characters).toEqual([
        { name: 'Protagonist' },
        { name: 'Antagonist' }
      ])
    })

    it('should stop extracting after the next heading', () => {
      const outline = `
# Characters
* **Aria**
# Plot
* **NotACharacter**
      `
      const characters = extractCharactersFromOutline(outline)
      expect(characters).toHaveLength(1)
      expect(characters[0].name).toBe('Aria')
    })

    it('should return empty list if no Characters section', () => {
      const outline = '# Outline\nNo characters here.'
      expect(extractCharactersFromOutline(outline)).toEqual([])
    })
  })

  describe('getCharacterFrequencyData', () => {
    it('should count character mentions per chapter', () => {
      const project: any = {
        files: [
          { title: 'Project Outline', content: '# Characters\n* **Aria**: Pilot' }
        ],
        storyContent: '# Chapter 1\nAria went to the ship. Aria saw someone.\n# Chapter 2\nSomeone saw Aria. Aria waved.'
      }

      const data = getCharacterFrequencyData(project)
      expect(data).toHaveLength(2)
      expect(data[0].chapter).toBe(1)
      expect(data[0].Aria).toBe(2)
      expect(data[0].chapterWordCount).toBeGreaterThan(0)
      
      expect(data[1].chapter).toBe(2)
      expect(data[1].Aria).toBe(2)
    })

    it('should use word boundaries for matching', () => {
      const project: any = {
        files: [
          { title: 'Outline', content: '# Characters\n* **Ari**: Pilot' }
        ],
        storyContent: '# Chapter 1\nAri and Aria went out.'
      }
      const data = getCharacterFrequencyData(project)
      expect(data[0].Ari).toBe(1) // Should NOT match Ari inside Aria
    })
  })

  describe('updateRollingWordCountHistory', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2023-01-05'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should update today\'s entry if it exists', () => {
      const project: any = {
        wordCountCurrent: 2000,
        wordCountHistorical: [
          { date: '2023-01-05', wordCount: 1500 }
        ]
      }
      const history = updateRollingWordCountHistory(project)
      expect(history).toHaveLength(1)
      expect(history[0].wordCount).toBe(2000)
    })

    it('should fill gaps between last entry and today', () => {
      const project: any = {
        wordCountCurrent: 2000,
        wordCountHistorical: [
          { date: '2023-01-02', wordCount: 1000 }
        ]
      }
      const history = updateRollingWordCountHistory(project)
      // Jan 2 (1000), Jan 3 (1000), Jan 4 (1000), Jan 5 (2000)
      expect(history).toHaveLength(4)
      expect(history[0].date).toBe('2023-01-02')
      expect(history[1].date).toBe('2023-01-03')
      expect(history[1].wordCount).toBe(1000)
      expect(history[3].date).toBe('2023-01-05')
      expect(history[3].wordCount).toBe(2000)
    })

    it('should create initial entry if historical is empty', () => {
      const project: any = {
        wordCountCurrent: 500,
        wordCountHistorical: []
      }
      const history = updateRollingWordCountHistory(project)
      expect(history).toHaveLength(1)
      expect(history[0].date).toBe('2023-01-05')
      expect(history[0].wordCount).toBe(500)
    })

    it('should maintain only 30 days', () => {
      // Create 35 older entries
      const oldHistory = Array.from({ length: 35 }, (_, i) => ({
        date: `2022-11-${String(i + 1).padStart(2, '0')}`,
        wordCount: 100
      }))
      const project: any = {
        wordCountCurrent: 500,
        wordCountHistorical: oldHistory
      }
      const history = updateRollingWordCountHistory(project)
      expect(history).toHaveLength(30)
    })
  })
})
