import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import { streamingService } from './streamingService'

describe('streamingService', () => {
  beforeEach(() => {
    streamingService.clear()
    vi.clearAllMocks()
  })

  it('notifies text subscribers and stops after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = streamingService.subscribeToText(listener)

    streamingService.updateText('drafting')
    unsubscribe()
    streamingService.updateText('ignored')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('drafting')
    expect(streamingService.getCurrentText()).toBe('ignored')
  })

  it('clears text and status and notifies both subscriber sets', () => {
    const textListener = vi.fn()
    const statusListener = vi.fn()
    streamingService.subscribeToText(textListener)
    streamingService.subscribeToStatus(statusListener)

    streamingService.updateText('partial')
    streamingService.updateStatus('Thinking...')
    streamingService.clear()

    expect(streamingService.getCurrentText()).toBe('')
    expect(streamingService.getCurrentStatus()).toBe('')
    expect(textListener).toHaveBeenLastCalledWith('')
    expect(statusListener).toHaveBeenLastCalledWith('')
  })
})
