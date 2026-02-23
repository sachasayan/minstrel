import { RequestContext } from '@/types'
import {
  basePrompt,
  addAvailableFiles,
  addProvidedFiles,
  addFileContents,
  addParameters,
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
  const virtualChapters = getChaptersFromStoryContent(activeProject.storyContent).map((c) => 
    c.id ? `<!-- id: ${c.id} --> ${c.title}` : c.title
  )

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
    // Parse ID from "<!-- id: abc123 --> Title" format if present
    const idMatch = title.match(/^<!--\s*id:\s*([a-zA-Z0-9-]+)\s*-->\s*(.*)$/)
    const chapterId = idMatch ? idMatch[1] : undefined
    const cleanTitle = idMatch ? idMatch[2] : title

    const chapterContent = extractChapterContent(activeProject.storyContent, cleanTitle, chapterId)
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
  let system = basePrompt

  const availableFiles = getAvailableFiles(data)
  const providedFiles = getProvidedFiles(data, context.requestedFiles)
  const fileContents = getFileContents(data, context.requestedFiles)
  const userMessage = getLatestUserMessage(data)

  const applyContext = (p: string) => {
    let s = p
    s = addAvailableFiles(s, availableFiles)
    s = addProvidedFiles(s, providedFiles)
    s = addFileContents(s, fileContents)
    return s
  }

  let allowedTools: string[] = []

  switch (context.agent) {
    case 'routingAgent': {
      allowedTools = ['readFile', 'actionSuggestion', 'routeTo']
      system = appendWithSeparator(system, getRoutingAgentPrompt())
      system = appendWithSeparator(system, getToolsPrompt(allowedTools))
      system = applyContext(system)
      break
    }
    case 'outlineAgent': {
      allowedTools = ['writeFile']
      system = appendWithSeparator(system, getOutlineAgentPrompt())
      system = appendWithSeparator(system, getToolsPrompt(allowedTools))
      
      if (context.carriedContext) {
         system = addParameters(system, context.carriedContext)
      } else {
        system = applyContext(system)
      }
      break
    }
    case 'writerAgent': {
      allowedTools = ['writeFile']
      system = appendWithSeparator(system, getWriterAgentPrompt())
      system = appendWithSeparator(system, getToolsPrompt(allowedTools))
      system = applyContext(system)
      break
    }
    case 'criticAgent': {
      allowedTools = ['addCritique']
      system = appendWithSeparator(system, getCriticAgentPrompt())
      system = appendWithSeparator(system, getToolsPrompt(allowedTools))
      system = applyContext(system)
      break
    }
    default: {
      const exhaustiveCheck: never = context.agent
      throw new Error(`Invalid agent type received: ${exhaustiveCheck}.`)
    }
  }

  return { system, userPrompt: userMessage, allowedTools }
}
