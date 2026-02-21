import { describe, it, expect } from 'vitest'
import { getAddedRanges, stripMarkdown } from './diffUtils'

describe('diffUtils', () => {
  describe('stripMarkdown', () => {
    it('should strip headings', () => {
      expect(stripMarkdown('# Header 1')).toBe('Header 1')
      expect(stripMarkdown('## Header 2')).toBe('Header 2')
    })

    it('should strip bold and italic markers', () => {
      expect(stripMarkdown('**Bold** and *italic*')).toBe('Bold and italic')
      expect(stripMarkdown('__Bold__ and _italic_')).toBe('Bold and italic')
    })

    it('should strip links but keep text', () => {
      expect(stripMarkdown('[Minstrel](https://minstrel.app)')).toBe('Minstrel')
    })

    it('should strip list markers', () => {
      const input = '- Item 1\n* Item 2\n+ Item 3'
      // Normalization adds double newlines between blocks
      expect(stripMarkdown(input)).toBe('Item 1\n\nItem 2\n\nItem 3')
    })

    it('should strip blockquotes', () => {
      expect(stripMarkdown('> This is a quote')).toBe('This is a quote')
    })

    it('should normalize vertical whitespace to double newlines', () => {
      const input = 'Paragraph 1.\n\n\nParagraph 2.\nParagraph 3.'
      const expected = 'Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.'
      expect(stripMarkdown(input)).toBe(expected)
    })

    it('should normalize horizontal whitespace', () => {
      expect(stripMarkdown('Too   many    spaces')).toBe('Too many spaces')
    })
  })

  describe('getAddedRanges', () => {
    it('should identify a single added sentence', () => {
      const oldText = 'The quick brown fox. It jumped over the lazy dog.'
      const newText = 'The quick brown fox. It was very agile. It jumped over the lazy dog.'
      const ranges = getAddedRanges(oldText, newText)
      
      expect(ranges).toHaveLength(1)
      const addedText = newText.substring(ranges[0].start, ranges[0].end)
      // Our segmenter includes trailing whitespace in the segment
      expect(addedText.trim()).toBe('It was very agile.')
    })

    it('should handle leading added sentences', () => {
      const oldText = 'The end.'
      const newText = 'The beginning. The end.'
      const ranges = getAddedRanges(oldText, newText)
      
      expect(ranges).toHaveLength(1)
      expect(newText.substring(ranges[0].start, ranges[0].end).trim()).toBe('The beginning.')
    })

    it('should ignore formatting-only changes (alphanumeric focus)', () => {
      const oldText = 'Sentence with **bold**.'
      const newText = 'Sentence with bold.'
      const ranges = getAddedRanges(oldText, newText)
      expect(ranges).toHaveLength(0)
    })

    it('should handle case changes as equal (alphanumeric focus)', () => {
      const oldText = 'hello world'
      const newText = 'HELLO WORLD'
      const ranges = getAddedRanges(oldText, newText)
      expect(ranges).toHaveLength(0)
    })

    it('should handle moved sentences as new additions', () => {
      const oldText = 'Sentence A. Sentence B.'
      const newText = 'Sentence B. Sentence A.'
      const ranges = getAddedRanges(oldText, newText)
      
      expect(ranges.length).toBeGreaterThan(0)
      const highlight = newText.substring(ranges[0].start, ranges[0].end).trim()
      expect(['Sentence A.', 'Sentence B.']).toContain(highlight)
    })

    it('should handle multiple dispersed additions', () => {
      const oldText = 'Start. End.'
      const newText = 'Start. Middle 1. Middle 2. End. Postscript.'
      const ranges = getAddedRanges(oldText, newText)
      
      // Should find " Middle 1. Middle 2. " and " Postscript."
      expect(ranges).toHaveLength(2)
      expect(newText.substring(ranges[0].start, ranges[0].end).trim()).toBe('Middle 1. Middle 2.')
      expect(newText.substring(ranges[1].start, ranges[1].end).trim()).toBe('Postscript.')
    })

    it('should handle complete rewrite', () => {
      const oldText = 'Ancient history.'
      const newText = 'A brand new story starts here.'
      const ranges = getAddedRanges(oldText, newText)
      
      expect(ranges).toHaveLength(1)
      expect(newText.substring(ranges[0].start, ranges[0].end).trim()).toBe('A brand new story starts here.')
    })
  })
})
