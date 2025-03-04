import geminiService from './llmService'
import { store } from '@/lib/store/store'
import { addChatMessage, resolvePendingChat, setActionSuggestions } from '@/lib/store/chatSlice'
import { updateFile, setPendingFiles, resolvePendingFiles, updateReviews } from '@/lib/store/projectsSlice'
import { buildPrompt } from '@/lib/prompts/promptBuilder'
import { setActiveView, setActiveFile } from '@/lib/store/appStateSlice'
import { XMLParser } from 'fast-xml-parser'
import { toast } from 'sonner'
import { RequestContext } from '@/types'

const isValidAgentType = (agent: string): agent is 'routingAgent' | 'criticAgent' | 'outlineAgent' | 'writerAgent' => {
  return ['routingAgent', 'criticAgent', 'outlineAgent', 'writerAgent'].includes(agent)
}

export const initializeGeminiService = () => {
  const apiKey = store.getState().settings.apiKey
  if (apiKey) {
    geminiService.updateApiKey(apiKey)
  }
}

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  isArray: (name, jpath) => {
    return ['root.read_file'].includes(jpath) ? true : false
  }
})

const DEBOUNCE_TIME = 5000 // 5 seconds
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Parse the response and extract the relevant information
// Add the message to the chat history
// Take action with tools: Update the relevant files with the new content, etc.
// If files were requested, send a new response with file contents
const processResponse = (responseString: string): RequestContext | null => {
  let response
  try {
    response = parser.parse(`<root>${responseString}</root>`).root
  } catch (parsingError) {
    console.error('XML Parsing Error:', parsingError)
    store.dispatch(addChatMessage({ sender: 'Gemini', text: 'Error parsing AI response. Please check the response format.' }))
    return null
  }
  const context: RequestContext = {
    currentStep: 0,
    agent: 'routingAgent'
  }

  console.log(response?.think || 'No thoughts, only vibes.')

  if (!!response?.route_to) {
    console.log('Switching agents to ' + response.route_to)
    if (isValidAgentType(response.route_to)) {
      context.agent = response.route_to
    } else {
      throw new Error(`Invalid agent type received from AI: ${response.route_to}.`)
    }
  }

  if (!!response?.read_file) {
    context.requestedFiles = response.read_file
  }

  if (!!response?.write_file) {
    const fileName = response.write_file.file_name
    const content = response.write_file.content
    if (fileName && content) {

      // console.log(stringToProjectFile("---- \n # " + fileName + "\n \n" +content))
      // Fix Markdown formatting before updating the file
      store.dispatch(updateFile({title: fileName, content: content}));
      // Switch to ProjectOverview and set active file after successful
      store.dispatch(setActiveView('project/editor'))
      store.dispatch(setActiveFile(fileName))
    }
  }

  // Check for the presence of the sequence tag
  if (!!response?.sequence) {
    context.sequenceInfo = response.sequence.sequence
  }

  if (!!response?.critique) {
    try {
      const critiqueContent = JSON.parse(response.critique)
      store.dispatch(updateReviews(critiqueContent))
      console.log('Critique content dispatched to store:', critiqueContent)
    } catch (error) {
      console.error('Error parsing critique JSON:', error)
      store.dispatch(addChatMessage({ sender: 'Gemini', text: 'Error parsing critique from AI response.' }))
    }
  }

  if (!!response?.message) {
    store.dispatch(addChatMessage({ sender: 'Gemini', text: response.message }))
  }

  if (!!response?.action_suggestion) {
    const suggestions = response.action_suggestion.map((item) => `${item}`).slice(0, 3)
    store.dispatch(setActionSuggestions(suggestions))
  } else {
    store.dispatch(setActionSuggestions([])) // Clear suggestions if not present
  }

  return context
}

export const sendMessage = async (context: RequestContext) => {
  if (context.currentStep > 5) {
    const errorMessage = 'Error: Recursion depth exceeded in sendMessage.'
    toast.error(errorMessage)
    throw new Error(errorMessage)
  }

  const prompt = buildPrompt({
    ...context,
    currentStep: context.currentStep || 0
  })
  console.log(prompt)
  try {
    console.groupCollapsed('User Prompt')
    console.log(prompt)
    console.groupEnd()
    store.dispatch(setPendingFiles(context.requestedFiles || null))


    const response = await geminiService.generateContent(prompt)

    console.groupCollapsed('AI Response')
    console.log(response)
    console.groupEnd()
    console.log('AI Response: \n \n', response)
    const newContext = processResponse(response)

    if (newContext === null) {
      return // Stop recursion if processResponse failed
    }
    if (newContext.agent !== 'routingAgent') {
      await sendMessage({
        ...newContext,
        currentStep: context.currentStep + 1 // Keeping currentStep from the original context
      })
    }
  } catch (error) {
    console.error('Failed to send chat message:', error)
    const errorMessage = `Error: Failed to send message. ${error}`

    if (errorMessage.includes('resource exhausted')) {
      console.log('Resource exhausted, debouncing...')
      await sleep(DEBOUNCE_TIME)
      await sendMessage({
        ...context,
        currentStep: context.currentStep + 1
      })
    } else {
      store.dispatch(
        addChatMessage({
          sender: 'Gemini',
          text: `Hmm. Something went wrong, sorry. You might need to try again.`
        })
      )
      store.dispatch(resolvePendingChat())
      store.dispatch(setPendingFiles(null))
    }
  } finally {
    store.dispatch(setPendingFiles(null))
    store.dispatch(resolvePendingChat())
    console.log('sendMessage() finished')
  }
}

export const generateSkeleton = async (parameters: { [key: string]: any }): Promise<void> => {
  const prompt = buildPrompt({
    agent: 'outlineAgent',
    currentStep: -1, // Special trigger for the outline agent to generate the skeleton
    carriedContext: JSON.stringify(parameters, null, 2),
    requestedFiles: undefined,
    sequenceInfo: undefined
  })
  try {
    const response = await geminiService.generateContent(prompt)

    console.log('AI Response: \n \n', response)
    const context = processResponse(response)
    if (context === null) {
      console.error('processResponse returned null in generateSkeleton, not calling sendMessage')
      return
    }
    await sendMessage(context)
  } catch (error) {
    console.error('Failed to send chat message:', error)
  } finally {
    store.dispatch(resolvePendingChat())
    console.log('generateSkeleton() finished')
  }
}
