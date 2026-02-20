import { describe, it, expect } from 'vitest'
import * as u from './promptsUtils'

describe('promptsUtils', () => {
  const s = u.separator
  it('appendWithSeparator', () => {
    expect(u.appendWithSeparator('A', 'B')).toBe(`A${s}B`)
    expect(u.appendWithSeparator('A', null)).toBe('A')
    expect(u.appendWithSeparator('', 'B')).toBe('B')
  })
  it('file functions', () => {
    expect(u.addAvailableFiles('P', ['f1'])).toContain('f1')
    expect(u.addAvailableFiles('P', [])).toContain('listing of files')
    expect(u.addProvidedFiles('P', ['f1'])).toContain('f1')
    expect(u.addProvidedFiles('P', [])).toContain('did not provide any files')
    expect(u.addFileContents('P', 'C')).toContain('C')
    expect(u.addFileContents('P', '')).toContain('any file contents')
  })
  it('prompt/param functions', () => {
    expect(u.addUserPrompt('P', 'M')).toContain('M')
    expect(u.addUserPrompt('P', '')).toContain('No user prompt')
    expect(u.addParameters('P', 'Pa')).toContain('Pa')
    expect(u.addParameters('P', '')).toContain('No parameters')
  })
  it('step/sequence functions', () => {
    expect(u.addCurrentStep('P', 5)).toContain('5')
    expect(u.addCurrentStep('P', undefined)).toBe('P')
    expect(u.addCurrentStep('P', -1)).toBe('P')
    expect(u.addCurrentSequence('P', 'S')).toContain('S')
    expect(u.addCurrentSequence('P', '')).toBe('P')
  })

})
