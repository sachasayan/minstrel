import { tool } from 'ai'
import * as schemas from './toolSchemas'
import {
  handleWriteFile,
  handleCritique,
  handleActionSuggestions
} from './toolHandlers'

export interface ToolCallbacks {
  onReadFile?: (fileNames: string[]) => void
  onRouteTo?: (agent: string) => void
}

/**
 * Creates the tools object for the AI SDK, injecting necessary callbacks.
 */
export const createTools = (callbacks: ToolCallbacks = {}) => {
  return {
    writeFile: tool({
      description: 'Write content to a file. Only Markdown files supported.',
      parameters: schemas.writeFileSchema,
      execute: async ({ file_name, content }: any) => {
        console.log(`[TOOL EXECUTION] writeFile called for file: ${file_name}`)
        handleWriteFile(file_name, content)
        return { status: 'success', file: file_name }
      }
    } as any),

    readFile: tool({
      description: 'Read the contents of specified files.',
      parameters: schemas.readFileSchema,
      execute: async ({ file_names }: any) => {
        console.log(`[TOOL EXECUTION] readFile called for files: ${file_names.join(', ')}`)
        if (callbacks.onReadFile) {
          callbacks.onReadFile(file_names)
        }
        return { status: 'success', requested: file_names }
      }
    } as any),

    routeTo: tool({
      description: 'Route to a specialist agent.',
      parameters: schemas.routeToSchema,
      execute: async ({ agent }: any) => {
        console.log(`[TOOL EXECUTION] routeTo called for agent: ${agent}`)
        if (callbacks.onRouteTo) {
          callbacks.onRouteTo(agent)
        }
        return { status: 'success', target: agent }
      }
    } as any),

    actionSuggestion: tool({
      description: 'Provide suggestions for the user.',
      parameters: schemas.actionSuggestionSchema,
      execute: async ({ suggestions }: any) => {
        console.log(`[TOOL EXECUTION] actionSuggestion called with suggestions:`, suggestions)
        handleActionSuggestions(suggestions)
        return { status: 'success' }
      }
    } as any),


    addCritique: tool({
      description: 'Submit a story critique.',
      parameters: schemas.addCritiqueSchema,
      execute: async ({ critique }: any) => {
        console.log(`[TOOL EXECUTION] addCritique called`)
        handleCritique(critique)
        return { status: 'success' }
      }
    } as any)
  }
}

/**
 * Type representing all available tools.
 */
export type Toolkit = ReturnType<typeof createTools>
export type ToolName = keyof Toolkit
