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
  onToolCall?: (event: {
    toolName: string
    args: unknown
    result?: unknown
    startedAt: string
    endedAt: string
    durationMs: number
    status: 'success' | 'error'
    errorMessage?: string
  }) => void
}

/**
 * Creates the tools object for the AI SDK, injecting necessary callbacks.
 */
export const createTools = (callbacks: ToolCallbacks) => {
  const { dispatch, activeProject } = callbacks
  let hasReadThisTurn = false
  let writeCountThisTurn = 0
  const getDurationMs = (startedAt: string, endedAt: string) =>
    Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime())
  const emitToolCall = (
    event: Omit<NonNullable<ToolCallbacks['onToolCall']> extends (input: infer T) => void ? T : never, 'durationMs'> & {
      durationMs?: number
    }
  ) => {
    callbacks.onToolCall?.({
      ...event,
      durationMs: event.durationMs ?? getDurationMs(event.startedAt, event.endedAt)
    })
  }

  return {
    writeFile: tool({
      description: 'Write content to a file. Only Markdown files supported.',
      inputSchema: schemas.writeFileSchema,
      execute: async (args, _options) => {
        const startedAt = new Date().toISOString()
        try {
          if (hasReadThisTurn) {
            throw new Error('writeFile cannot be used in the same turn after readFile. Load files first, then write on the next turn.')
          }
          console.log(`[TOOL EXECUTION] writeFile called with raw args:`, JSON.stringify(args))
          handleWriteFile(args.file_name, args.content, dispatch, activeProject)
          writeCountThisTurn += 1
          const result = { status: 'success', file: args.file_name }
          const endedAt = new Date().toISOString()
          emitToolCall({
            toolName: 'writeFile',
            args,
            result,
            startedAt,
            endedAt,
            status: 'success'
          })
          return result
        } catch (error) {
          const endedAt = new Date().toISOString()
          emitToolCall({
            toolName: 'writeFile',
            args,
            startedAt,
            endedAt,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : String(error)
          })
          throw error
        }
      }
    }),

    readFile: tool({
      description: 'Read the contents of specified files.',
      inputSchema: schemas.readFileSchema,
      execute: async (args, _options) => {
        const startedAt = new Date().toISOString()
        try {
          if (writeCountThisTurn > 0) {
            throw new Error('readFile cannot be used in the same turn after writeFile. Finish writing from the current context or read first.')
          }
          console.log(`[TOOL EXECUTION] readFile called with raw args:`, JSON.stringify(args))
          const fileNames = args.file_names.split(',').map(f => f.trim()).filter(Boolean)
          hasReadThisTurn = true
          if (callbacks.onReadFile) {
            callbacks.onReadFile(fileNames)
          }
          const result = { status: 'success', requested: fileNames }
          const endedAt = new Date().toISOString()
          emitToolCall({
            toolName: 'readFile',
            args,
            result,
            startedAt,
            endedAt,
            status: 'success'
          })
          return result
        } catch (error) {
          const endedAt = new Date().toISOString()
          emitToolCall({
            toolName: 'readFile',
            args,
            startedAt,
            endedAt,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : String(error)
          })
          throw error
        }
      }
    }),

    routeTo: tool({
      description: 'Route to a specialist agent.',
      inputSchema: schemas.routeToSchema,
      execute: async (args, _options) => {
        const startedAt = new Date().toISOString()
        try {
          console.log(`[TOOL EXECUTION] routeTo called with raw args:`, JSON.stringify(args))
          if (callbacks.onRouteTo) {
            callbacks.onRouteTo(args.agent)
          }
          const result = { status: 'success', target: args.agent }
          const endedAt = new Date().toISOString()
          emitToolCall({
            toolName: 'routeTo',
            args,
            result,
            startedAt,
            endedAt,
            status: 'success'
          })
          return result
        } catch (error) {
          const endedAt = new Date().toISOString()
          emitToolCall({
            toolName: 'routeTo',
            args,
            startedAt,
            endedAt,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : String(error)
          })
          throw error
        }
      }
    }),

    actionSuggestion: tool({
      description: 'Provide suggestions for the user.',
      inputSchema: schemas.actionSuggestionSchema,
      execute: async (args, _options) => {
        const startedAt = new Date().toISOString()
        try {
          console.log(`[TOOL EXECUTION] actionSuggestion called with raw args:`, JSON.stringify(args))
          const suggestions = args.suggestions.split(',').map(s => s.trim()).filter(Boolean)
          handleActionSuggestions(suggestions, dispatch)
          const result = { status: 'success' }
          const endedAt = new Date().toISOString()
          emitToolCall({
            toolName: 'actionSuggestion',
            args,
            result,
            startedAt,
            endedAt,
            status: 'success'
          })
          return result
        } catch (error) {
          const endedAt = new Date().toISOString()
          emitToolCall({
            toolName: 'actionSuggestion',
            args,
            startedAt,
            endedAt,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : String(error)
          })
          throw error
        }
      }
    })
  }
}

/**
 * Type representing all available tools.
 */
export type Toolkit = ReturnType<typeof createTools>
export type ToolName = keyof Toolkit
