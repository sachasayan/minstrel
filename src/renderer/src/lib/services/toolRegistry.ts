import { tool } from 'ai'
import * as schemas from './toolSchemas'
import {
  handleWriteFile,
  handleCritique,
  handleMessage,
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
    reasoning: tool({
      description: 'Think out your actions and plan the current step.',
      parameters: schemas.reasoningSchema,
      execute: async ({ thought }: any) => {
        console.log('AI Reasoning:', thought)
        return { status: 'success' }
      }
    } as any),

    writeFile: tool({
      description: 'Write content to a file. Only Markdown files supported.',
      parameters: schemas.writeFileSchema,
      execute: async ({ file_name, content }: any) => {
        handleWriteFile(file_name, content)
        return { status: 'success', file: file_name }
      }
    } as any),

    readFile: tool({
      description: 'Read the contents of specified files.',
      parameters: schemas.readFileSchema,
      execute: async ({ file_names }: any) => {
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
        handleActionSuggestions(suggestions)
        return { status: 'success' }
      }
    } as any),

    showMessage: tool({
      description: 'Show a message to the user.',
      parameters: schemas.showMessageSchema,
      execute: async ({ message }: any) => {
        handleMessage(message)
        return { status: 'success' }
      }
    } as any),

    addCritique: tool({
      description: 'Submit a story critique.',
      parameters: schemas.addCritiqueSchema,
      execute: async ({ critique }: any) => {
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
