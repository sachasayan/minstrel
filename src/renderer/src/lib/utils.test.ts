import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2')
  })

  it('should merge Tailwind classes and resolve conflicts', () => {
    // twMerge should resolve 'px-2 px-4' to 'px-4'
    expect(cn('px-2', 'px-4')).toBe('px-4')
    // twMerge should resolve 'bg-red-500 bg-blue-500' to 'bg-blue-500'
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('should handle objects of classes', () => {
    expect(cn({ 'class1': true, 'class2': false, 'class3': true })).toBe('class1 class3')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
    expect(cn(['class1', ['class2', 'class3']])).toBe('class1 class2 class3')
  })

  it('should handle mixed inputs', () => {
    expect(cn('class1', { 'class2': true }, ['class3', 'class4'])).toBe('class1 class2 class3 class4')
  })

  it('should handle falsy values', () => {
    expect(cn('class1', null, undefined, false, '')).toBe('class1')
  })

  it('should handle complex tailwind conflict resolution', () => {
    expect(cn('p-4', 'pt-2')).toBe('p-4 pt-2') // pt-2 is more specific than p-4 but twMerge might handle it differently depending on config. Actually p-4 includes pt-4, so pt-2 overrides the top padding.
    expect(cn('pt-2', 'p-4')).toBe('p-4') // p-4 overrides pt-2
  })
})
