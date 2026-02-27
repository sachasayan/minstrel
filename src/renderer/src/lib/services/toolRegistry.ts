import { tool } from 'ai'
import * as schemas from './toolSchemas'
import {
  handleWriteFile,
  handleActionSuggestions
} from './toolHandlers'
import { AppDispatch } from '@/lib/store/store'
import { Project } from '@/types'

export interface ToolCallbacks {
  dispatch: AppDispatch
  activeProject: Project | null
  onReadFile?: (fileNames: string[]) => void
  onRouteTo?: (agent: string) => void
}

/**
 * Creates the tools object for the AI SDK, injecting necessary callbacks.
 */
export const createTools = (callbacks: ToolCallbacks) => {
  const { dispatch, activeProject } = callbacks
  return {
    writeFile: tool({
      description: 'Write content to a file. Only Markdown files supported.',
      inputSchema: schemas.writeFileSchema,
      execute: async (args) => {
        console.log(`[TOOL EXECUTION] writeFile called with raw args:`, JSON.stringify(args))
        handleWriteFile(args.file_name, args.content, dispatch, activeProject)
        return { status: 'success', file: args.file_name }
      }
    }),

    readFile: tool({
      description: 'Read the contents of specified files.',
      inputSchema: schemas.readFileSchema,
      execute: async (args) => {
        console.log(`[TOOL EXECUTION] readFile called with raw args:`, JSON.stringify(args))
        const fileNames = args.file_names.split(',').map(f => f.trim()).filter(Boolean)
        if (callbacks.onReadFile) {
          callbacks.onReadFile(fileNames)
        }
        return { status: 'success', requested: fileNames }
      }
    }),

    routeTo: tool({
      description: 'Route to a specialist agent.',
      inputSchema: schemas.routeToSchema,
      execute: async (args) => {
        console.log(`[TOOL EXECUTION] routeTo called with raw args:`, JSON.stringify(args))
        if (callbacks.onRouteTo) {
          callbacks.onRouteTo(args.agent)
        }
        return { status: 'success', target: args.agent }
      }
    }),

    actionSuggestion: tool({
      description: 'Provide suggestions for the user.',
      inputSchema: schemas.actionSuggestionSchema,
      execute: async (args) => {
        console.log(`[TOOL EXECUTION] actionSuggestion called with raw args:`, JSON.stringify(args))
        const suggestions = args.suggestions.split(',').map(s => s.trim()).filter(Boolean)
        handleActionSuggestions(suggestions, dispatch)
        return { status: 'success' }
      }
    })
  }
}

/**
 * Type representing all available tools.
 */
export type Toolkit = ReturnType<typeof createTools>
export type ToolName = keyof Toolkit
