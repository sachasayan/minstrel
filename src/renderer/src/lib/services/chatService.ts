import geminiService from './llmService'
import { store } from '@/lib/store/store'
import { addChatMessage, resolvePendingChat, setActionSuggestions } from '@/lib/store/chatSlice'
import { updateFile, setPendingFiles, updateReviews, updateChapter, setLastEdit } from '@/lib/store/projectsSlice'
import { buildPrompt } from '@/lib/prompts/promptBuilder'
import { extractChapterContent } from '@/lib/storyContent'
import { XMLParser } from 'fast-xml-parser'
import { toast } from 'sonner'
import { RequestContext } from '@/types'

const isValidAgentType = (agent: string): agent is 'routingAgent' | 'criticAgent' | 'outlineAgent' | 'writerAgent' => {
  return ['routingAgent', 'criticAgent', 'outlineAgent', 'writerAgent'].includes(agent)
}

export const initializeGeminiService = () => {
  // API keys are now managed through the Redux store and read dynamically
  // No initialization needed with the new multi-provider system
  console.log('LLM service initialized with multi-provider support')
}

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  isArray: (name, jpath) => {
    // Ensure 'title' within 'titles' is always treated as an array
    if (jpath === 'root.titles.title') return true
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
    // modelPreference will be determined before calling generateContent
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
      const activeProject = store.getState().projects.activeProject
      let oldContent = ''

      if (fileName.toLowerCase().includes('chapter')) {
        // Find chapter content in monolithic storyContent
        oldContent = extractChapterContent(activeProject?.storyContent || '', fileName) || ''
      } else {
        const file = activeProject?.files.find(f => f.title === fileName)
        oldContent = file?.content || ''
      }

      // Record the edit for highlighting
      store.dispatch(setLastEdit({
        fileTitle: fileName,
        oldContent: oldContent,
        newContent: content
      }))

      let fileType: string = 'unknown'
      let sortOrder: number = 0 // Default sort order

      // Infer type and sort_order based on filename
      if (fileName.toLowerCase().includes('outline')) {
        fileType = 'outline'
        sortOrder = 0 // Outline always comes first
        
        store.dispatch(
          updateFile({
            title: fileName,
            content: content,
            type: fileType,
            sort_order: sortOrder
          })
        )
      } else if (fileName.toLowerCase().includes('chapter')) {
        // Chapters are updated surgically in the monolithic storyContent
        store.dispatch(updateChapter({ title: fileName, content: content }))
      } else {
        // Dispatch updateFile for any other file types
        store.dispatch(
          updateFile({
            title: fileName,
            content: content,
            type: fileType,
            sort_order: sortOrder
          })
        )
      }
    }
  }

  // Check for the presence of the sequence tag
  if (!!response?.sequence) {
    context.sequenceInfo = response.sequence.sequence
  }

  if (!!response?.critique) {
    try {
      const payload = JSON.parse(response.critique)
      store.dispatch(updateReviews(payload))
      console.log('Critique content dispatched to store:', payload)
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

    // Determine model preference based on agent
    let modelPreference: 'high' | 'low' = 'low' // Default to low
    if (context.agent === 'outlineAgent' || context.agent === 'writerAgent') {
      modelPreference = 'high'
    }

    const response = await geminiService.generateContent(prompt, modelPreference) // Pass preference

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

export const generateOutlineFromParams = async (parameters: { [key: string]: any }): Promise<void> => {
  const prompt = buildPrompt({
    agent: 'outlineAgent',
    currentStep: -1, // Special trigger for the outline agent to generate the initial outline
    carriedContext: JSON.stringify(parameters, null, 2),
    requestedFiles: undefined,
    sequenceInfo: undefined
    // modelPreference is implicitly 'high' because agent is 'outlineAgent'
  })
  try {
    // Pass 'high' preference directly as this function always uses outlineAgent
    const response = await geminiService.generateContent(prompt, 'high')

    console.log('AI Response: \n \n', response)
    const context = processResponse(response)
    if (context === null) {
      console.error('processResponse returned null in generateOutlineFromParams, not calling sendMessage')
      return
    }
    await sendMessage(context)
  } catch (error) {
    console.error('Failed to send chat message for outline generation:', error)

    store.dispatch(
      addChatMessage({
        sender: 'Gemini',
        text: `Sorry, I encountered an error trying to generate the initial outline. Please try again.`
      })
    )
  } finally {
    store.dispatch(resolvePendingChat())
    console.log('generateOutlineFromParams() finished')
  }
}

/**
 * Generates book title suggestions based on plot, genre, and setting.
 * @param plotSummary - The basic plot description.
 * @param genre - The selected genre.
 * @param setting - The selected setting description.
 * @returns A promise that resolves to an array of title suggestions.
 */
export const generateTitleSuggestions = async (plotSummary: string, genre: string, setting: string): Promise<string[]> => {
  // Construct the prompt specifically for title generation
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

  console.log('Generating title suggestions with prompt:', prompt)

  try {
    // Use the 'low' preference model for speed/cost efficiency
    const responseString = await geminiService.generateContent(prompt, 'low')
    console.log('Raw title suggestions response:', responseString)

    // Parse the XML response
    const parsed = parser.parse(`<root>${responseString}</root>`).root

    if (parsed && parsed.titles && parsed.titles.title) {
      // Ensure titles are always returned as an array, even if only one is generated
      const titles = Array.isArray(parsed.titles.title) ? parsed.titles.title : [parsed.titles.title]
      // Filter out any empty strings that might result from parsing issues
      return titles.filter((title) => typeof title === 'string' && title.trim() !== '')
    } else {
      console.warn('No titles found in the expected format:', parsed)
      return [] // Return empty array if structure is not as expected
    }
  } catch (error) {
    console.error('Failed to generate title suggestions:', error)
    toast.error('Failed to generate title suggestions. Please try entering one manually.') // Inform user
    return [] // Return empty array on error
  }
}
