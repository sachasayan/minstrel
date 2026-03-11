export interface OtelSpanEvent {
  name: string
  timeUnixNano: string
  attributes?: Record<string, string | number | boolean>
}

export interface OtelStatus {
  code: 'OK' | 'ERROR'
  message?: string
}

export interface OtelSpan {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  kind: 'INTERNAL' | 'CLIENT'
  startTimeUnixNano: string
  endTimeUnixNano: string
  attributes: Record<string, string | number | boolean>
  events: OtelSpanEvent[]
  status: OtelStatus
}

export interface TraceExportResult {
  accepted: boolean
  destination: 'langfuse' | 'noop'
  spanCount: number
  reason?: string
}
