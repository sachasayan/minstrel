import { tool } from 'ai'
import { z } from 'zod'
import geminiService from './llmService'
import { resolvePendingChat } from '@/lib/store/chatSlice'
import { setPendingFiles } from '@/lib/store/projectsSlice'
import { buildPrompt } from '@/lib/prompts/promptBuilder'
import { PromptData } from '@/lib/prompts/types'
import { toast } from 'sonner'
import { RequestContext, AppSettings } from '@/types'
import { AppDispatch, store } from '@/lib/store/store'
import {
  handleMessage,
} from './toolHandlers'
import { createTools } from './toolRegistry'
import { streamingService } from './streamingService'
import { agentTraceService } from './agentTraceService'
import { bridge } from '@/lib/bridge'

const DEBOUNCE_TIME = 5000 // 5 seconds
const MAX_STEPS = 6
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Tracks the current active agent loop to allow for interruption.
 */
let currentAbortController: AbortController | null = null
let currentRequestToken = 0

const getActiveProjectPath = (): string | null => store.getState().projects.activeProject?.projectPath ?? null
const isCurrentRequestToken = (requestToken: number): boolean => currentRequestToken === requestToken
const isRequestProjectActive = (requestToken: number, projectPath: string | null): boolean =>
  isCurrentRequestToken(requestToken) && getActiveProjectPath() === projectPath
const getUserMessageFromHistory = (promptData: PromptData, initialContext: RequestContext) =>
  [...promptData.chatHistory].reverse().find((message) => message.sender === 'User')?.text ?? initialContext.message
const getSelectedModelId = (
  settings: AppSettings,
  provider: string,
  modelPreference: 'high' | 'low'
) => {
  const explicitModelId =
    modelPreference === 'high' ? settings.highPreferenceModelId : settings.lowPreferenceModelId
  if (explicitModelId) return explicitModelId
  return typeof geminiService.getDefaultModelId === 'function'
    ? geminiService.getDefaultModelId(provider, modelPreference)
    : undefined
}

export const cancelActiveChatRequest = (reason = 'request canceled') => {
  if (!currentAbortController) return
  console.log(`[chatService] ${reason}`)
  currentAbortController.abort()
}

export const initializeGeminiService = () => {
  console.log('LLM service initialized with multi-provider support')
}

/**
 * Main entry point for sending a chat message.
 * Orchestrates multiple agents in an iterative loop.
 */
export const sendMessage = async (
  initialContext: RequestContext,
  promptData: PromptData,
  settings: AppSettings,
  dispatch: AppDispatch
) => {
  // Cancel any existing loop if a new message arrives
  if (currentAbortController) {
    console.log('Aborting previous agent loop...')
    currentAbortController.abort()
  }
  
  currentAbortController = new AbortController()
  const signal = currentAbortController.signal
  const requestToken = ++currentRequestToken
  const requestProjectPath = initialContext.projectPath ?? promptData.activeProject?.projectPath ?? null
  const traceId =
    initialContext.traceId ||
    agentTraceService.startTrace({
      requestToken,
      projectPath: requestProjectPath,
      initialAgent: initialContext.agent,
      currentStep: initialContext.currentStep || 0,
      userMessage: getUserMessageFromHistory(promptData, initialContext)
    })
  let traceStatus: 'completed' | 'aborted' | 'stale_project' | 'error' | 'max_steps' = 'completed'
  let traceErrorMessage: string | undefined
  let inactiveReason: 'aborted' | 'stale_project' = 'aborted'

  const dispatchIfCurrent = (action: Parameters<AppDispatch>[0]) => {
    if (!isCurrentRequestToken(requestToken)) {
      return action
    }
    return dispatch(action)
  }

  const dispatchIfProjectActive = (action: Parameters<AppDispatch>[0]) => {
    if (!isRequestProjectActive(requestToken, requestProjectPath)) {
      console.warn('[chatService] Dropping side effect for stale project-bound request.')
      return action
    }
    return dispatch(action)
  }

  const requestStillActive = () => {
    if (signal.aborted) return false
    if (isRequestProjectActive(requestToken, requestProjectPath)) return true
    if (isCurrentRequestToken(requestToken)) {
      console.log('[chatService] Active project changed; discarding pending response.')
      inactiveReason = 'stale_project'
      traceStatus = 'stale_project'
      agentTraceService.addEvent(traceId, 'project_switched', {
        requestToken,
        projectPath: requestProjectPath
      })
      currentAbortController?.abort()
    }
    return false
  }

  let context: RequestContext = {
    ...initialContext,
    currentStep: initialContext.currentStep || 0,
    projectPath: requestProjectPath,
    traceId
  }

  try {
    while (context.currentStep < MAX_STEPS) {
      if (!requestStillActive()) break

      // Re-read live state every loop iteration so prompts/tools see latest edits and chat.
      const latestState = store.getState()
      const livePromptData: PromptData = {
        activeProject: latestState.projects.activeProject ?? promptData.activeProject,
        chatHistory: latestState.chat.chatHistory ?? promptData.chatHistory
      }
      const liveSettings: AppSettings = latestState.settings ?? settings

      const { system, messages, allowedTools, metadata } = buildPrompt(context, livePromptData, liveSettings)

      // Inform Redux about pending files AI might be reading
      dispatchIfCurrent(setPendingFiles(context.requestedFiles || null))

      // Determine model preference based on agent type
      const modelPreference: 'high' | 'low' = 
        context.agent === 'writerAgent' ? 'high' : 'low'
      const provider = liveSettings.provider || 'google'
      const selectedModelId = getSelectedModelId(liveSettings, provider, modelPreference)
      const stepId = agentTraceService.startStep(traceId, {
        index: context.currentStep,
        agent: context.agent,
        requestedFiles: context.requestedFiles,
        allowedTools,
        modelPreference,
        provider,
        modelId: selectedModelId,
        prompt: {
          system,
          messages,
          metadata
        }
      })
      agentTraceService.addEvent(traceId, 'step_started', {
        stepIndex: context.currentStep,
        agent: context.agent,
        requestedFiles: context.requestedFiles ?? [],
        allowedTools,
        provider,
        modelId: selectedModelId
      })

      // Define local variables to capture state changes from tools
      let nextAgent: string | null = null
      let nextRequestedFiles: string[] | undefined = undefined

      // Tools definition using the registry
      const toolkit = createTools({
        dispatch: dispatchIfProjectActive as AppDispatch,
        activeProject: livePromptData.activeProject,
        onReadFile: (fileNames) => {
          if (!requestStillActive()) return
          nextRequestedFiles = fileNames
        },
        onRouteTo: (agent) => {
          if (!requestStillActive()) return
          nextAgent = agent
        },
        onToolCall: (event) => {
          agentTraceService.addToolCall(traceId, stepId, event)
        }
      })

      // Filter tools to only include those allowed for the current agent
      const activeTools = Object.fromEntries(
        Object.entries(toolkit).filter(([name]) => allowedTools.includes(name))
      )

      let finalText = ''
      let finalCalls: any[] = []
      try {
        agentTraceService.startLlmCall(traceId, stepId, provider, selectedModelId)
        const stream = await geminiService.streamTextWithTools(
          liveSettings,
          system,
          messages,
          activeTools,
          modelPreference
        )
        
        if (!requestStillActive()) break
        streamingService.updateStatus('Minstrel is thinking...')

        // Handle tool calls as they are being identified
        const toolCallsPromise = stream.toolCalls
        if (toolCallsPromise) {
          toolCallsPromise.then((calls) => {
            if (!isRequestProjectActive(requestToken, requestProjectPath)) return
            calls.forEach((call) => {
              if (call.toolName === 'writeFile') {
                streamingService.updateStatus(`Writing ${(call as any).args?.file_name}...`)
              }
            })
          })
        }

        // Stream the actual text content if it's a message
        for await (const textPart of stream.textStream) {
          if (!requestStillActive()) {
            streamingService.clear()
            break
          }
          finalText += textPart
          agentTraceService.appendStreamText(traceId, stepId, textPart)
          
          // Heuristic: if we already see large content that looks like a file write, stop streaming text to UI
          const hasHeading = /^#\s+.+/m.test(finalText) || finalText.includes('## Synopsis');
          const isWritingLargeContent = (finalText.length > 500 && hasHeading);
          const isLikelyInternalTask = context.agent === 'writerAgent';
          
          if (isWritingLargeContent && isLikelyInternalTask) {
             streamingService.updateText("Writing changes to story...")
          } else {
             streamingService.updateText(finalText)
          }
        }

        // Wait for the text stream to finish
        try {
          finalText = (await stream.text) || finalText
        } catch {
          // Fallback to accumulated finalText
        }

        // Wait for tool calls to resolve
        try {
          finalCalls = (await stream.toolCalls) || []
        } catch {
          finalCalls = []
        }
        agentTraceService.finishLlmCall(traceId, stepId, { status: 'success' })
        
      } catch (error: any) {
        agentTraceService.finishLlmCall(traceId, stepId, {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error)
        })
        if (signal.aborted) break
        if (!requestStillActive()) break

        if (error.message?.includes('resource exhausted')) {
          console.warn('Resource exhausted, debouncing...')
          agentTraceService.addEvent(traceId, 'llm_retry', {
            stepIndex: context.currentStep,
            reason: 'resource_exhausted'
          })
          agentTraceService.finishStep(traceId, stepId, {
            status: 'retry',
            finalText
          })
          await sleep(DEBOUNCE_TIME)
          continue // Retry the same step
        }
        agentTraceService.finishStep(traceId, stepId, {
          status: 'error',
          finalText
        })
        throw error
      }

      if (!requestStillActive()) {
        agentTraceService.finishStep(traceId, stepId, {
          status: 'aborted',
          finalText
        })
        break
      }

      let displayedText: string | undefined
      let outputSuppressed = false
      if (finalText && finalText.trim().length > 0) {
        // Prevent leaking giant edits into chat if a tool call already handled it
        const wasWriteAction = finalCalls.some(c => c.toolName === 'writeFile' || c.toolName === 'updateChapter');
        const isVeryLarge = finalText.length > 1000;
        
        if (wasWriteAction && isVeryLarge) {
           console.log('Skipping chat message addition as it looks like a redundant large file write.');
           displayedText = "I've updated the content as requested."
           outputSuppressed = true
           handleMessage(displayedText, dispatchIfProjectActive as AppDispatch);
        } else {
           displayedText = finalText.trim()
           handleMessage(displayedText, dispatchIfProjectActive as AppDispatch);
        }
      }

      // Clear streaming state after each step
      streamingService.clear()

      // Prepare context for next iteration
      const nextContext: RequestContext = {
        currentStep: context.currentStep + 1,
        agent: (nextAgent as any) || context.agent,
        requestedFiles: nextRequestedFiles || context.requestedFiles,
        sequenceInfo: context.sequenceInfo
      }

      // Defensive: warn if readFile was called without a routeTo in the same turn
      if (nextRequestedFiles && !nextAgent) {
        console.warn('[chatService] readFile called without routeTo — loop will stall. Files requested:', nextRequestedFiles)
        agentTraceService.addEvent(traceId, 'read_without_route', {
          stepIndex: context.currentStep,
          requestedFiles: nextRequestedFiles
        })
      }

      agentTraceService.finishStep(traceId, stepId, {
        status: 'completed',
        finalText,
        displayedText,
        outputSuppressed,
        nextAgent,
        nextRequestedFiles
      })

      // Terminal condition: if no routing tool was used, the task chain is finished
      if (!nextAgent) {
        break
      }

      context = nextContext
    }

    if (context.currentStep >= MAX_STEPS && !signal.aborted) {
      const errorMsg = 'Recursion depth exceeded in agent loop.'
      console.error(errorMsg)
      toast.error(errorMsg)
      traceStatus = 'max_steps'
      traceErrorMessage = errorMsg
    }

  } catch (error) {
    if (signal.aborted) {
      traceStatus = inactiveReason
      return
    }

    console.error('Failed to send chat message:', error)
    traceStatus = 'error'
    traceErrorMessage = error instanceof Error ? error.message : String(error)
    handleMessage(`Hmm. Something went wrong, sorry. You might need to try again.`, dispatchIfProjectActive as AppDispatch)
  } finally {
    // Always clean up, regardless of abort status, to prevent stuck loading state
    if (isCurrentRequestToken(requestToken)) {
      dispatch(setPendingFiles(null))
      dispatch(resolvePendingChat())
    }
    
    if (isCurrentRequestToken(requestToken) && currentAbortController?.signal === signal) {
      currentAbortController = null
    }
    if (signal.aborted && traceStatus === 'completed') {
      traceStatus = inactiveReason
    }
    agentTraceService.finishTrace(traceId, {
      status: traceStatus,
      errorMessage: traceErrorMessage
    })
    try {
      const spans = agentTraceService.getOtelSpans(traceId)
      await bridge.exportAgentTrace(spans)
    } catch (error) {
      console.warn('[chatService] Failed to hand trace export to main process.', error)
    }
    console.log('sendMessage() execution finished')
  }
}

/**
 * Generates book title suggestions.
 * Uses an inline tool definition so no Redux dispatch side-effects occur —
 * the result is returned directly as a value.
 */
export const generateTitleSuggestions = async (plotSummary: string, genre: string, setting: string): Promise<string[]> => {
  const prompt = `
You are an expert book title generator. Based on the following details, generate approximately 12 diverse and compelling book title suggestions.

Genre: ${genre || 'Not specified'}
Setting: ${setting || 'Not specified'}
Plot Summary:
${plotSummary}

Return the suggestions as action suggestions.
  `.trim()

  // Minimal inline tool — no dispatch, no side-effects; we just read the raw args back.
  const suggestionTool = tool({
    description: 'Provide title suggestions for the user.',
    inputSchema: z.object({ suggestions: z.string().describe('Comma-separated list of title suggestions') }),
    execute: async ({ suggestions }) => {
      console.log('Title suggestions tool executed with:', suggestions)
      return { status: 'success' }
    }
  })

  try {
    const state = store.getState()
    const result = await geminiService.generateTextWithTools(
      state.settings,
      prompt,
      '',
      { actionSuggestion: suggestionTool },
      'low'
    )
    const suggestionCall = (result.toolCalls as any[]).find(tc => tc.toolName === 'actionSuggestion')
    const raw = (suggestionCall?.args as any)?.suggestions ?? ''
    return typeof raw === 'string'
      ? raw.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(raw) ? raw : []
  } catch (error) {
    console.error('Failed to generate title suggestions:', error)
    toast.error('Failed to generate title suggestions. Please try entering one manually.')
    return []
  }
}
