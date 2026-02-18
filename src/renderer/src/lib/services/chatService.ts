import geminiService from './llmService'
import { store } from '@/lib/store/store'
import { resolvePendingChat } from '@/lib/store/chatSlice'
import { setPendingFiles } from '@/lib/store/projectsSlice'
import { buildPrompt } from '@/lib/prompts/promptBuilder'
import { toast } from 'sonner'
import { RequestContext } from '@/types'
import {
  handleWriteFile,
  handleCritique,
  handleMessage,
  handleActionSuggestions
} from './toolHandlers'
import * as schemas from './toolSchemas'
import { tool } from 'ai'

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

      const prompt = buildPrompt(context)
      
      console.groupCollapsed(`Agent Loop - Step ${context.currentStep}: ${context.agent}`)
      console.log('Prompt:', prompt)
      console.groupEnd()

      // Inform Redux about pending files AI might be reading
      store.dispatch(setPendingFiles(context.requestedFiles || null))

      // Determine model preference based on agent type
      const modelPreference: 'high' | 'low' = 
        (context.agent === 'outlineAgent' || context.agent === 'writerAgent') ? 'high' : 'low'

      // Define local variables to capture state changes from tools
      let nextAgent: string | null = null
      let nextRequestedFiles: string[] | undefined = undefined

      // Tools definition for AI SDK
      const tools = {
        reasoning: tool({
          description: 'Think out your actions and plan the current step.',
          parameters: schemas.reasoningSchema,
          execute: async ({ thought }: any) => {
            console.log('AI Reasoning:', thought)
            return { status: 'success' }
          }
        } as any),
        writeFile: tool({
          description: 'Write content to a file.',
          parameters: schemas.writeFileSchema,
          execute: async ({ file_name, content }: any) => {
            handleWriteFile(file_name, content)
            return { status: 'success', file: file_name }
          }
        } as any),
        readFile: tool({
          description: 'Read the contents of specified files.',
          parameters: schemas.readFileSchema,
          execute: async ({ file_names }: any) => {
            nextRequestedFiles = file_names
            return { status: 'success', requested: file_names }
          }
        } as any),
        routeTo: tool({
          description: 'Route to a specialist agent.',
          parameters: schemas.routeToSchema,
          execute: async ({ agent }: any) => {
            nextAgent = agent
            return { status: 'success', target: agent }
          }
        } as any),
        actionSuggestion: tool({
          description: 'Provide suggestions for the user.',
          parameters: schemas.actionSuggestionSchema,
          execute: async ({ suggestions }: any) => {
            handleActionSuggestions(suggestions)
            return { status: 'success' }
          }
        } as any),
        showMessage: tool({
          description: 'Show a message to the user.',
          parameters: schemas.showMessageSchema,
          execute: async ({ message }: any) => {
            handleMessage(message)
            return { status: 'success' }
          }
        } as any),
        addCritique: tool({
          description: 'Submit a story critique.',
          parameters: schemas.addCritiqueSchema,
          execute: async ({ critique }: any) => {
            handleCritique(critique)
            return { status: 'success' }
          }
        } as any)
      }

      let result: any
      try {
        result = await geminiService.generateTextWithTools(prompt, tools, modelPreference)
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

      // The SDK's 'execute' functions already processed the tools. 
      // We just need to update our context for the next iteration.

      // Prepare context for next iteration
      const nextContext: RequestContext = {
        currentStep: context.currentStep + 1,
        agent: (nextAgent as any) || context.agent,
        requestedFiles: nextRequestedFiles || context.requestedFiles,
        // Carry over sequence info if present (though we might phase this out)
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
    // We'll use generateTextWithTools but expected a specific tool use.
    const tools = {
      actionSuggestion: tool({
        description: 'Provide suggestions for titles.',
        parameters: schemas.actionSuggestionSchema,
        execute: async () => ({ status: 'success' })
      } as any)
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
