import { describe, it, expect } from 'vitest'
import reducer, {
  setSettingsState,
  setWorkingRootDirectory,
  setHighPreferenceModelId,
  setLowPreferenceModelId,
  setProvider,
  setGoogleApiKey,
  setRecentProjects,
  addRecentProject
} from './settingsSlice'
import { RecentProject } from '@/types'
import { AppSettings } from '@/types'
import {
  DEFAULT_HIGH_PREFERENCE_MODEL_ID,
  DEFAULT_LOW_PREFERENCE_MODEL_ID,
  DEFAULT_PROVIDER
} from '@shared/constants'

describe('settingsSlice', () => {
  const initialState: AppSettings = {
    workingRootDirectory: null,
    highPreferenceModelId: DEFAULT_HIGH_PREFERENCE_MODEL_ID,
    lowPreferenceModelId: DEFAULT_LOW_PREFERENCE_MODEL_ID,
    provider: DEFAULT_PROVIDER,
    googleApiKey: '',
    deepseekApiKey: '',
    zaiApiKey: '',
    openaiApiKey: '',
    recentProjects: []
  }

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle setSettingsState and apply defaults for missing fields', () => {
    const loadedSettings = {
      workingRootDirectory: '/new/root'
    } as any
    
    const actual = reducer(initialState, setSettingsState(loadedSettings))
    
    expect(actual.workingRootDirectory).toBe('/new/root')
    // Defaults should be preserved
    expect(actual.highPreferenceModelId).toBe(DEFAULT_HIGH_PREFERENCE_MODEL_ID)
    expect(actual.provider).toBe(DEFAULT_PROVIDER)
  })

  // Removed setApi test as field is now deprecated (always using default endpoints)

  it('should handle setWorkingRootDirectory', () => {
    const actual = reducer(initialState, setWorkingRootDirectory('/test/dir'))
    expect(actual.workingRootDirectory).toBe('/test/dir')
    
    const cleared = reducer(actual, setWorkingRootDirectory(null))
    expect(cleared.workingRootDirectory).toBeNull()
  })

  it('should handle setHighPreferenceModelId', () => {
    const actual = reducer(initialState, setHighPreferenceModelId('model-8b'))
    expect(actual.highPreferenceModelId).toBe('model-8b')
  })

  it('should handle setLowPreferenceModelId', () => {
    const actual = reducer(initialState, setLowPreferenceModelId('model-1b'))
    expect(actual.lowPreferenceModelId).toBe('model-1b')
  })

  it('should handle setProvider', () => {
    const actual = reducer(initialState, setProvider('openai'))
    expect(actual.provider).toBe('openai')
  })

  it('should handle setGoogleApiKey', () => {
    const actual = reducer(initialState, setGoogleApiKey('google-key-123'))
    expect(actual.googleApiKey).toBe('google-key-123')
  })

  describe('setRecentProjects', () => {
    it('should replace the recentProjects list wholesale', () => {
      const projects: RecentProject[] = [
        { projectPath: '/a.mns', title: 'A', genre: 'fantasy', lastOpenedAt: '2026-01-01T00:00:00Z' }
      ]
      const actual = reducer(initialState, setRecentProjects(projects))
      expect(actual.recentProjects).toEqual(projects)
    })
  })

  describe('addRecentProject', () => {
    const makeProject = (id: string): RecentProject => ({
      projectPath: `/projects/${id}.mns`,
      title: `Project ${id}`,
      genre: 'fantasy',
      lastOpenedAt: `2026-01-0${id}T00:00:00Z`
    })

    it('should prepend new projects to the front of the list', () => {
      const stateWithOne = reducer(initialState, addRecentProject(makeProject('1')))
      const stateWithTwo = reducer(stateWithOne, addRecentProject(makeProject('2')))
      expect(stateWithTwo.recentProjects![0].title).toBe('Project 2')
      expect(stateWithTwo.recentProjects![1].title).toBe('Project 1')
    })

    it('should deduplicate: re-opening an existing path moves it to the front', () => {
      let state = reducer(initialState, addRecentProject(makeProject('1')))
      state = reducer(state, addRecentProject(makeProject('2')))
      state = reducer(state, addRecentProject(makeProject('1'))) // re-open project 1
      expect(state.recentProjects).toHaveLength(2)
      expect(state.recentProjects![0].title).toBe('Project 1')
      expect(state.recentProjects![1].title).toBe('Project 2')
    })

    it('should cap the list at 3 entries', () => {
      let state = initialState
      for (const id of ['1', '2', '3', '4']) {
        state = reducer(state, addRecentProject(makeProject(id)))
      }
      expect(state.recentProjects).toHaveLength(3)
      // Most recently opened should be first
      expect(state.recentProjects![0].title).toBe('Project 4')
      // Oldest (Project 1) should have been evicted
      expect(state.recentProjects!.map(p => p.title)).not.toContain('Project 1')
    })

    it('should handle adding to an undefined recentProjects list gracefully', () => {
      const stateWithUndefinedRecents = { ...initialState, recentProjects: undefined }
      const actual = reducer(stateWithUndefinedRecents as any, addRecentProject(makeProject('1')))
      expect(actual.recentProjects).toHaveLength(1)
      expect(actual.recentProjects![0].title).toBe('Project 1')
    })
  })
})

