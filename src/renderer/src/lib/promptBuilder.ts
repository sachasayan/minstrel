import { prompts } from './prompts'
import { store } from '@/lib/utils/store'

// A list of files that are required for a given file
const getDependencyList = (fileName: string, availableFiles: string[]): string[] => {
  const dependencies: string[] = []
  if (fileName === 'Outline.md') {
    dependencies.push('Skeleton.md')
  }
  if (fileName.startsWith('Chapter')) {
    dependencies.push('Outline.md')
    // Find the previous chapter.  Assume file naming convention of "Chapter-X.md", pluck all the numbers
    const chapterNumber = fileName.match(/\d+/)
    if (!!chapterNumber && parseInt(chapterNumber[0], 10) > 1) {
      dependencies.push(`Chapter-${parseInt(chapterNumber[0], 10) - 1}.md`)
    }
  }
  if (fileName === 'Critique.md') {
    return availableFiles.filter((file) => file.includes('Chapter'))
  }

  return dependencies
}

// Gets all available files
export const getAvailableFiles = (): string[] => {
  return store.getState().projects.activeProject?.files.map((f) => f.title) || []
}

// Gets just dependencies for the given file, as content
export const getFileContents = (fileName): string => {
  // Get the dependencies for the given file, ie [Skeleton.md, Outline.md, Chapter-1.md]
  const dependencies = getDependencyList(fileName, getAvailableFiles())

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
  console.log(prompt)

  return prompt
}

export const buildPrompt = (requestedFiles?: string[] | null): string => {
  let prompt = prompts.getBasePrompt()

  // If no requestedFiles are provided, the prompt will be offered a menu of available files, and the user prompt.
  if (!requestedFiles) {
    prompt += prompts.getAvailableFiles(getAvailableFiles());
  }
  if (requestedFiles) {
    // Get the context items for the given dependencies
    prompt += prompts.getContext(getFileContents(requestedFiles))
  }

  // if (chatHistory) {
  //   prompt += prompts.getChatHistory(chatHistory);
  // }

  console.log(prompt)

  return prompt
}
