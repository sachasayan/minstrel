import { describe, expect, it } from 'vitest'

import {
  DEFAULT_NEW_PROJECT_COVER_PATHS,
  pickRandomDefaultNewProjectCoverPath
} from '@/lib/defaultProjectCovers'

describe('projectListeners', () => {
  describe('pickRandomDefaultNewProjectCoverPath', () => {
    it('returns the first cover for a zero random value', () => {
      expect(pickRandomDefaultNewProjectCoverPath(0)).toBe(DEFAULT_NEW_PROJECT_COVER_PATHS[0])
    })

    it('returns the last cover for a high random value', () => {
      expect(pickRandomDefaultNewProjectCoverPath(0.999999)).toBe(
        DEFAULT_NEW_PROJECT_COVER_PATHS[DEFAULT_NEW_PROJECT_COVER_PATHS.length - 1]
      )
    })

    it('always returns a path from the default covers list', () => {
      for (const randomValue of [0.1, 0.4, 0.8]) {
        expect(DEFAULT_NEW_PROJECT_COVER_PATHS).toContain(
          pickRandomDefaultNewProjectCoverPath(randomValue)
        )
      }
    })
  })
})
