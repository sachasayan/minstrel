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
import { PromptData, BuildPromptResult } from './types'

// Gets all available files (including virtual chapters)
export const getAvailableFiles = (data: PromptData): string[] => {
  const activeProject = data.activeProject
  if (!activeProject) return []

  const artifactFiles = activeProject.files.map((f) => f.title)
  const virtualChapters = getChaptersFromStoryContent(activeProject.storyContent).map((c) => c.title)

  return [...artifactFiles, ...virtualChapters]
}

export const getProvidedFiles = (data: PromptData, dependencies: string[] | undefined): string[] => {
  const availableFiles = getAvailableFiles(data)
  const depsArray = Array.isArray(dependencies) ? dependencies : []
  return availableFiles.filter((f) => depsArray.includes(f))
}

// Gets contents of all the given files (including virtual chapters) as a string
export const getFileContents = (data: PromptData, dependencies: string[] | undefined): string => {
  if (!dependencies || !Array.isArray(dependencies) || dependencies.length === 0) {
    return ''
  }

  const activeProject = data.activeProject
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

export const getLatestUserMessage = (data: PromptData): string => {
  // Ensure text exists and trim whitespace
  return data.chatHistory.findLast((message) => message.sender === 'User')?.text?.trim() || '(No user message found)'
}

// --- Refactored buildPrompt ---

export const buildPrompt = (context: RequestContext, data: PromptData): BuildPromptResult => {
  let prompt = basePrompt

  const availableFiles = getAvailableFiles(data)
  const providedFiles = getProvidedFiles(data, context.requestedFiles)
  const fileContents = getFileContents(data, context.requestedFiles)
  const userMessage = getLatestUserMessage(data)

  const commonSections = (p: string) => {
    let updatedPrompt = p
    updatedPrompt = addUserPrompt(updatedPrompt, userMessage)
    updatedPrompt = addAvailableFiles(updatedPrompt, availableFiles)
    updatedPrompt = addProvidedFiles(updatedPrompt, providedFiles)
    updatedPrompt = addFileContents(updatedPrompt, fileContents)
    updatedPrompt = addBeginUserPrompt(updatedPrompt)
    return updatedPrompt
  }

  let allowedTools: string[] = []

  switch (context.agent) {
    case 'routingAgent': {
      allowedTools = ['reasoning', 'readFile', 'actionSuggestion', 'routeTo']
      prompt = appendWithSeparator(prompt, getRoutingAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(allowedTools))
      prompt = commonSections(prompt)
      break
    }
    case 'outlineAgent': {
      allowedTools = ['reasoning', 'writeFile']
      prompt = appendWithSeparator(prompt, getOutlineAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(allowedTools))
      
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
      allowedTools = ['reasoning', 'writeFile']
      prompt = appendWithSeparator(prompt, getWriterAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(allowedTools))
      prompt = commonSections(prompt)
      break
    }
    case 'criticAgent': {
      allowedTools = ['reasoning', 'addCritique']
      prompt = appendWithSeparator(prompt, getCriticAgentPrompt())
      prompt = appendWithSeparator(prompt, getToolsPrompt(allowedTools))
      prompt = commonSections(prompt)
      break
    }
    default: {
      const exhaustiveCheck: never = context.agent
      throw new Error(`Invalid agent type received: ${exhaustiveCheck}.`)
    }
  }

  return { prompt, allowedTools }
}
