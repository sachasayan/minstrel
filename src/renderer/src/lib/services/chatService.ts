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

const DEBOUNCE_TIME = 5000 // 5 seconds
const MAX_STEPS = 6
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Tracks the current active agent loop to allow for interruption.
 */
let currentAbortController: AbortController | null = null

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

  let context: RequestContext = {
    ...initialContext,
    currentStep: initialContext.currentStep || 0
  }

  try {
    while (context.currentStep < MAX_STEPS) {
      if (signal.aborted) break

      const { system, userPrompt, allowedTools } = buildPrompt(context, promptData)

      // Inform Redux about pending files AI might be reading
      dispatch(setPendingFiles(context.requestedFiles || null))

      // Determine model preference based on agent type
      const modelPreference: 'high' | 'low' = 
        (context.agent === 'outlineAgent' || context.agent === 'writerAgent') ? 'high' : 'low'

      // Define local variables to capture state changes from tools
      let nextAgent: string | null = null
      let nextRequestedFiles: string[] | undefined = undefined

      // Tools definition using the registry
      const toolkit = createTools({
        dispatch,
        activeProject: promptData.activeProject,
        onReadFile: (fileNames) => {
          nextRequestedFiles = fileNames
        },
        onRouteTo: (agent) => {
          nextAgent = agent
        }
      })

      // Filter tools to only include those allowed for the current agent
      const activeTools = Object.fromEntries(
        Object.entries(toolkit).filter(([name]) => allowedTools.includes(name))
      )

      let finalText = ''
      let finalCalls: any[] = []
      try {
        const stream = await geminiService.streamTextWithTools(settings, system, userPrompt, activeTools, modelPreference)
        
        streamingService.updateStatus('Minstrel is thinking...')

        // Handle tool calls as they are being identified
        const toolCallsPromise = stream.toolCalls
        if (toolCallsPromise) {
          toolCallsPromise.then((calls) => {
            calls.forEach((call) => {
              if (call.toolName === 'writeFile') {
                streamingService.updateStatus(`Writing ${(call as any).args?.file_name}...`)
              }
            })
          })
        }

        // Stream the actual text content if it's a message
        for await (const textPart of stream.textStream) {
          if (signal.aborted) {
            streamingService.clear()
            break
          }
          finalText += textPart
          
          // Heuristic: if we already see large content that looks like a file write, stop streaming text to UI
          const hasHeading = /^#\s+.+/m.test(finalText) || finalText.includes('## Synopsis');
          const isWritingLargeContent = (finalText.length > 500 && hasHeading);
          const isLikelyInternalTask = context.agent === 'writerAgent' || context.agent === 'outlineAgent';
          
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
        
      } catch (error: any) {
        if (signal.aborted) break

        if (error.message?.includes('resource exhausted')) {
          console.warn('Resource exhausted, debouncing...')
          await sleep(DEBOUNCE_TIME)
          continue // Retry the same step
        }
        throw error
      }

      if (signal.aborted) break

      if (finalText && finalText.trim().length > 0) {
        // Prevent leaking giant edits into chat if a tool call already handled it
        const wasWriteAction = finalCalls.some(c => c.toolName === 'writeFile' || c.toolName === 'updateChapter');
        const isVeryLarge = finalText.length > 1000;
        
        if (wasWriteAction && isVeryLarge) {
           console.log('Skipping chat message addition as it looks like a redundant large file write.');
           handleMessage("I've updated the content as requested.", dispatch);
        } else {
           handleMessage(finalText.trim(), dispatch);
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

      // Terminal condition: if no routing tool was used, the task chain is finished
      if (!nextAgent || nextAgent === 'routingAgent') {
        break
      }

      context = nextContext
    }

    if (context.currentStep >= MAX_STEPS && !signal.aborted) {
      const errorMsg = 'Recursion depth exceeded in agent loop.'
      console.error(errorMsg)
      toast.error(errorMsg)
    }

  } catch (error) {
    if (signal.aborted) return

    console.error('Failed to send chat message:', error)
    handleMessage(`Hmm. Something went wrong, sorry. You might need to try again.`, dispatch)
  } finally {
    // Always clean up, regardless of abort status, to prevent stuck loading state
    dispatch(setPendingFiles(null))
    dispatch(resolvePendingChat())
    if (currentAbortController?.signal === signal) {
      currentAbortController = null
    }
    console.log('sendMessage() execution finished')
  }
}

/**
 * Specifically triggers the outline agent with initial parameters.
 * Accepts promptData and settings directly so it has no store dependency.
 */
export const generateOutlineFromParams = async (
  parameters: Record<string, unknown>,
  promptData: PromptData,
  settings: AppSettings,
  dispatch: AppDispatch
): Promise<void> => {
  const context: RequestContext = {
    agent: 'outlineAgent',
    currentStep: -1, // Special trigger for the outline agent
    carriedContext: JSON.stringify(parameters, null, 2)
  }

  try {
    await sendMessage(context, promptData, settings, dispatch)
  } catch (error) {
    console.error('Failed to generate initial outline:', error)
    handleMessage(`Sorry, I encountered an error trying to generate the initial outline.`, dispatch)
  } finally {
    dispatch(resolvePendingChat())
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
    parameters: z.object({ suggestions: z.string().describe('Comma-separated list of title suggestions') }),
    execute: async () => ({ status: 'success' })
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
