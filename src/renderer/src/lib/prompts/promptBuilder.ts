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

import { getChaptersFromStoryContent, extractChapterContent } from '@/lib/storyContent'

// Gets all available files (including virtual chapters)
export const getAvailableFiles = (): string[] => {
  const state = store.getState().projects
  const activeProject = state.activeProject
  if (!activeProject) return []

  const artifactFiles = activeProject.files.map((f) => f.title)
  const virtualChapters = getChaptersFromStoryContent(activeProject.storyContent).map((c) => c.title)

  return [...artifactFiles, ...virtualChapters]
}

export const getProvidedFiles = (dependencies: string[] | undefined): string[] => {
  const availableFiles = getAvailableFiles()
  const depsArray = Array.isArray(dependencies) ? dependencies : []
  return availableFiles.filter((f) => depsArray.includes(f))
}

// Gets contents of all the given files (including virtual chapters) as a string
export const getFileContents = (dependencies: string[] | undefined): string => {
  if (!dependencies || !Array.isArray(dependencies) || dependencies.length === 0) {
    return ''
  }

  const activeProject = store.getState().projects.activeProject
  if (!activeProject) return ''

  const filesContent: string[] = []

  dependencies.forEach((title) => {
    // 1. Check artifact files
    const artifactFile = activeProject.files.find((f) => f.title === title)
    if (artifactFile) {
      filesContent.push(`
---
# ${artifactFile.title}

${artifactFile.content || '(File content is empty)'}
`)
      return
    }

    // 2. Check virtual chapters in storyContent
    const chapterContent = extractChapterContent(activeProject.storyContent, title)
    if (chapterContent !== null) {
      filesContent.push(`
---
# ${title}

${chapterContent || '(Chapter content is empty)'}
`)
    }
  })

  return filesContent.join('\n')
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

  const commonSections = (p: string) => {
    let updatedPrompt = p
    updatedPrompt = addUserPrompt(updatedPrompt, userMessage)
    updatedPrompt = addAvailableFiles(updatedPrompt, availableFiles)
    updatedPrompt = addProvidedFiles(updatedPrompt, providedFiles)
    updatedPrompt = addFileContents(updatedPrompt, fileContents)
    updatedPrompt = addBeginUserPrompt(updatedPrompt)
    return updatedPrompt
  }

  switch (context.agent) {
    case 'routingAgent': {
      const tools = ['think', 'read_file', 'action_suggestion', 'message', 'route_to']
      prompt = appendWithSeparator(prompt, getRoutingAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(tools))
      prompt = commonSections(prompt)
      break
    }
    case 'outlineAgent': {
      const tools = ['think', 'write_file', 'message']
      prompt = appendWithSeparator(prompt, getOutlineAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(tools))
      
      if (context.carriedContext) {
         prompt = addParameters(prompt, context.carriedContext)
         prompt = addUserPrompt(prompt, userMessage)
         prompt = addBeginUserPrompt(prompt)
      } else {
        prompt = commonSections(prompt)
      }
      break
    }
    case 'writerAgent': {
      const tools = ['think', 'write_file', 'message']
      prompt = appendWithSeparator(prompt, getWriterAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(tools))
      prompt = commonSections(prompt)
      break
    }
    case 'criticAgent': {
      const tools = ['think', 'critique', 'message']
      prompt = appendWithSeparator(prompt, getCriticAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(tools))
      prompt = commonSections(prompt)
      break
    }
    default: {
      const exhaustiveCheck: never = context.agent
      throw new Error(`Invalid agent type received: ${exhaustiveCheck}.`)
    }
  }
  return prompt
}
