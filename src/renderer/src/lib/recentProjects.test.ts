import { describe, expect, it } from 'vitest'

import { buildRecentProjectEntry } from './recentProjects'

describe('buildRecentProjectEntry', () => {
  it('prefers a generated data URL when raw cover image data exists', () => {
    const result = buildRecentProjectEntry(
      {
        projectPath: '/projects/test.mns',
        title: 'Test',
        genre: 'fantasy',
        cover: '/stale-cover.png',
        coverImageMimeType: 'image/png',
        coverImageBase64: 'YWJj',
        wordCountCurrent: 1234
      },
      '2026-03-09T12:00:00.000Z'
    )

    expect(result).toEqual({
      projectPath: '/projects/test.mns',
      title: 'Test',
      genre: 'fantasy',
      cover: 'data:image/png;base64,YWJj',
      coverImageMimeType: 'image/png',
      wordCountCurrent: 1234,
      lastOpenedAt: '2026-03-09T12:00:00.000Z'
    })
  })

  it('falls back to the existing cover when no base64 data is present', () => {
    const result = buildRecentProjectEntry(
      {
        projectPath: '/projects/test.mns',
        title: 'Test',
        genre: 'fantasy',
        cover: 'data:image/jpeg;base64,xyz',
        coverImageMimeType: 'image/jpeg',
        wordCountCurrent: 50
      },
      '2026-03-09T12:00:00.000Z'
    )

    expect(result.cover).toBe('data:image/jpeg;base64,xyz')
  })
})
