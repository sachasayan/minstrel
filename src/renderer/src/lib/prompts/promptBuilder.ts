import { RequestContext, AppSettings } from '@/types'
import { ModelMessage } from 'ai'
import { basePrompt, addAvailableFiles, addProvidedFiles, addFileContents, appendWithSeparator, addFormattedSection } from './promptsUtils'
import { getStoryAgentPrompt } from './storyAgent'
import { getToolsPrompt } from './tools'

import { getChaptersFromStoryContent, extractChapterContent } from '@/lib/storyContent'
import { PromptData, BuildPromptResult, PromptSectionMetadata } from './types'
import { hashString } from '@/lib/observability/hash'

// Gets all available files (including virtual chapters)
export const getAvailableFiles = (data: PromptData): string[] => {
  const activeProject = data.activeProject
  if (!activeProject) return []

  const artifactFiles = activeProject.files.map((f) => f.title)
  const virtualChapters = getChaptersFromStoryContent(activeProject.storyContent).map((c) => (c.id ? `<!-- id: ${c.id} --> ${c.title}` : c.title))

  return [...artifactFiles, ...virtualChapters]
}

export const resolveRequestedFiles = (
  data: PromptData,
  dependencies: string[] | undefined
): {
  resolvedFiles: string[]
  unresolvedFiles: string[]
} => {
  const availableFiles = getAvailableFiles(data)
  const depsArray = Array.isArray(dependencies) ? dependencies : []
  const resolvedFiles: string[] = []
  const unresolvedFiles: string[] = []

  depsArray.forEach((dependency) => {
    if (availableFiles.includes(dependency)) {
      resolvedFiles.push(dependency)
      return
    }

    const chapterMatch = availableFiles.find((file) => {
      const idMatch = file.match(/^<!--\s*id:\s*([a-zA-Z0-9-]+)\s*-->/)
      return idMatch?.[1] === dependency
    })

    if (chapterMatch) {
      resolvedFiles.push(chapterMatch)
      return
    }

    unresolvedFiles.push(dependency)
  })

  return {
    resolvedFiles: Array.from(new Set(resolvedFiles)),
    unresolvedFiles
  }
}

export const getProvidedFiles = (data: PromptData, dependencies: string[] | undefined): string[] => {
  const { resolvedFiles } = resolveRequestedFiles(data, dependencies)
  const availableFiles = getAvailableFiles(data)
  return availableFiles.filter((f) => resolvedFiles.includes(f))
}

// Gets contents of all the given files (including virtual chapters) as a string
export const getFileContents = (data: PromptData, dependencies: string[] | undefined): string => {
  const { resolvedFiles } = resolveRequestedFiles(data, dependencies)
  if (resolvedFiles.length === 0) {
    return ''
  }

  const activeProject = data.activeProject
  if (!activeProject) return ''

  const filesContent: string[] = []

  resolvedFiles.forEach((title) => {
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

export const buildMessages = (data: PromptData): { messages: ModelMessage[]; syntheticContinueMessage: boolean } => {
  const messages: ModelMessage[] = []
  for (const msg of data.chatHistory) {
    const role = msg.sender === 'User' ? 'user' : 'assistant'
    if (msg.text?.trim()) {
      messages.push({ role, content: msg.text.trim() })
    }
  }
  let syntheticContinueMessage = false
  // Ensure the last message is always from the user
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    messages.push({ role: 'user', content: '(Continue)' })
    syntheticContinueMessage = true
  }
  return { messages, syntheticContinueMessage }
}

// --- Refactored buildPrompt ---

const addWritingStyleGuidance = (prompt: string, settings: AppSettings): string => {
  const description = settings.writingStyleDescription?.trim()
  if (!description) return prompt

  return addFormattedSection(
    prompt,
    'PERSONALIZATION: TARGET WRITING STYLE',
    `Match this writing style description while still following the outline, preserving story continuity, and obeying all formatting and tool-use rules:\n\n${description}`
  )
}

export const buildPrompt = (context: RequestContext, data: PromptData, settings: AppSettings = {}): BuildPromptResult => {
  let system = basePrompt

  const availableFiles = getAvailableFiles(data)
  const { messages, syntheticContinueMessage } = buildMessages(data)

  let allowedTools: string[] = []
  let providedFiles: string[] = []
  const sectionMetadata: PromptSectionMetadata[] = [
    {
      key: 'basePrompt',
      title: 'BASE PROMPT',
      contentLength: basePrompt.length,
      hash: hashString(basePrompt)
    }
  ]

  const recordSection = (key: string, title: string, content: string, itemCount?: number) => {
    if (!content.trim()) return
    sectionMetadata.push({
      key,
      title,
      contentLength: content.length,
      hash: hashString(content),
      itemCount
    })
  }

  switch (context.agent) {
    case 'storyAgent': {
      allowedTools = ['readFile', 'actionSuggestion', 'writeFile']
      const storyPrompt = getStoryAgentPrompt()
      const toolsPrompt = getToolsPrompt(allowedTools)
      const writingStyleDescription = settings.writingStyleDescription?.trim() ?? ''
      system = appendWithSeparator(system, storyPrompt)
      system = appendWithSeparator(system, toolsPrompt)
      system = addWritingStyleGuidance(system, settings)
      recordSection('agentPrompt', 'STORY AGENT PROMPT', storyPrompt)
      recordSection('toolsPrompt', 'TOOLS PROMPT', toolsPrompt, allowedTools.length)
      if (writingStyleDescription) {
        recordSection('writingStyle', 'PERSONALIZATION: TARGET WRITING STYLE', writingStyleDescription)
      }

      const outlineExists = availableFiles.includes('Outline')
      const requestedFiles = Array.from(new Set([...(outlineExists ? ['Outline'] : []), ...(context.requestedFiles || [])]))
      const { resolvedFiles, unresolvedFiles } = resolveRequestedFiles(data, requestedFiles)
      const activeProvidedFiles = getProvidedFiles(data, resolvedFiles)
      const activeFileContents = getFileContents(data, resolvedFiles)
      providedFiles = activeProvidedFiles

      system = addAvailableFiles(system, availableFiles)
      system = addProvidedFiles(system, activeProvidedFiles)
      system = addFileContents(system, activeFileContents)
      recordSection('availableFiles', 'DIRECTORY LISTING: FILES IN PROJECT', availableFiles.join('\n'), availableFiles.length)
      recordSection('providedFiles', 'ACTIVE FILES', activeProvidedFiles.join('\n'), activeProvidedFiles.length)
      recordSection('fileContents', 'ACTIVE FILE CONTENTS', activeFileContents, activeProvidedFiles.length)
      break
    }
    default: {
      const exhaustiveCheck: never = context.agent
      throw new Error(`Invalid agent type received: ${exhaustiveCheck}.`)
    }
  }

  return {
    system,
    messages,
    allowedTools,
    metadata: {
      agent: context.agent,
      availableFiles,
      resolvedRequestedFiles:
        context.agent === 'storyAgent'
          ? resolveRequestedFiles(data, Array.from(new Set([...(availableFiles.includes('Outline') ? ['Outline'] : []), ...(context.requestedFiles || [])]))).resolvedFiles
          : [],
      unresolvedRequestedFiles:
        context.agent === 'storyAgent'
          ? resolveRequestedFiles(data, Array.from(new Set([...(availableFiles.includes('Outline') ? ['Outline'] : []), ...(context.requestedFiles || [])]))).unresolvedFiles
          : [],
      providedFiles,
      sectionMetadata,
      systemLength: system.length,
      systemHash: hashString(system),
      messageCount: messages.length,
      messageHash: hashString(JSON.stringify(messages)),
      syntheticContinueMessage
    }
  }
}
