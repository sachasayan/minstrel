import geminiService from './llmService'
import { resolvePendingChat } from '@/lib/store/chatSlice'
import { setPendingFiles } from '@/lib/store/projectsSlice'
import { buildPrompt } from '@/lib/prompts/promptBuilder'
import { PromptData } from '@/lib/prompts/types'
import { toast } from 'sonner'
import { RequestContext, AppSettings } from '@/types'
import { store } from '@/lib/store/store' // Kept only for dispatching, will move to UI later
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
export const sendMessage = async (initialContext: RequestContext, promptData: PromptData, settings: AppSettings) => {
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
      store.dispatch(setPendingFiles(context.requestedFiles || null))

      // Determine model preference based on agent type
      const modelPreference: 'high' | 'low' = 
        (context.agent === 'outlineAgent' || context.agent === 'writerAgent') ? 'high' : 'low'

      // Define local variables to capture state changes from tools
      let nextAgent: string | null = null
      let nextRequestedFiles: string[] | undefined = undefined

      // Tools definition using the registry
      const toolkit = createTools({
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
            // Relaxed regex to catch headers even with ID comments or different spacing
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
        
        // Tool state (nextAgent, nextRequestedFiles) is managed
        // by the internal execute() callbacks provided via createTools.
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
           handleMessage("I've updated the content as requested.");
        } else {
           handleMessage(finalText.trim());
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

      // Terminal condition: if no routing tool was used, we assume the task chain is finished 
      // OR if the agent routes specifically to routingAgent.
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
    handleMessage(`Hmm. Something went wrong, sorry. You might need to try again.`)
  } finally {
    if (!signal.aborted) {
      store.dispatch(setPendingFiles(null))
      store.dispatch(resolvePendingChat())
      if (currentAbortController?.signal === signal) {
        currentAbortController = null
      }
    }
    console.log('sendMessage() execution finished')
  }
}

/**
 * Specifically triggers the outline agent with initial parameters.
 */
export const generateOutlineFromParams = async (parameters: { [key: string]: any }): Promise<void> => {
  const context: RequestContext = {
    agent: 'outlineAgent',
    currentStep: -1, // Special trigger for the outline agent
    carriedContext: JSON.stringify(parameters, null, 2)
  }

  try {
    const state = store.getState()
    const promptData: PromptData = {
      activeProject: state.projects.activeProject,
      chatHistory: state.chat.chatHistory
    }
    await sendMessage(context, promptData, state.settings)
  } catch (error) {
    console.error('Failed to generate initial outline:', error)
    handleMessage(`Sorry, I encountered an error trying to generate the initial outline.`)
  } finally {
    store.dispatch(resolvePendingChat())
  }
}

/**
 * Generates book title suggestions. 
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

  try {
    // For title suggestions, we typically want a quick single-turn response.
    const toolkit = createTools()
    const tools = {
      actionSuggestion: toolkit.actionSuggestion
    }

    const state = store.getState()
    const result = await geminiService.generateTextWithTools(state.settings, prompt, '', tools, 'low')
    const suggestionCall = (result.toolCalls as any[]).find(tc => tc.toolName === 'actionSuggestion')
    
    return (suggestionCall?.args as any)?.suggestions || []
  } catch (error) {
    console.error('Failed to generate title suggestions:', error)
    toast.error('Failed to generate title suggestions. Please try entering one manually.')
    return []
  }
}
