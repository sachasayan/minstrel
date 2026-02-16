import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2')
  })

  it('should handle null, undefined, and boolean values', () => {
    expect(cn('class1', null, undefined, true, false, 'class2')).toBe('class1 class2')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
  })

  it('should merge tailwind classes correctly (tailwind-merge)', () => {
    // p-4 and p-8 should be merged to p-8
    expect(cn('p-4', 'p-8')).toBe('p-8')

    // text-red-500 and text-blue-500 should be merged to text-blue-500
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle complex conditional combinations', () => {
    const isActive = true
    const isDisabled = false
    expect(
      cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class',
        { 'extra-class': true }
      )
    ).toBe('base-class active-class extra-class')
  })
})
