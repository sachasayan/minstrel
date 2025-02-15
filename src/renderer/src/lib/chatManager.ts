import geminiService from './GeminiService'
import { store } from '@/lib/utils/store'
import { addChatMessage, resolvePendingChat } from '@/lib/utils/chatSlice'
import { updateFile } from '@/lib/utils/projectsSlice'

import { buildPrompt, buildInitial } from './promptBuilder'
import { setActiveView, setActiveFile } from './utils/appStateSlice'
import { XMLParser } from 'fast-xml-parser'

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
    return ( ['root.get_context'].includes(jpath)) ? true : false
  }
})

const DEBOUNCE_TIME = 5000 // 5 seconds
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Parse the response and extract the relevant information
// Add the summary to the chat history
// Take action with tools: Update the relevant files with the new content, etc.
// If context was requested, send a new response with context
const processResponse = (responseString: string) => {
  const response = parser.parse(`<root>${responseString}</root>`).root

  if (!!response.think) {
    console.log(response.think)
  }

  if (!!response?.get_context) {
    store.dispatch(addChatMessage({ sender: 'Gemini', text: "Looking at files..." }));
    return response.get_context
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

export const sendMessage = async (dependencies?: string[]) => {
  const prompt = buildPrompt(dependencies || null)
  try {

    const response = await geminiService.generateContent(prompt)

    console.log('AI Response: \n \n', response)
    const contextRequested = processResponse(response)
    store.dispatch(resolvePendingChat())
    if (!!contextRequested) {
      await sendMessage(contextRequested)
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
      await sendMessage()
    }
  } finally {
    console.log("sendMessage() finished");
  }
}

export const generateSkeleton = async (parameters: { [key: string]: any }): Promise<void> => {
  const prompt = buildInitial(parameters)
  try {
    const response = await geminiService.generateContent(prompt)

    console.log('AI Response: \n \n', response)
    const contextRequested = processResponse(response)
    store.dispatch(resolvePendingChat())
    if (!!contextRequested) {
      await sendMessage(contextRequested)
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
      await sendMessage()
    }
  } finally {
    console.log("generateSkeleton() finished");
  }
}
