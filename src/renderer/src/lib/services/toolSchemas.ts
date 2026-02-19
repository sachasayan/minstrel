import { z } from 'zod'

/**
 * Shared Zod schemas for AI tool calling.
 */

export const writeFileSchema = z.object({
  file_name: z.string().describe('The name of the file to write to. Only Markdown files supported.'),
  content: z.string().describe('The full content to write to the file.')
})

export const readFileSchema = z.object({
  file_names: z.array(z.string()).describe('The list of file names to read.')
})

export const routeToSchema = z.object({
  agent: z.enum(['routingAgent', 'criticAgent', 'outlineAgent', 'writerAgent']).describe('The specialist agent to route the request to.')
})

export const addCritiqueSchema = z.object({
  critique: z.string().describe('The JSON string representation of the story critique.')
})

export const actionSuggestionSchema = z.object({
  suggestions: z.array(z.string().max(30)).max(3).describe('A list of up to 3 short suggestions for the user.')
})


export const reasoningSchema = z.object({
  thought: z.string().describe('The AI reasoning/plan for the current step.')
})

export const planSequenceSchema = z.object({
  sequence: z.string().describe('A markdown-numbered list of future actions.')
})
