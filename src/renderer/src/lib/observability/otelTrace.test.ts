import { describe, expect, it } from 'vitest'
import { convertAgentTraceToOtelSpans } from './otelTrace'
import { AgentTrace } from '@/lib/services/agentTraceService'

describe('otelTrace', () => {
  it('converts a trace into root, step, llm, and tool spans', () => {
    const trace: AgentTrace = {
      traceId: 'trace_abc123',
      requestToken: 7,
      projectPath: '/projects/test.mns',
      startedAt: '2026-03-10T10:00:00.000Z',
      endedAt: '2026-03-10T10:00:05.000Z',
      status: 'completed',
      initialAgent: 'routingAgent',
      currentStep: 0,
      userMessage: 'Draft chapter one',
      errorMessage: undefined,
      events: [
        {
          timestamp: '2026-03-10T10:00:01.000Z',
          type: 'step_started',
          data: { stepIndex: 0, agent: 'routingAgent' }
        }
      ],
      steps: [
        {
          stepId: 'step_one',
          index: 0,
          agent: 'routingAgent',
          startedAt: '2026-03-10T10:00:00.500Z',
          endedAt: '2026-03-10T10:00:02.000Z',
          status: 'completed',
          requestedFiles: ['Outline'],
          allowedTools: ['readFile', 'routeTo'],
          modelPreference: 'low',
          provider: 'google',
          modelId: 'gemini-test',
          prompt: {
            system: 'system prompt',
            messages: [{ role: 'user', content: 'Draft chapter one' }],
            metadata: {
              agent: 'routingAgent',
              availableFiles: ['Outline', 'Chapter 1'],
              providedFiles: ['Outline'],
              sectionMetadata: [
                {
                  key: 'basePrompt',
                  title: 'BASE PROMPT',
                  contentLength: 100,
                  hash: 'fnv1a:11111111'
                }
              ],
              systemLength: 1000,
              systemHash: 'fnv1a:22222222',
              messageCount: 1,
              messageHash: 'fnv1a:33333333',
              syntheticContinueMessage: false
            }
          },
          streamedTextLength: 12,
          finalText: 'Routing complete',
          displayedText: 'Routing complete',
          outputSuppressed: false,
          nextAgent: 'writerAgent',
          nextRequestedFiles: ['Outline', 'Chapter 1'],
          llmCalls: [
            {
              provider: 'google',
              modelId: 'gemini-test',
              startedAt: '2026-03-10T10:00:00.700Z',
              endedAt: '2026-03-10T10:00:01.800Z',
              durationMs: 1100,
              status: 'success'
            }
          ],
          toolCalls: [
            {
              toolName: 'routeTo',
              args: { agent: 'writerAgent' },
              result: { status: 'success', target: 'writerAgent' },
              startedAt: '2026-03-10T10:00:01.000Z',
              endedAt: '2026-03-10T10:00:01.050Z',
              durationMs: 50,
              status: 'success'
            }
          ]
        }
      ]
    }

    const spans = convertAgentTraceToOtelSpans(trace)

    expect(spans).toHaveLength(4)
    expect(spans[0]?.name).toBe('agent.run.routingAgent')
    expect(spans[0]?.events[0]?.name).toBe('step_started')
    expect(spans[0]?.attributes['langfuse.trace.input']).toBe('Draft chapter one')
    expect(spans[0]?.attributes['langfuse.trace.output']).toBe('Routing complete')

    const stepSpan = spans.find((span) => span.name === 'agent.step.routingAgent')
    expect(stepSpan?.attributes['minstrel.prompt.system_hash']).toBe('fnv1a:22222222')
    expect(stepSpan?.attributes['langfuse.observation.input']).toContain('system prompt')
    expect(stepSpan?.attributes['langfuse.observation.output']).toContain('Routing complete')
    expect(stepSpan?.events.some((event) => event.name === 'agent.route')).toBe(true)

    const llmSpan = spans.find((span) => span.name === 'llm.call')
    expect(llmSpan?.attributes['llm.model.name']).toBe('gemini-test')
    expect(llmSpan?.attributes['langfuse.observation.type']).toBe('generation')

    const toolSpan = spans.find((span) => span.name === 'tool.routeTo')
    expect(toolSpan?.attributes['tool.name']).toBe('routeTo')
    expect(toolSpan?.attributes['langfuse.observation.input']).toContain('writerAgent')
    expect(toolSpan?.status.code).toBe('OK')
  })

  it('marks error traces and spans with error status', () => {
    const trace: AgentTrace = {
      traceId: 'trace_error',
      requestToken: 8,
      projectPath: null,
      startedAt: '2026-03-10T11:00:00.000Z',
      endedAt: '2026-03-10T11:00:03.000Z',
      status: 'error',
      initialAgent: 'writerAgent',
      currentStep: 0,
      userMessage: 'Rewrite the chapter',
      errorMessage: 'provider failure',
      events: [],
      steps: [
        {
          stepId: 'step_error',
          index: 0,
          agent: 'writerAgent',
          startedAt: '2026-03-10T11:00:00.100Z',
          endedAt: '2026-03-10T11:00:02.000Z',
          status: 'error',
          requestedFiles: [],
          allowedTools: ['writeFile'],
          modelPreference: 'high',
          provider: 'openai',
          modelId: 'gpt-test',
          prompt: {
            system: 'system',
            messages: [{ role: 'user', content: 'Rewrite the chapter' }],
            metadata: {
              agent: 'writerAgent',
              availableFiles: [],
              providedFiles: [],
              sectionMetadata: [],
              systemLength: 6,
              systemHash: 'fnv1a:aaaa1111',
              messageCount: 1,
              messageHash: 'fnv1a:bbbb2222',
              syntheticContinueMessage: false
            }
          },
          streamedTextLength: 0,
          finalText: '',
          displayedText: '',
          outputSuppressed: false,
          llmCalls: [
            {
              provider: 'openai',
              modelId: 'gpt-test',
              startedAt: '2026-03-10T11:00:00.500Z',
              endedAt: '2026-03-10T11:00:01.000Z',
              durationMs: 500,
              status: 'error',
              errorMessage: 'timeout'
            }
          ],
          toolCalls: []
        }
      ]
    }

    const spans = convertAgentTraceToOtelSpans(trace)

    expect(spans[0]?.status.code).toBe('ERROR')
    expect(spans.find((span) => span.name === 'agent.step.writerAgent')?.status.code).toBe('ERROR')
    expect(spans.find((span) => span.name === 'llm.call')?.status.code).toBe('ERROR')
  })
})
