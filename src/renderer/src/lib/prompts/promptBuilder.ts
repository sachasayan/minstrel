import { promptly() } from './promptsUtils'
import { store } from '@/lib/store/store'
import { RequestContext } from '@/types'

// Gets all available files
export const getAvailableFiles = (): string[] => {
  return store.getState().projects.activeProject?.files.map((f) => f.title) || []
}

export const getProvidedFiles = (dependencies): string[] => {
  const activeProject = store.getState().projects.activeProject
  const files: string[] =
    activeProject?.files
      ?.filter((f) => dependencies?.includes(f.title))
      ?.map((file) => `${file.title}\n`) || []

  return files;
}


// Gets contents of all the given files as a string
export const getFileContents = (dependencies: string[] | undefined): string => {
  if (!dependencies) {return ''}
  // Get each file as a ontent item
  const activeProject = store.getState().projects.activeProject
  const files: string =
    activeProject?.files
      .filter((f) => dependencies.includes(f.title))
      .map(
        (file) => `

---

${file.title}:

${file.content}
`
      )
      .join('\n') || ''

  return files
}

export const getLatestUserMesage = (): string => {
  return `
  ${store.getState().chat.chatHistory.findLast((message) => message.sender === 'User')?.text}
  `
}


export const buildPrompt = (context: RequestContext): string => {
  let prompt = '';

  switch (context.agent) {
    case 'outlineAgent':
      prompt = promptly()
      .basePrompt()
      .outlineAgent()
      .userPrompt(getLatestUserMesage())
      .availableFiles(getAvailableFiles())
      .providedFiles(getProvidedFiles(context.requestedFiles))
      .fileContents(getFileContents(context.requestedFiles))
      break;
    case 'writerAgent':
      prompt = promptly()
      .basePrompt()
      .writerAgent()
      .userPrompt(getLatestUserMesage())
      .availableFiles(getAvailableFiles())
      .providedFiles(getProvidedFiles(context.requestedFiles))
      .fileContents(getFileContents(context.requestedFiles))

      break;
    case 'criticAgent':
      prompt = promptly()
        .basePrompt()
        .criticAgent()
        .userPrompt(getLatestUserMesage())
        .availableFiles(getAvailableFiles())
        .providedFiles(getProvidedFiles(context.requestedFiles))
        .fileContents(getFileContents(context.requestedFiles))
      break;
    default: // Default to the router prompt
      prompt = promptly()
        .basePrompt()
        .routingAgent()
        .userPrompt(getLatestUserMesage())
        .availableFiles(getAvailableFiles())
        .providedFiles(getProvidedFiles(context.requestedFiles))
        .fileContents(getFileContents(context.requestedFiles))

  return prompt
  }
}
