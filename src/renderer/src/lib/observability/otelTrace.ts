import type {
  AgentTrace,
  AgentTraceEvent,
  AgentTraceStep,
  AgentTraceToolCall
} from '@/lib/services/agentTraceService'
import { hashString } from './hash'
import type { OtelSpan, OtelSpanEvent, OtelStatus } from '@shared/observability'

const toUnixNano = (isoTimestamp: string) => `${BigInt(new Date(isoTimestamp).getTime()) * 1000000n}`

const toHex = (input: string, length: number) => {
  const raw = hashString(input).replace(/^fnv1a:/, '')
  return raw.padStart(length, '0').slice(0, length)
}

const toTraceId = (traceId: string) => `${toHex(traceId, 16)}${toHex(`${traceId}:trace`, 16)}`
const toSpanId = (value: string) => toHex(value, 16)

const safeEndTime = (endedAt: string | undefined, startedAt: string) => endedAt ?? startedAt

const summarizeObject = (value: unknown) => JSON.stringify(value ?? null)
const stringifyForLangfuse = (value: unknown) =>
  typeof value === 'string' ? value : JSON.stringify(value ?? null)

const getTraceOutput = (trace: AgentTrace) => {
  const lastCompletedStep = [...trace.steps]
    .reverse()
    .find((step) => step.displayedText || step.finalText)

  return lastCompletedStep?.displayedText ?? lastCompletedStep?.finalText ?? ''
}

const statusFromTrace = (trace: AgentTrace): OtelStatus =>
  trace.status === 'error' || trace.status === 'max_steps'
    ? { code: 'ERROR', message: trace.errorMessage ?? trace.status }
    : { code: 'OK' }

const statusFromStep = (step: AgentTraceStep): OtelStatus =>
  step.status === 'error'
    ? { code: 'ERROR', message: step.finalText?.slice(0, 200) }
    : { code: 'OK' }

const statusFromTool = (call: AgentTraceToolCall): OtelStatus =>
  call.status === 'error'
    ? { code: 'ERROR', message: call.errorMessage }
    : { code: 'OK' }

const eventAttributes = (data?: Record<string, unknown>) => {
  if (!data) return undefined

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      Array.isArray(value) ? JSON.stringify(value) : typeof value === 'object' && value !== null ? JSON.stringify(value) : (value as string | number | boolean)
    ])
  )
}

const toSpanEvent = (event: AgentTraceEvent): OtelSpanEvent => ({
  name: event.type,
  timeUnixNano: toUnixNano(event.timestamp),
  attributes: eventAttributes(event.data)
})

const buildRootSpan = (trace: AgentTrace, traceId: string): OtelSpan => {
  const rootSpanId = toSpanId(`${trace.traceId}:root`)

  return {
    traceId,
    spanId: rootSpanId,
    name: `agent.run.${trace.initialAgent}`,
    kind: 'INTERNAL',
    startTimeUnixNano: toUnixNano(trace.startedAt),
    endTimeUnixNano: toUnixNano(safeEndTime(trace.endedAt, trace.startedAt)),
    attributes: {
      'minstrel.trace.id': trace.traceId,
      'minstrel.request_token': trace.requestToken,
      'minstrel.project_path': trace.projectPath ?? '',
      'minstrel.initial_agent': trace.initialAgent,
      'langfuse.trace.input': trace.userMessage ?? '',
      'langfuse.trace.output': getTraceOutput(trace),
      'minstrel.user_message_hash': hashString(trace.userMessage ?? ''),
      'minstrel.user_message_present': Boolean(trace.userMessage),
      'minstrel.step_count': trace.steps.length,
      'minstrel.status': trace.status
    },
    events: trace.events.map(toSpanEvent),
    status: statusFromTrace(trace)
  }
}

const buildStepSpan = (trace: AgentTrace, step: AgentTraceStep, traceId: string): OtelSpan => {
  const rootSpanId = toSpanId(`${trace.traceId}:root`)
  const requestedFiles = step.requestedFiles ?? []
  const prompt = step.prompt

  return {
    traceId,
    spanId: toSpanId(step.stepId),
    parentSpanId: rootSpanId,
    name: `agent.step.${step.agent}`,
    kind: 'INTERNAL',
    startTimeUnixNano: toUnixNano(step.startedAt),
    endTimeUnixNano: toUnixNano(safeEndTime(step.endedAt, step.startedAt)),
    attributes: {
      'minstrel.step.id': step.stepId,
      'minstrel.step.index': step.index,
      'minstrel.agent': step.agent,
      'minstrel.status': step.status,
      'langfuse.observation.input': stringifyForLangfuse({
        system: prompt.system,
        messages: prompt.messages
      }),
      'langfuse.observation.output': stringifyForLangfuse({
        finalText: step.finalText ?? '',
        displayedText: step.displayedText ?? '',
        nextAgent: step.nextAgent ?? null,
        nextRequestedFiles: step.nextRequestedFiles ?? []
      }),
      'minstrel.requested_files': JSON.stringify(requestedFiles),
      'minstrel.requested_file_count': requestedFiles.length,
      'minstrel.allowed_tools': JSON.stringify(step.allowedTools),
      'minstrel.allowed_tool_count': step.allowedTools.length,
      'llm.model.provider': step.provider ?? '',
      'llm.model.name': step.modelId ?? '',
      'minstrel.model_preference': step.modelPreference,
      'minstrel.prompt.system_hash': prompt.metadata.systemHash,
      'minstrel.prompt.system_length': prompt.metadata.systemLength,
      'minstrel.prompt.message_hash': prompt.metadata.messageHash,
      'minstrel.prompt.message_count': prompt.metadata.messageCount,
      'minstrel.prompt.synthetic_continue_message': prompt.metadata.syntheticContinueMessage,
      'minstrel.prompt.available_file_count': prompt.metadata.availableFiles.length,
      'minstrel.prompt.provided_file_count': prompt.metadata.providedFiles.length,
      'minstrel.streamed_text_length': step.streamedTextLength,
      'minstrel.output_suppressed': step.outputSuppressed,
      'minstrel.final_text_hash': hashString(step.finalText ?? ''),
      'minstrel.displayed_text_hash': hashString(step.displayedText ?? '')
    },
    events: [
      ...prompt.metadata.sectionMetadata.map((section) => ({
        name: 'prompt.section',
        timeUnixNano: toUnixNano(step.startedAt),
        attributes: {
          'prompt.section.key': section.key,
          'prompt.section.title': section.title,
          'prompt.section.hash': section.hash,
          'prompt.section.length': section.contentLength,
          'prompt.section.item_count': section.itemCount ?? 0
        }
      })),
      ...(step.nextAgent
        ? [
            {
              name: 'agent.route',
              timeUnixNano: toUnixNano(safeEndTime(step.endedAt, step.startedAt)),
              attributes: {
                'agent.route.target': step.nextAgent
              }
            }
          ]
        : []),
      ...(step.nextRequestedFiles?.length
        ? [
            {
              name: 'agent.request_files',
              timeUnixNano: toUnixNano(safeEndTime(step.endedAt, step.startedAt)),
              attributes: {
                'agent.request_files.names': JSON.stringify(step.nextRequestedFiles),
                'agent.request_files.count': step.nextRequestedFiles.length
              }
            }
          ]
        : [])
    ],
    status: statusFromStep(step)
  }
}

const buildLlmSpans = (trace: AgentTrace, step: AgentTraceStep, traceId: string): OtelSpan[] =>
  step.llmCalls.map((call, index) => ({
    traceId,
    spanId: toSpanId(`${step.stepId}:llm:${index}`),
    parentSpanId: toSpanId(step.stepId),
    name: 'llm.call',
    kind: 'CLIENT',
    startTimeUnixNano: toUnixNano(call.startedAt),
    endTimeUnixNano: toUnixNano(safeEndTime(call.endedAt, call.startedAt)),
    attributes: {
      'langfuse.observation.type': 'generation',
      'langfuse.observation.input': stringifyForLangfuse({
        system: step.prompt.system,
        messages: step.prompt.messages
      }),
      'langfuse.observation.output': step.finalText ?? step.displayedText ?? '',
      'langfuse.observation.model.name': call.modelId ?? step.modelId ?? '',
      'llm.model.provider': call.provider ?? step.provider ?? '',
      'llm.model.name': call.modelId ?? step.modelId ?? '',
      'minstrel.step.id': step.stepId,
      'minstrel.step.index': step.index,
      'minstrel.streamed_text_length': step.streamedTextLength,
      'minstrel.tool_call_count': step.toolCalls.length
    },
    events: [],
    status: call.status === 'error' ? { code: 'ERROR', message: call.errorMessage } : { code: 'OK' }
  }))

const buildToolSpan = (step: AgentTraceStep, call: AgentTraceToolCall, index: number, traceId: string): OtelSpan => ({
  traceId,
  spanId: toSpanId(`${step.stepId}:tool:${index}:${call.toolName}`),
  parentSpanId: toSpanId(step.stepId),
  name: `tool.${call.toolName}`,
  kind: 'INTERNAL',
  startTimeUnixNano: toUnixNano(call.startedAt),
  endTimeUnixNano: toUnixNano(call.endedAt),
  attributes: {
    'tool.name': call.toolName,
    'langfuse.observation.input': stringifyForLangfuse(call.args),
    'langfuse.observation.output': stringifyForLangfuse(call.result),
    'tool.args_hash': hashString(summarizeObject(call.args)),
    'tool.result_hash': hashString(summarizeObject(call.result)),
    'tool.duration_ms': call.durationMs,
    'minstrel.step.id': step.stepId,
    'minstrel.step.index': step.index
  },
  events: [],
  status: statusFromTool(call)
})

export const convertAgentTraceToOtelSpans = (trace: AgentTrace): OtelSpan[] => {
  const traceId = toTraceId(trace.traceId)
  const rootSpan = buildRootSpan(trace, traceId)
  const stepSpans = trace.steps.map((step) => buildStepSpan(trace, step, traceId))
  const llmSpans = trace.steps.flatMap((step) => buildLlmSpans(trace, step, traceId))
  const toolSpans = trace.steps.flatMap((step) =>
    step.toolCalls.map((call, index) => buildToolSpan(step, call, index, traceId))
  )

  return [rootSpan, ...stepSpans, ...llmSpans, ...toolSpans]
}
