import { describe, it, expect } from 'vitest'
import { calculateWordCount } from './storyContent'

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
})
