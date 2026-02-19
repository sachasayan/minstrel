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
    // @ts-ignore - testing null input
    expect(getChaptersFromStoryContent(null)).toEqual([])
    // @ts-ignore - testing undefined input
    expect(getChaptersFromStoryContent(undefined)).toEqual([])
  })
})

describe('calculateWordCount', () => {
  it('should return 0 for empty content', () => {
    expect(calculateWordCount('')).toBe(0)
    // @ts-ignore - testing null input
    expect(calculateWordCount(null)).toBe(0)
  })

  it('should count words correctly', () => {
    expect(calculateWordCount('One two three')).toBe(3)
  })

  it('should handle multiple spaces and newlines', () => {
    expect(calculateWordCount('  One   two\nthree  ')).toBe(3)
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

  it('should not duplicate header if new content already has one', () => {
    const result = replaceChapterContent(content, 'C1', '# C1\nNew Content')
    const matches = result.match(/# C1/g)
    expect(matches).toHaveLength(1)
    expect(result).toContain('New Content')
    expect(result).not.toContain('Old 1')
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
  it('should normalize story content from project.storyContent', () => {
    const project = {
      title: 'Test',
      files: [],
      storyContent: 'Project Content'
    } as unknown as Project

    const normalized = normalizeProjectStoryContent(project)
    expect(normalized.storyContent).toBe('Project Content')
  })

  it('should filter out individual chapter files from ancillary files', () => {
    const project = {
      title: 'Test',
      files: [
        { title: 'Chapter 1', content: '...', type: 'chapter' },
        { title: 'Story', content: '...', type: 'story' },
        { title: 'Outline', content: '...', type: 'note' }
      ],
      storyContent: 'Monolith'
    } as unknown as Project

    const normalized = normalizeProjectStoryContent(project)
    expect(normalized.storyContent).toBe('Monolith')
    expect(normalized.files).toHaveLength(1)
    expect(normalized.files[0].title).toBe('Outline')
  })
})
