import geminiService from './GeminiService'
import { store } from '@/lib/utils/store'
import { addChatMessage, resolvePendingChat } from '@/lib/utils/chatSlice'
import { updateFile } from '@/lib/utils/projectsSlice'
import { buildPrompt, buildInitial } from './promptBuilder'
import { setActiveView, setActiveFile } from './utils/appStateSlice'
import { XMLParser } from 'fast-xml-parser'
import { toast } from 'sonner'

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
// Add the summary to the chat history
// Take action with tools: Update the relevant files with the new content, etc.
// If files were requested, send a new response with file contents
const processResponse = (responseString: string) => {
  const response = parser.parse(`<root>${responseString}</root>`).root

  if (!!response.think) {
    console.log(response.think)
  }

  if (!!response?.read_file) {
    const files = response.read_file.map((item) => `[${item}]`).join(' ')
    console.log(response.read_file)
    store.dispatch(addChatMessage({ sender: 'Gemini', text: `Looking at files... ${files}` }))
    return response.read_file
  }

  if (!!response.write_file) {
    const fileName = response.write_file.file_name
    const content = response.write_file.content
    if (fileName && content) {
      // Fix Markdown formatting before updating the file
      store.dispatch(updateFile({ fileName, fileContent: content }))
      // Switch to ProjectOverview and set active file after successful
      store.dispatch(setActiveView('project/editor'))
      store.dispatch(setActiveFile(fileName))
    }
  }

  if (!!response.summary) {
    store.dispatch(addChatMessage({ sender: 'Gemini', text: response.summary }))
  }

  return
}

export const sendMessage = async (dependencies?: string[], recursionDepth: number = 0) => {
  if (recursionDepth > 3) {
    const errorMessage = 'Error: Recursion depth exceeded in sendMessage.'
    toast.error(errorMessage)
    throw new Error(errorMessage)
  }

  const prompt = buildPrompt(dependencies || null)
  try {
    console.groupCollapsed('User Prompt')
    console.log(prompt)
    console.groupEnd()

    const response = await geminiService.generateContent(prompt)

    console.groupCollapsed('AI Response')
    console.log(response)
    console.groupEnd()
    console.log('AI Response: \n \n', response)
    const filesRequested = processResponse(response)
    store.dispatch(resolvePendingChat())
    if (!!filesRequested) {
      await sendMessage(filesRequested, recursionDepth + 1)
    }
  } catch (error) {
    console.error('Failed to send chat message:', error)
    const errorMessage = `Error: Failed to send message. ${error}`
    store.dispatch(
      addChatMessage({
        sender: 'Gemini',
        text: errorMessage
      })
    )
    if (errorMessage.includes('resource exhausted')) {
      console.log('Resource exhausted, debouncing...')
      await sleep(DEBOUNCE_TIME)
      await sendMessage(undefined, recursionDepth + 1)
    }
  } finally {
    console.log('sendMessage() finished')
  }
}

export const generateSkeleton = async (parameters: { [key: string]: any }): Promise<void> => {
  const prompt = buildInitial(parameters)
  try {
    const response = await geminiService.generateContent(prompt)

    console.log('AI Response: \n \n', response)
    const filesRequested = processResponse(response)
    store.dispatch(resolvePendingChat())
    if (!!filesRequested) {
      await sendMessage(filesRequested, 0)
    }
  } catch (error) {
    console.error('Failed to send chat message:', error)
    const errorMessage = `Error: Failed to send message. ${error}`
    store.dispatch(
      addChatMessage({
        sender: 'Gemini',
        text: errorMessage
      })
    )
    if (errorMessage.includes('resource exhausted')) {
      console.log('Resource exhausted, debouncing...')
      await sleep(DEBOUNCE_TIME)
      await sendMessage(undefined, 0)
    }
  } finally {
    console.log('generateSkeleton() finished')
  }
}
