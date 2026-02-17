import { describe, it, expect } from 'vitest'
import reducer, {
  setSettingsState,
  setApi,
  setWorkingRootDirectory,
  setHighPreferenceModelId,
  setLowPreferenceModelId,
  setProvider,
  setGoogleApiKey
} from './settingsSlice'
import { AppSettings } from '@/types'
import {
  DEFAULT_HIGH_PREFERENCE_MODEL_ID,
  DEFAULT_LOW_PREFERENCE_MODEL_ID,
  DEFAULT_PROVIDER
} from '@shared/constants'

describe('settingsSlice', () => {
  const initialState: AppSettings = {
    api: '',
    workingRootDirectory: null,
    highPreferenceModelId: DEFAULT_HIGH_PREFERENCE_MODEL_ID,
    lowPreferenceModelId: DEFAULT_LOW_PREFERENCE_MODEL_ID,
    provider: DEFAULT_PROVIDER,
    googleApiKey: '',
    deepseekApiKey: '',
    zaiApiKey: '',
    openaiApiKey: ''
  }

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle setSettingsState and apply defaults for missing fields', () => {
    const loadedSettings = {
      api: 'https://new-api.com',
      workingRootDirectory: '/new/root'
    } as any
    
    const actual = reducer(initialState, setSettingsState(loadedSettings))
    
    expect(actual.api).toBe('https://new-api.com')
    expect(actual.workingRootDirectory).toBe('/new/root')
    // Defaults should be preserved
    expect(actual.highPreferenceModelId).toBe(DEFAULT_HIGH_PREFERENCE_MODEL_ID)
    expect(actual.provider).toBe(DEFAULT_PROVIDER)
  })

  it('should handle setApi', () => {
    const actual = reducer(initialState, setApi('https://api.test'))
    expect(actual.api).toBe('https://api.test')
  })

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
})
