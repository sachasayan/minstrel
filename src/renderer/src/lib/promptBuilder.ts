import { prompts } from './prompts'
import { store } from '@/lib/utils/store'



// Gets all available files
export const getAvailableFiles = (): string[] => {
  return store.getState().projects.activeProject?.files.map((f) => f.title) || []
}

// Gets contents of all the given files as a string
export const getFileContents = (dependencies: string[]): string => {
  // Get each file as a context item
  const activeProject = store.getState().projects.activeProject
  const context: string =
    activeProject?.files
      .filter((f) => dependencies.includes(f.title))
      .map(
        (file) => `
    ---
    file: ${file.title}
    content:
    ${file.content}
    `
      )
      .join('\n') || ''

  return context
}

export const getLatestUserMesage = (): string => {
  return `
  ${store.getState().chat.chatHistory.findLast((message) => message.sender === 'User')?.text}
  `;
}

// Builds the initial prompt for the Skeleton based on parameters
export const buildInitial = (parameters: object): string => {
  let prompt = prompts.getBasePrompt()

  prompt += prompts.getParameters(parameters)
  return prompt
}

export const buildPrompt = (requestedFiles?: string[] | null): string => {
  let prompt = prompts.getBasePrompt()

  // Add the user message to the prompt
  prompt += prompts.getUserPrompt(getLatestUserMesage());
  // Let the prompt know what files are available
  prompt += prompts.getAvailableFiles(getAvailableFiles());

  if (requestedFiles) {
    // Get the context items for the given dependencies
    prompt += prompts.getContext(getFileContents(requestedFiles))
  }
  return prompt;
};
