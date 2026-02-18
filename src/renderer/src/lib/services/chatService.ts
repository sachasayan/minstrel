import geminiService from './llmService'
import { store } from '@/lib/store/store'
import { resolvePendingChat } from '@/lib/store/chatSlice'
import { setPendingFiles } from '@/lib/store/projectsSlice'
import { buildPrompt } from '@/lib/prompts/promptBuilder'
import { toast } from 'sonner'
import { RequestContext } from '@/types'
import { parseLLMResponse } from './llmParser'
import {
  handleWriteFile,
  handleCritique,
  handleMessage,
  handleActionSuggestions
} from './toolHandlers'

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

      let response: string
      try {
        response = await geminiService.generateContent(prompt, modelPreference)
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
      console.log(response)
      console.groupEnd()

      const parsed = parseLLMResponse(response)
      if (!parsed) {
        throw new Error('Failed to parse AI response into expected XML format.')
      }

      // Execute side-effects (Tools)
      if (parsed.tools.writeFile) {
        handleWriteFile(parsed.tools.writeFile.file_name, parsed.tools.writeFile.content)
      }
      if (parsed.tools.critique) {
        handleCritique(parsed.tools.critique)
      }
      if (parsed.tools.message) {
        handleMessage(parsed.tools.message)
      }
      handleActionSuggestions(parsed.tools.actionSuggestions)

      // Prepare context for next iteration
      const nextContext: RequestContext = {
        ...parsed.context,
        currentStep: context.currentStep + 1,
        // Carry over sequence info if present
        sequenceInfo: parsed.context.sequenceInfo || context.sequenceInfo
      }

      // Terminal condition: if the AI routes back to the routingAgent, it has finished its current task chain
      if (parsed.context.agent === 'routingAgent') {
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
    // We reuse sendMessage for the orchestration loop
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
 * Note: This uses a simplified direct path as it's a UI-blocking synchronous-feeling operation.
 */
export const generateTitleSuggestions = async (plotSummary: string, genre: string, setting: string): Promise<string[]> => {
  const prompt = `
You are an expert book title generator. Based on the following details, generate approximately 12 diverse and compelling book title suggestions.

Genre: ${genre || 'Not specified'}
Setting: ${setting || 'Not specified'}
Plot Summary:
${plotSummary}

Return the suggestions ONLY within the following XML structure:
<titles>
  <title>Suggestion 1</title>
  <title>Suggestion 2</title>
  ...
</titles>
Do not include any other text or explanation outside the <titles> tag.
  `.trim()

  try {
    const responseString = await geminiService.generateContent(prompt, 'low')
    const parsed = parseLLMResponse(responseString)
    
    return parsed?.tools.actionSuggestions || []
  } catch (error) {
    console.error('Failed to generate title suggestions:', error)
    toast.error('Failed to generate title suggestions. Please try entering one manually.')
    return []
  }
}
