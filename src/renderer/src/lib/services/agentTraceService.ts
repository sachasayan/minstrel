import { ModelMessage } from 'ai'
import { BuildPromptMetadata } from '@/lib/prompts/types'
import { hashString } from '@/lib/observability/hash'
import { convertAgentTraceToOtelSpans } from '@/lib/observability/otelTrace'
import type { OtelSpan } from '@shared/observability'

const STORAGE_KEY = 'minstrel.agentTraces.v1'
const MAX_TRACES = 50

export type AgentTraceStatus = 'running' | 'completed' | 'aborted' | 'stale_project' | 'error' | 'max_steps'
export type AgentTraceStepStatus = 'running' | 'completed' | 'retry' | 'aborted' | 'error'

export interface AgentTraceEvent {
  timestamp: string
  type: string
  data?: Record<string, unknown>
}

export interface AgentTraceToolCall {
  toolName: string
  args: unknown
  result?: unknown
  startedAt: string
  endedAt: string
  durationMs: number
  status: 'success' | 'error'
  errorMessage?: string
}

export interface AgentTracePromptSnapshot {
  system: string
  messages: ModelMessage[]
  metadata: BuildPromptMetadata
}

export interface AgentTraceStep {
  stepId: string
  index: number
  agent: 'storyAgent'
  startedAt: string
  endedAt?: string
  status: AgentTraceStepStatus
  requestedFiles?: string[]
  allowedTools: string[]
  modelPreference: 'high' | 'low'
  provider?: string
  modelId?: string
  prompt: AgentTracePromptSnapshot
  streamedTextLength: number
  finalText?: string
  displayedText?: string
  outputSuppressed: boolean
  toolCalls: AgentTraceToolCall[]
  llmCalls: Array<{
    provider?: string
    modelId?: string
    startedAt: string
    endedAt?: string
    durationMs?: number
    status: 'running' | 'success' | 'error'
    errorMessage?: string
  }>
  nextAgent?: string | null
  nextRequestedFiles?: string[]
}

export interface AgentTrace {
  traceId: string
  requestToken: number
  projectPath: string | null
  startedAt: string
  endedAt?: string
  status: AgentTraceStatus
  initialAgent: 'storyAgent'
  currentStep: number
  userMessage?: string
  events: AgentTraceEvent[]
  steps: AgentTraceStep[]
  errorMessage?: string
}

const nowIso = () => new Date().toISOString()

const safeLocalStorage = () => {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return null
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

class AgentTraceService {
  private traces: AgentTrace[] = []
  private listeners = new Set<() => void>()

  constructor() {
    this.traces = this.load()
  }

  private load(): AgentTrace[] {
    const storage = safeLocalStorage()
    if (!storage) return []

    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  private persist() {
    const storage = safeLocalStorage()
    if (!storage) return

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(this.traces))
    } catch {
      // Ignore persistence failures in the first iteration.
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  private updateTrace(traceId: string, updater: (trace: AgentTrace) => void) {
    const trace = this.traces.find((item) => item.traceId === traceId)
    if (!trace) return
    updater(trace)
    this.persist()
    this.notify()
  }

  startTrace(input: {
    requestToken: number
    projectPath: string | null
    initialAgent: 'storyAgent'
    currentStep: number
    userMessage?: string
  }) {
    const trace: AgentTrace = {
      traceId: makeId('trace'),
      requestToken: input.requestToken,
      projectPath: input.projectPath,
      startedAt: nowIso(),
      status: 'running',
      initialAgent: input.initialAgent,
      currentStep: input.currentStep,
      userMessage: input.userMessage,
      events: [],
      steps: []
    }

    this.traces = [trace, ...this.traces].slice(0, MAX_TRACES)
    this.persist()
    this.notify()
    return trace.traceId
  }

  addEvent(traceId: string, type: string, data?: Record<string, unknown>) {
    this.updateTrace(traceId, (trace) => {
      trace.events.push({ timestamp: nowIso(), type, data })
    })
  }

  startStep(
    traceId: string,
    input: {
      index: number
      agent: 'storyAgent'
      requestedFiles?: string[]
      allowedTools: string[]
      modelPreference: 'high' | 'low'
      provider?: string
      modelId?: string
      prompt: AgentTracePromptSnapshot
    }
  ) {
    const stepId = makeId('step')
    this.updateTrace(traceId, (trace) => {
      trace.steps.push({
        stepId,
        index: input.index,
        agent: input.agent,
        startedAt: nowIso(),
        status: 'running',
        requestedFiles: input.requestedFiles,
        allowedTools: input.allowedTools,
        modelPreference: input.modelPreference,
        provider: input.provider,
        modelId: input.modelId,
        prompt: input.prompt,
        streamedTextLength: 0,
        outputSuppressed: false,
        toolCalls: [],
        llmCalls: []
      })
    })
    return stepId
  }

  startLlmCall(traceId: string, stepId: string, provider?: string, modelId?: string) {
    this.updateTrace(traceId, (trace) => {
      const step = trace.steps.find((item) => item.stepId === stepId)
      if (!step) return
      step.llmCalls.push({
        provider,
        modelId,
        startedAt: nowIso(),
        status: 'running'
      })
    })
  }

  finishLlmCall(traceId: string, stepId: string, input: { status: 'success' | 'error'; errorMessage?: string }) {
    this.updateTrace(traceId, (trace) => {
      const step = trace.steps.find((item) => item.stepId === stepId)
      const llmCall = step?.llmCalls[step.llmCalls.length - 1]
      if (!llmCall) return
      const endedAt = nowIso()
      llmCall.endedAt = endedAt
      llmCall.durationMs = Math.max(0, new Date(endedAt).getTime() - new Date(llmCall.startedAt).getTime())
      llmCall.status = input.status
      llmCall.errorMessage = input.errorMessage
    })
  }

  appendStreamText(traceId: string, stepId: string, textPart: string) {
    this.updateTrace(traceId, (trace) => {
      const step = trace.steps.find((item) => item.stepId === stepId)
      if (!step) return
      step.streamedTextLength += textPart.length
    })
  }

  addToolCall(traceId: string, stepId: string, call: AgentTraceToolCall) {
    this.updateTrace(traceId, (trace) => {
      const step = trace.steps.find((item) => item.stepId === stepId)
      if (!step) return
      step.toolCalls.push(call)
    })
  }

  finishStep(
    traceId: string,
    stepId: string,
    input: {
      status: AgentTraceStepStatus
      finalText?: string
      displayedText?: string
      outputSuppressed?: boolean
      nextAgent?: string | null
      nextRequestedFiles?: string[]
    }
  ) {
    this.updateTrace(traceId, (trace) => {
      const step = trace.steps.find((item) => item.stepId === stepId)
      if (!step) return
      step.endedAt = nowIso()
      step.status = input.status
      step.finalText = input.finalText
      step.displayedText = input.displayedText
      step.outputSuppressed = input.outputSuppressed ?? step.outputSuppressed
      step.nextAgent = input.nextAgent
      step.nextRequestedFiles = input.nextRequestedFiles
    })
  }

  finishTrace(traceId: string, input: { status: AgentTraceStatus; errorMessage?: string }) {
    this.updateTrace(traceId, (trace) => {
      trace.endedAt = nowIso()
      trace.status = input.status
      trace.errorMessage = input.errorMessage
      trace.steps.forEach((step) => {
        if (step.status === 'running') {
          step.status = input.status === 'error' ? 'error' : input.status === 'completed' ? 'completed' : 'aborted'
          step.endedAt = trace.endedAt
        }
      })
    })
  }

  getRecentTraces() {
    return this.traces
  }

  getTrace(traceId: string) {
    return this.traces.find((trace) => trace.traceId === traceId)
  }

  getOtelSpans(traceId: string): OtelSpan[] {
    const trace = this.getTrace(traceId)
    return trace ? convertAgentTraceToOtelSpans(trace) : []
  }

  clear() {
    this.traces = []
    this.persist()
    this.notify()
  }

  summarizeMessages(messages: ModelMessage[]) {
    return {
      count: messages.length,
      hash: hashString(JSON.stringify(messages))
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

export const agentTraceService = new AgentTraceService()
