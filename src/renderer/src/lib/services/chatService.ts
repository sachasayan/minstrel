import geminiService from './llmService'
import { store } from '@/lib/store/store'
import { resolvePendingChat } from '@/lib/store/chatSlice'
import { setPendingFiles } from '@/lib/store/projectsSlice'
import { buildPrompt } from '@/lib/prompts/promptBuilder'
import { PromptData } from '@/lib/prompts/types'
import { toast } from 'sonner'
import { RequestContext } from '@/types'
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
export const sendMessage = async (initialContext: RequestContext) => {
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

      // Extract state for the prompt builder
      const state = store.getState()
      const promptData: PromptData = {
        activeProject: state.projects.activeProject,
        chatHistory: state.chat.chatHistory
      }

      const { prompt, allowedTools } = buildPrompt(context, promptData)
      
      console.groupCollapsed(`Agent Loop - Step ${context.currentStep}: ${context.agent}`)
      console.log('Prompt:', prompt)
      console.log('Allowed Tools:', allowedTools)
      console.groupEnd()

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

      let result: any
      try {
        const stream = await geminiService.streamTextWithTools(prompt, activeTools, modelPreference)
        
        // Handle tool calls as they are being identified
        const toolCallsPromise = stream.toolCalls
        if (toolCallsPromise) {
          toolCallsPromise.then(calls => {
             calls.forEach(call => {
                if (call.toolName === 'writeFile') {
                  streamingService.updateStatus(`Writing ${(call as any).args.file_name}...`)
                } else if (call.toolName === 'reasoning') {
                  streamingService.updateStatus('Minstrel is thinking...')
                }
             })
          })
        }

        // Stream the actual text content if it's a message
        let fullText = ''
        for await (const textPart of stream.textStream) {
          if (signal.aborted) {
            streamingService.clear()
            break
          }
          fullText += textPart
          streamingService.updateText(fullText)
        }

        // Wait for all tool executions to finish
        result = await stream

        // Update context based on tool calls
        const calls = await (result.toolCalls || Promise.resolve([]))
        calls?.forEach((call: any) => {
          if (call.toolName === 'routeTo') nextAgent = call.args.agent
          if (call.toolName === 'readFile') nextRequestedFiles = call.args.file_names
        })
        
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

      console.groupCollapsed(`AI Response - Step ${context.currentStep}`)
      console.log('Text:', result.text)
      console.log('Tool Calls:', result.toolCalls)
      console.groupEnd()

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
    await sendMessage(context)
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

    const result = await geminiService.generateTextWithTools(prompt, tools, 'low')
    const suggestionCall = (result.toolCalls as any[]).find(tc => tc.toolName === 'actionSuggestion')
    
    return (suggestionCall?.args as any)?.suggestions || []
  } catch (error) {
    console.error('Failed to generate title suggestions:', error)
    toast.error('Failed to generate title suggestions. Please try entering one manually.')
    return []
  }
}
