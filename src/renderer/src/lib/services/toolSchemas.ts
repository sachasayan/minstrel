import { z } from 'zod'

/**
 * Shared Zod schemas for AI tool calling.
 */

export const writeFileSchema = z.object({
  file_name: z.string().describe('The name of the file to write to. Only Markdown files supported.'),
  content: z.string().describe('The full content to write to the file.')
})

export const readFileSchema = z.object({
  file_names: z.array(z.string()).describe('List of file names to read. Required.')
})

export const routeToSchema = z.object({
  agent: z.string().describe('The name of the specialist agent to route the request to. MUST be one of: "routingAgent", "criticAgent", "outlineAgent", "writerAgent".')
})

export const addCritiqueSchema = z.object({
  critique: z.string().describe('The JSON string representation of the story critique.')
})

export const actionSuggestionSchema = z.object({
  suggestions: z.array(z.string().max(30)).max(3).describe('A list of up to 3 short suggestions for the user.')
})


