import { z } from 'zod'

/**
 * Shared Zod schemas for AI tool calling.
 */

export const writeFileSchema = z.object({
  file_name: z.string().describe('The name of the file to write to. For chapters, this MUST be the unique ID (e.g. "abc123") from the directory listing tag "<!-- id: abc123 --> Title". DO NOT use the title. For artifacts, use the title. Only Markdown supported.'),
  content: z.string().describe('The full content to write to the file.')
})

export const readFileSchema = z.object({
  file_names: z.string().describe('List of file names to read, separated by commas. For example: "Chapter 1, Outline"')
})

export const routeToSchema = z.object({
  agent: z.string().describe('The name of the specialist agent to route the request to. MUST be one of: "routingAgent", "writerAgent".')
})


export const actionSuggestionSchema = z.object({
  suggestions: z.string().describe('A list of short suggestions for the user, separated by completely commas. For example: "Write a new chapter, Add more details"')
})


