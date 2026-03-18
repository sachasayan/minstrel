import { ipcMain } from 'electron'
import type { OtelSpan, TraceExportResult } from '../shared/observability'

interface LangfuseExporterConfig {
  baseUrl: string
  publicKey: string
  secretKey: string
  environment: string
}

interface TraceExporter {
  export(spans: OtelSpan[]): Promise<TraceExportResult>
}

type OtlpAttributeValue = { stringValue: string } | { boolValue: boolean } | { intValue: string } | { doubleValue: number }

interface ExportTraceServiceResponse {
  partialSuccess?: {
    rejectedSpans?: number | string
    errorMessage?: string
  }
}

const getLangfuseConfig = (): LangfuseExporterConfig | null => {
  const baseUrl = process.env.LANGFUSE_BASE_URL?.trim()
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim()
  const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim()
  const environment = process.env.LANGFUSE_ENVIRONMENT?.trim() || process.env.NODE_ENV || 'development'

  if (!baseUrl || !publicKey || !secretKey) {
    return null
  }

  return { baseUrl, publicKey, secretKey, environment }
}

class NoopTraceExporter implements TraceExporter {
  async export(spans: OtelSpan[]): Promise<TraceExportResult> {
    return {
      accepted: false,
      destination: 'noop',
      spanCount: spans.length,
      reason: 'langfuse_not_configured'
    }
  }
}

class LangfuseTraceExporter implements TraceExporter {
  constructor(private readonly config: LangfuseExporterConfig) {}

  async export(spans: OtelSpan[]): Promise<TraceExportResult> {
    if (spans.length === 0) {
      return {
        accepted: true,
        destination: 'langfuse',
        spanCount: 0
      }
    }

    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.getAuthHeader()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.toOtlpJson(spans))
    })

    if (!response.ok) {
      const responseText = await response.text().catch(() => '')
      return {
        accepted: false,
        destination: 'langfuse',
        spanCount: spans.length,
        reason: `http_${response.status}${responseText ? `:${responseText.slice(0, 200)}` : ''}`
      }
    }

    const payload = (await response.json().catch(() => ({}))) as ExportTraceServiceResponse
    const rejectedSpans = Number(payload.partialSuccess?.rejectedSpans ?? 0)
    const errorMessage = payload.partialSuccess?.errorMessage?.trim()

    return {
      accepted: rejectedSpans === 0,
      destination: 'langfuse',
      spanCount: spans.length,
      reason: rejectedSpans > 0 ? errorMessage || `partial_success:${rejectedSpans}` : undefined
    }
  }

  private getEndpoint() {
    return `${this.config.baseUrl.replace(/\/+$/, '')}/api/public/otel/v1/traces`
  }

  private getAuthHeader() {
    return Buffer.from(`${this.config.publicKey}:${this.config.secretKey}`).toString('base64')
  }

  private toOtlpJson(spans: OtelSpan[]) {
    return {
      resourceSpans: [
        {
          resource: {
            attributes: [
              {
                key: 'service.name',
                value: {
                  stringValue: 'minstrel-electron'
                }
              },
              {
                key: 'deployment.environment',
                value: {
                  stringValue: this.config.environment
                }
              }
            ],
            droppedAttributesCount: 0
          },
          scopeSpans: [
            {
              scope: {
                name: 'minstrel.agent-trace-exporter'
              },
              spans: spans.map((span) => ({
                traceId: span.traceId,
                spanId: span.spanId,
                parentSpanId: span.parentSpanId ?? '',
                name: span.name,
                kind: this.toSpanKind(span.kind),
                startTimeUnixNano: span.startTimeUnixNano,
                endTimeUnixNano: span.endTimeUnixNano,
                attributes: this.toOtlpAttributes(span.attributes),
                droppedAttributesCount: 0,
                events: span.events.map((event) => ({
                  timeUnixNano: event.timeUnixNano,
                  name: event.name,
                  attributes: this.toOtlpAttributes(event.attributes ?? {}),
                  droppedAttributesCount: 0
                })),
                droppedEventsCount: 0,
                droppedLinksCount: 0,
                status: {
                  code: span.status.code === 'ERROR' ? 2 : 1,
                  message: span.status.message ?? ''
                }
              }))
            }
          ]
        }
      ]
    }
  }

  private toSpanKind(kind: OtelSpan['kind']) {
    switch (kind) {
      case 'CLIENT':
        return 3
      case 'INTERNAL':
      default:
        return 1
    }
  }

  private toOtlpAttributes(attributes: Record<string, string | number | boolean>) {
    return Object.entries(attributes).map(([key, value]) => ({
      key,
      value: this.toOtlpValue(value)
    }))
  }

  private toOtlpValue(value: string | number | boolean): OtlpAttributeValue {
    if (typeof value === 'boolean') {
      return { boolValue: value }
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? { intValue: String(value) } : { doubleValue: value }
    }

    return { stringValue: value }
  }
}

const createTraceExporter = (): TraceExporter => {
  const config = getLangfuseConfig()
  return config ? new LangfuseTraceExporter(config) : new NoopTraceExporter()
}

export const exportTraceSpans = async (spans: OtelSpan[]) => {
  const exporter = createTraceExporter()
  return exporter.export(Array.isArray(spans) ? spans : [])
}

const handleExportAgentTrace = async (_event: Electron.IpcMainInvokeEvent, spans: OtelSpan[]) => exportTraceSpans(spans)

export const registerTraceExportHandlers = () => {
  ipcMain.handle('export-agent-trace', handleExportAgentTrace)
}
