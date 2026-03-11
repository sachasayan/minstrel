import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OtelSpan } from '../shared/observability'
import { exportTraceSpans } from './traceExport'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn()
  }
}))

describe('traceExport', () => {
  const originalEnv = { ...process.env }
  const fetchMock = vi.fn()

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    fetchMock.mockReset()
  })

  it('returns a noop result when Langfuse is not configured', async () => {
    delete process.env.LANGFUSE_BASE_URL
    delete process.env.LANGFUSE_PUBLIC_KEY
    delete process.env.LANGFUSE_SECRET_KEY

    const spans: OtelSpan[] = [
      {
        traceId: 'trace',
        spanId: 'span',
        name: 'agent.run.storyAgent',
        kind: 'INTERNAL',
        startTimeUnixNano: '1',
        endTimeUnixNano: '2',
        attributes: {},
        events: [],
        status: { code: 'OK' }
      }
    ]

    await expect(exportTraceSpans(spans)).resolves.toEqual({
      accepted: false,
      destination: 'noop',
      spanCount: 1,
      reason: 'langfuse_not_configured'
    })
  })

  it('posts OTLP JSON traces to Langfuse with basic auth when configured', async () => {
    process.env.LANGFUSE_BASE_URL = 'https://cloud.langfuse.com'
    process.env.LANGFUSE_PUBLIC_KEY = 'pk-test'
    process.env.LANGFUSE_SECRET_KEY = 'sk-test'
    process.env.LANGFUSE_ENVIRONMENT = 'staging'

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({})
    })
    vi.stubGlobal('fetch', fetchMock)

    const spans: OtelSpan[] = [
      {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        parentSpanId: 'fedcba9876543210',
        name: 'agent.run.storyAgent',
        kind: 'INTERNAL',
        startTimeUnixNano: '1000',
        endTimeUnixNano: '2000',
        attributes: {
          'minstrel.status': 'completed',
          'minstrel.step_count': 2,
          'minstrel.output_suppressed': false
        },
        events: [
          {
            name: 'step_started',
            timeUnixNano: '1500',
            attributes: {
              stepIndex: 0
            }
          }
        ],
        status: { code: 'OK' }
      }
    ]

    await expect(exportTraceSpans(spans)).resolves.toEqual({
      accepted: true,
      destination: 'langfuse',
      spanCount: 1,
      reason: undefined
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://cloud.langfuse.com/api/public/otel/v1/traces')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual(
      expect.objectContaining({
        Authorization: `Basic ${Buffer.from('pk-test:sk-test').toString('base64')}`,
        'Content-Type': 'application/json'
      })
    )

    const body = JSON.parse(String(init.body))
    expect(body.resourceSpans[0].resource.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'service.name', value: { stringValue: 'minstrel-electron' } }),
        expect.objectContaining({ key: 'deployment.environment', value: { stringValue: 'staging' } })
      ])
    )
    expect(body.resourceSpans[0].scopeSpans[0].spans[0]).toEqual(
      expect.objectContaining({
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        parentSpanId: 'fedcba9876543210',
        kind: 1,
        status: { code: 1, message: '' }
      })
    )
  })

  it('returns a rejected result when Langfuse responds with an error', async () => {
    process.env.LANGFUSE_BASE_URL = 'https://cloud.langfuse.com'
    process.env.LANGFUSE_PUBLIC_KEY = 'pk-test'
    process.env.LANGFUSE_SECRET_KEY = 'sk-test'

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'unauthorized'
    })
    vi.stubGlobal('fetch', fetchMock)

    const spans: OtelSpan[] = [
      {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        name: 'agent.run.storyAgent',
        kind: 'INTERNAL',
        startTimeUnixNano: '1000',
        endTimeUnixNano: '2000',
        attributes: {},
        events: [],
        status: { code: 'OK' }
      }
    ]

    await expect(exportTraceSpans(spans)).resolves.toEqual({
      accepted: false,
      destination: 'langfuse',
      spanCount: 1,
      reason: 'http_401:unauthorized'
    })
  })
})
