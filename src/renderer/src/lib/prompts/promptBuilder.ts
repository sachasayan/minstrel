import { store } from '@/lib/store/store'
import { RequestContext } from '@/types'
import {
  basePrompt,
  addAvailableFiles,
  addProvidedFiles,
  addFileContents,
  addUserPrompt,
  addParameters,
  addBeginUserPrompt,
  appendWithSeparator
} from './promptsUtils'
import { getRoutingAgentPrompt } from './routingAgent'
import { getOutlineAgentPrompt } from './outlineAgent'
import { getWriterAgentPrompt } from './writerAgent'
import { getCriticAgentPrompt } from './criticAgent'
import { getToolsPrompt } from './tools'

// --- Helper Functions (Keep existing ones) ---

// Gets all available files
export const getAvailableFiles = (): string[] => {
  return store.getState().projects.activeProject?.files.map((f) => f.title) || []
}

export const getProvidedFiles = (dependencies: string[] | undefined): string[] => {
  const activeProject = store.getState().projects.activeProject
  // Ensure dependencies is an array before filtering
  const depsArray = Array.isArray(dependencies) ? dependencies : []
  const files: string[] = activeProject?.files?.filter((f) => depsArray.includes(f.title))?.map((file) => `${file.title}`) || []
  return files
}

// Gets contents of all the given files as a string
export const getFileContents = (dependencies: string[] | undefined): string => {
  if (!dependencies || !Array.isArray(dependencies) || dependencies.length === 0) {
    return '' // Return empty string if no valid dependencies
  }
  // Get each file as a content item
  const activeProject = store.getState().projects.activeProject
  const filesContent: string =
    activeProject?.files
      .filter((f) => dependencies.includes(f.title))
      .map(
        (file) => `
---
# ${file.title}

${file.content || '(File content is empty)'}
`
      )
      .join('\n') || '' // Join with newline, default to empty string

  return filesContent
}


export const getLatestUserMessage = (): string => {
  // Ensure text exists and trim whitespace
  return store.getState().chat.chatHistory.findLast((message) => message.sender === 'User')?.text?.trim() || '(No user message found)'
}

// --- Refactored buildPrompt ---

export const buildPrompt = (context: RequestContext): string => {
  let prompt = basePrompt

  const availableFiles = getAvailableFiles()
  const providedFiles = getProvidedFiles(context.requestedFiles)
  const fileContents = getFileContents(context.requestedFiles)
  const userMessage = getLatestUserMessage()

  switch (context.agent) {
    case 'routingAgent': {
      const tools = ['think', 'read_file', 'action_suggestion', 'message', 'route_to']
      prompt = appendWithSeparator(prompt, getRoutingAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(tools))
      prompt = addUserPrompt(prompt, userMessage)
      prompt = addAvailableFiles(prompt, availableFiles)
      prompt = addProvidedFiles(prompt, providedFiles)
      prompt = addFileContents(prompt, fileContents)
      prompt = addBeginUserPrompt(prompt)
      break
    }
    case 'outlineAgent': {
      const tools = ['think', 'write_file', 'message']
      prompt = appendWithSeparator(prompt, getOutlineAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(tools))
      prompt = addUserPrompt(prompt, userMessage)

      if (context.carriedContext) {
         // Scenario: Initial Outline Generation (uses parameters)
         prompt = addParameters(prompt, context.carriedContext)
      } else {
        // Scenario: Revising/Continuing Outline (uses standard context)
        prompt = addAvailableFiles(prompt, availableFiles)
        prompt = addProvidedFiles(prompt, providedFiles)
        prompt = addFileContents(prompt, fileContents)
      }
      prompt = addBeginUserPrompt(prompt)
      break
    }
    case 'writerAgent': {
      const tools = ['think', 'write_file', 'message']
      prompt = appendWithSeparator(prompt, getWriterAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(tools))
      prompt = addUserPrompt(prompt, userMessage)
      prompt = addAvailableFiles(prompt, availableFiles)
      prompt = addProvidedFiles(prompt, providedFiles)
      prompt = addFileContents(prompt, fileContents)
      prompt = addBeginUserPrompt(prompt)
      break
    }
    case 'criticAgent': {
      const tools = ['think', 'critique', 'message']
      prompt = appendWithSeparator(prompt, getCriticAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(tools))
      prompt = addUserPrompt(prompt, userMessage)
      prompt = addAvailableFiles(prompt, availableFiles)
      prompt = addProvidedFiles(prompt, providedFiles)
      prompt = addFileContents(prompt, fileContents)
      prompt = addBeginUserPrompt(prompt)
      break
    }
    default: {
      const exhaustiveCheck: never = context.agent
      throw new Error(`Invalid agent type received: ${exhaustiveCheck}.`)
    }
  }
  return prompt
}
