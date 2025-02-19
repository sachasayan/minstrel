import { prompts } from './prompts'
import { store } from '@/lib/utils/store'
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
export const getFileContents = (dependencies: string[]): string => {
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

// Builds the initial prompt for the Skeleton based on parameters
export const buildInitial = (parameters: object): string => {
  let prompt = prompts.getBasePrompt()

  prompt += "\n\n# GENERATE THE SKELETON \n\n"

  prompt += prompts.getParameters(parameters)
  return prompt
}

export const buildPrompt = (context: RequestContext): string => {
  let prompt = prompts.getBasePrompt()


  prompt += prompts.getAvailableFiles(getAvailableFiles())
  prompt += prompts.getProvidedFiles(getProvidedFiles(context.requestedFiles))
  // Add the user message to the prompt
  prompt += prompts.getUserPrompt(getLatestUserMesage())
  // Let the prompt know what files are available

  context.sequenceInfo ? prompt += prompts.getCurrentSequence(context.sequenceInfo) : null
  context.currentStep ? prompt += prompts.getCurrentStep(context.currentStep) : null

  if (context.requestedFiles) {
    // Get the contents for the given dependencies
    prompt += prompts.getFileContents(getFileContents(context.requestedFiles))
  }

  prompt += prompts.getTools()

  return prompt
}
