import { describe, it, expect } from 'vitest'
import {
  getChaptersFromStoryContent,
  calculateWordCount,
  getChapterWordCounts,
  extractChapterContent,
  replaceChapterContent,
  isStoryFile,
  normalizeProjectStoryContent,
  STORY_FILE_TYPE,
  STORY_FILE_TITLE
} from './storyContent'
import { Project } from '@/types'

describe('getChaptersFromStoryContent', () => {
  it('should return an empty array for empty content', () => {
    expect(getChaptersFromStoryContent('')).toEqual([])
  })

  it('should return an empty array if no chapters are found', () => {
    const content = 'This is a story without chapters.'
    expect(getChaptersFromStoryContent(content)).toEqual([])
  })

  it('should identify a single chapter', () => {
    const content = '# Chapter 1\nContent of chapter 1'
    expect(getChaptersFromStoryContent(content)).toEqual([{ title: 'Chapter 1', index: 0 }])
  })

  it('should identify multiple chapters', () => {
    const content = '# Chapter 1\nContent 1\n# Chapter 2\nContent 2'
    expect(getChaptersFromStoryContent(content)).toEqual([
      { title: 'Chapter 1', index: 0 },
      { title: 'Chapter 2', index: 2 }
    ])
  })

  it('should handle leading/trailing whitespace in chapter titles', () => {
    const content = '  # Chapter 1  \nContent'
    expect(getChaptersFromStoryContent(content)).toEqual([{ title: 'Chapter 1', index: 0 }])
  })

  it('should handle multiple spaces after #', () => {
    const content = '#    Chapter 1\nContent'
    expect(getChaptersFromStoryContent(content)).toEqual([{ title: 'Chapter 1', index: 0 }])
  })

  it('should handle special characters in titles', () => {
    const content = '# Chapter 1: The Beginning (Part !@#$)\nContent'
    expect(getChaptersFromStoryContent(content)).toEqual([
      { title: 'Chapter 1: The Beginning (Part !@#$)', index: 0 }
    ])
  })

  it('should ignore lines that look like chapters but are not (e.g., no space after #)', () => {
    const content = '#Chapter 1\n#  \n#'
    expect(getChaptersFromStoryContent(content)).toEqual([])
  })

  it('should ignore sub-headers (e.g., ## Chapter)', () => {
    const content = '## Chapter 1'
    expect(getChaptersFromStoryContent(content)).toEqual([])
  })

  it('should handle different line endings', () => {
    const content = '# Chapter 1\r\nContent\r\n# Chapter 2'
    expect(getChaptersFromStoryContent(content)).toEqual([
      { title: 'Chapter 1', index: 0 },
      { title: 'Chapter 2', index: 2 }
    ])
  })

  it('should handle null or undefined input', () => {
    // @ts-ignore
    expect(getChaptersFromStoryContent(null)).toEqual([])
    // @ts-ignore
    expect(getChaptersFromStoryContent(undefined)).toEqual([])
  })
})

describe('calculateWordCount', () => {
  it('should return 0 for an empty string', () => {
    expect(calculateWordCount('')).toBe(0)
  })

  it('should return 0 for a null or undefined-like input (empty string handle)', () => {
    // @ts-ignore: testing edge case
    expect(calculateWordCount(null)).toBe(0)
    // @ts-ignore: testing edge case
    expect(calculateWordCount(undefined)).toBe(0)
  })

  it('should return 0 for a string with only whitespace', () => {
    expect(calculateWordCount('   ')).toBe(0)
    expect(calculateWordCount('\n\t  \n')).toBe(0)
  })

  it('should return 1 for a single word', () => {
    expect(calculateWordCount('hello')).toBe(1)
  })

  it('should return the correct count for multiple words', () => {
    expect(calculateWordCount('hello world')).toBe(2)
    expect(calculateWordCount('this is a test')).toBe(4)
  })

  it('should handle multiple spaces between words', () => {
    expect(calculateWordCount('hello    world')).toBe(2)
    expect(calculateWordCount('  multiple    spaces  here  ')).toBe(3)
  })

  it('should handle newlines and tabs between words', () => {
    expect(calculateWordCount('hello\nworld')).toBe(2)
    expect(calculateWordCount('hello\tworld')).toBe(2)
    expect(calculateWordCount('word1\nword2\tword3  word4')).toBe(4)
  })

  it('should handle leading and trailing whitespace', () => {
    expect(calculateWordCount('  hello world  ')).toBe(2)
    expect(calculateWordCount('\nhello\n')).toBe(1)
  })

  it('should count words with punctuation attached', () => {
    expect(calculateWordCount('Hello, world!')).toBe(2)
    expect(calculateWordCount('Wait... what?')).toBe(2)
  })

  it('should count numbers as words', () => {
    expect(calculateWordCount('The year is 2024.')).toBe(4)
    expect(calculateWordCount('1 2 3 4 5')).toBe(5)
  })

  it('should handle markdown-like content', () => {
    expect(calculateWordCount('# Chapter 1\n\nThis is the first paragraph.')).toBe(8)
  })

  it('should handle hyphenated words as single words (default split behavior)', () => {
    expect(calculateWordCount('well-known')).toBe(1)
  })
})

describe('getChapterWordCounts', () => {
  it('should return empty array if no chapters', () => {
    expect(getChapterWordCounts('Just some text')).toEqual([])
  })

  it('should calculate word counts for each chapter', () => {
    const content = '# Chapter 1\nWord word\n# Chapter 2\nWord word word'
    const results = getChapterWordCounts(content)
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({
      title: 'Chapter 1',
      content: 'Word word',
      wordCount: 2
    })
    expect(results[1]).toEqual({
      title: 'Chapter 2',
      content: 'Word word word',
      wordCount: 3
    })
  })

  it('should include content between chapters', () => {
    const content = '# C1\nLine 1\nLine 2\n# C2\nLine 3'
    const results = getChapterWordCounts(content)
    expect(results[0].content).toBe('Line 1\nLine 2')
    expect(results[1].content).toBe('Line 3')
  })
})

describe('extractChapterContent', () => {
  const content = '# Chapter 1\nContent 1\n# Chapter 2\nContent 2\nMore content 2'

  it('should extract content for a given chapter', () => {
    expect(extractChapterContent(content, 'Chapter 1')).toBe('Content 1')
    expect(extractChapterContent(content, 'Chapter 2')).toBe('Content 2\nMore content 2')
  })

  it('should return null if chapter not found', () => {
    expect(extractChapterContent(content, 'Chapter 3')).toBeNull()
  })

  it('should be case-insensitive and handle fuzzy matches', () => {
    expect(extractChapterContent(content, 'chapter 1')).toBe('Content 1')

    const contentWithColon = '# Chapter 1: Introduction\nContent 1'
    expect(extractChapterContent(contentWithColon, 'Chapter 1')).toBe('Content 1')
  })
})

describe('replaceChapterContent', () => {
  const content = '# C1\nOld 1\n# C2\nOld 2'

  it('should replace existing chapter content', () => {
    const result = replaceChapterContent(content, 'C1', 'New 1')
    expect(result).toContain('# C1')
    expect(result).toContain('New 1')
    expect(result).not.toContain('Old 1')
    expect(result).toContain('# C2')
    expect(result).toContain('Old 2')
  })

  it('should append chapter if it doesn\'t exist', () => {
    const result = replaceChapterContent(content, 'C3', 'New 3')
    expect(result).toContain('# C1')
    expect(result).toContain('# C2')
    expect(result).toContain('# C3')
    expect(result).toContain('New 3')
  })
})

describe('isStoryFile', () => {
  it('should return true if type is story', () => {
    expect(isStoryFile({ title: 'Anything', type: STORY_FILE_TYPE })).toBe(true)
  })

  it('should return true if title is Story', () => {
    expect(isStoryFile({ title: STORY_FILE_TITLE, type: 'anything' })).toBe(true)
  })

  it('should return false otherwise', () => {
    expect(isStoryFile({ title: 'Notes', type: 'note' })).toBe(false)
    expect(isStoryFile(null)).toBe(false)
  })
})

describe('normalizeProjectStoryContent', () => {
  it('should normalize story content from story file', () => {
    const project = {
      title: 'Test',
      files: [
        { title: STORY_FILE_TITLE, content: 'File Content', type: STORY_FILE_TYPE }
      ],
      storyContent: 'Old Content'
    } as unknown as Project

    const normalized = normalizeProjectStoryContent(project)
    expect(normalized.storyContent).toBe('File Content')
    expect(normalized.files).toHaveLength(0) // Story file should be filtered out
  })

  it('should fallback to project.storyContent if no story file', () => {
    const project = {
      title: 'Test',
      files: [],
      storyContent: 'Project Content'
    } as unknown as Project

    const normalized = normalizeProjectStoryContent(project)
    expect(normalized.storyContent).toBe('Project Content')
  })
})
