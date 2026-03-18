// @vitest-environment jsdom

import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { createRoot, Root } from 'react-dom/client'

import settingsReducer from '@/lib/store/settingsSlice'
import SettingsPage from './SettingsPage'
import { bridge } from '@/lib/bridge'
import { describeWritingStyle } from '@/lib/assistants/writingStyleAssistant'

vi.mock('@/lib/bridge', () => ({
  bridge: {
    getAppSettings: vi.fn(),
    saveAppSettings: vi.fn(),
    selectDirectory: vi.fn()
  }
}))

vi.mock('@/lib/assistants/writingStyleAssistant', () => ({
  describeWritingStyle: vi.fn()
}))

vi.mock('@/lib/services/llmService', () => ({
  default: {
    verifyKey: vi.fn().mockResolvedValue(true)
  }
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null
}))

const mockStoredSettings = {
  provider: 'google',
  highPreferenceModelId: 'gemini-2.5-pro',
  lowPreferenceModelId: 'gemini-2.5-flash',
  googleApiKey: '',
  deepseekApiKey: '',
  zaiApiKey: '',
  openaiApiKey: '',
  workingRootDirectory: null,
  writingSample: '',
  writingStyleDescription: '',
  recentProjects: []
}

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('SettingsPage personalization', () => {
  let container: HTMLDivElement
  let root: Root

  const renderSettings = async (open = true) => {
    const store = configureStore({
      reducer: {
        settings: settingsReducer
      }
    })

    await act(async () => {
      root.render(
        <Provider store={store}>
          <SettingsPage open={open} onClose={vi.fn()} />
        </Provider>
      )
      await flushPromises()
    })

    return store
  }

  const clickButton = async (label: string) => {
    const button = Array.from(container.querySelectorAll('button')).find((node) => node.textContent?.includes(label))
    expect(button).toBeTruthy()

    await act(async () => {
      button!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await flushPromises()
    })
  }

  const pasteIntoSample = async (text: string) => {
    const textarea = container.querySelector('#writingSample') as HTMLTextAreaElement | null
    expect(textarea).toBeTruthy()

    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: {
        getData: () => text
      }
    })

    await act(async () => {
      textarea!.dispatchEvent(event)
      await flushPromises()
    })
  }

  const openPersonalizationTab = async () => {
    await clickButton('Personalization')
  }

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    Object.assign(mockStoredSettings, {
      provider: 'google',
      highPreferenceModelId: 'gemini-2.5-pro',
      lowPreferenceModelId: 'gemini-2.5-flash',
      googleApiKey: '',
      deepseekApiKey: '',
      zaiApiKey: '',
      openaiApiKey: '',
      workingRootDirectory: null,
      writingSample: '',
      writingStyleDescription: '',
      recentProjects: []
    })

    vi.mocked(bridge.getAppSettings).mockImplementation(async () => ({ ...mockStoredSettings }))
    vi.mocked(bridge.saveAppSettings).mockImplementation(async (config: any) => {
      Object.assign(mockStoredSettings, config)
      return config
    })
    vi.mocked(describeWritingStyle).mockResolvedValue('Lean, reflective prose with short declarative sentences.')
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('persists the pasted sample and derived analysis to settings', async () => {
    await renderSettings(true)
    await openPersonalizationTab()

    await pasteIntoSample('A pasted sample passage.')

    expect(describeWritingStyle).toHaveBeenCalledWith(expect.any(Object), 'A pasted sample passage.')
    expect(bridge.saveAppSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        writingSample: 'A pasted sample passage.',
        writingStyleDescription: 'Lean, reflective prose with short declarative sentences.'
      })
    )
    expect(mockStoredSettings.writingSample).toBe('A pasted sample passage.')
    expect(mockStoredSettings.writingStyleDescription).toBe('Lean, reflective prose with short declarative sentences.')
  })

  it('reloads persisted personalization values when the modal is reopened', async () => {
    mockStoredSettings.writingSample = 'Persisted sample'
    mockStoredSettings.writingStyleDescription = 'Persisted analysis'

    await renderSettings(true)
    await openPersonalizationTab()

    const sampleField = container.querySelector('#writingSample') as HTMLTextAreaElement
    const analysisField = container.querySelector('#writingStyleDescription') as HTMLTextAreaElement

    expect(sampleField.value).toBe('Persisted sample')
    expect(analysisField.value).toBe('Persisted analysis')

    await act(async () => {
      root.render(
        <Provider
          store={configureStore({
            reducer: {
              settings: settingsReducer
            }
          })}
        >
          <SettingsPage open={false} onClose={vi.fn()} />
        </Provider>
      )
      await flushPromises()
    })

    await renderSettings(true)
    await openPersonalizationTab()

    const reopenedSampleField = container.querySelector('#writingSample') as HTMLTextAreaElement
    const reopenedAnalysisField = container.querySelector('#writingStyleDescription') as HTMLTextAreaElement

    expect(reopenedSampleField.value).toBe('Persisted sample')
    expect(reopenedAnalysisField.value).toBe('Persisted analysis')
  })

  it('clears the persisted sample and analysis', async () => {
    mockStoredSettings.writingSample = 'Persisted sample'
    mockStoredSettings.writingStyleDescription = 'Persisted analysis'

    await renderSettings(true)
    await openPersonalizationTab()
    await clickButton('Clear')

    expect(bridge.saveAppSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        writingSample: '',
        writingStyleDescription: ''
      })
    )
    expect(mockStoredSettings.writingSample).toBe('')
    expect(mockStoredSettings.writingStyleDescription).toBe('')
  })
})
