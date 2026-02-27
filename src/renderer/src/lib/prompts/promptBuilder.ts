import { RequestContext } from '@/types'
import { ModelMessage } from 'ai'
import {
  basePrompt,
  addAvailableFiles,
  addProvidedFiles,
  addFileContents,
  appendWithSeparator
} from './promptsUtils'
import { getRoutingAgentPrompt } from './routingAgent'
import { getWriterAgentPrompt } from './writerAgent'
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

export const buildMessages = (data: PromptData): ModelMessage[] => {
  const messages: ModelMessage[] = []
  for (const msg of data.chatHistory) {
    const role = msg.sender === 'User' ? 'user' : 'assistant'
    if (msg.text?.trim()) {
      messages.push({ role, content: msg.text.trim() })
    }
  }
  // Ensure the last message is always from the user
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    messages.push({ role: 'user', content: '(Continue)' })
  }
  return messages
}

// --- Refactored buildPrompt ---

export const buildPrompt = (context: RequestContext, data: PromptData): BuildPromptResult => {
  let system = basePrompt

  const availableFiles = getAvailableFiles(data)
  const messages = buildMessages(data)

  let allowedTools: string[] = []


  switch (context.agent) {
    case 'routingAgent': {
      allowedTools = ['readFile', 'actionSuggestion', 'routeTo', 'writeFile']
      system = appendWithSeparator(system, getRoutingAgentPrompt())
      system = appendWithSeparator(system, getToolsPrompt(allowedTools))

      // Always auto-include the Outline if it exists, plus any explicitly requested files
      const outlineExists = availableFiles.includes('Outline')
      const routingFiles = Array.from(new Set([
        ...(outlineExists ? ['Outline'] : []),
        ...(context.requestedFiles || [])
      ]))
      const routingProvidedFiles = getProvidedFiles(data, routingFiles)
      const routingFileContents = getFileContents(data, routingFiles)

      system = addAvailableFiles(system, availableFiles)
      system = addProvidedFiles(system, routingProvidedFiles)
      system = addFileContents(system, routingFileContents)
      break
    }
    case 'writerAgent': {
      allowedTools = ['writeFile']
      system = appendWithSeparator(system, getWriterAgentPrompt())
      system = appendWithSeparator(system, getToolsPrompt(allowedTools))

      const writerProvidedFiles = getProvidedFiles(data, context.requestedFiles)
      const writerFileContents = getFileContents(data, context.requestedFiles)
      system = addAvailableFiles(system, availableFiles)
      system = addProvidedFiles(system, writerProvidedFiles)
      system = addFileContents(system, writerFileContents)
      break
    }
    default: {
      const exhaustiveCheck: never = context.agent
      throw new Error(`Invalid agent type received: ${exhaustiveCheck}.`)
    }
  }

  return { system, messages, allowedTools }
}
