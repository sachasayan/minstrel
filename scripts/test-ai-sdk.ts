/**
 * AI SDK vs Gemini Testing Utilities
 * 
 * We created this script while attempting to troubleshoot why \`properties: {}\` was silently
 * passed to Google Gemini while using Vercel AI SDK 6.0+ via the \`ai\` / \`@ai-sdk/google\` packages
 * alongside \`zod\`. 
 *
 * Use these functions mapped to npm scripts to locally test any new updates to the \`ai\` or \`zod\` packages
 * to see how they uniquely compile schemas under the hood.
 */
import { tool, jsonSchema } from 'ai'
import { z } from 'zod'

// --- Utility: Simulate Vercel AI SDK's Zod Parameter Runtime Overload ---
// Vercel AI SDK uses internal types to determine if something is a Zod schema. If you
// strip these types through compilation or use an incompatible \`zod\` version, they become:
// { def: { type: 'object', shape: ... } } instead of properly resolving into JSON Schemas.
export const testVercelZodSchema = () => {
  const schema = z.object({
    agent: z.string().describe('The name of the specialist agent')
  })

  // @ts-expect-error test harness
  const myTool = tool({
    description: 'A mock Zod tool',
    parameters: schema,
    execute: async (args) => args
  })

  console.log("Runtime Zod AI Tool Properties:", JSON.stringify(myTool.parameters, null, 2))
}

// --- Utility: Simulate Vercel explicit \`jsonSchema\` Overload ---
// Vercel also provides \`jsonSchema\` specifically to bypass Zod processing. We tried this
// as a workaround before finally falling back to single string parameters, as nested 
// objects sometimes still failed silently under this wrapper.
export const testVercelJsonSchema = () => {
  const schema = jsonSchema<{ agent: string }>({
    type: 'object',
    properties: {
      agent: { type: 'string', description: 'The exact name of the specialist agent' }
    },
    required: ['agent'],
    additionalProperties: false
  })

  // @ts-expect-error test harness
  const myTool = tool({
    description: 'A mock JsonSchema tool',
    parameters: schema,
    execute: async (args) => args
  })

  console.log("Runtime Explicit JSONSchema AI Tool Properties:", JSON.stringify(myTool.parameters, null, 2))
}

// Ensure the process isn't invoked natively at large
if (require.main === module) {
  console.log('--- Testing Vercel Zod Schema Behavior ---')
  testVercelZodSchema()
  
  console.log('\\n--- Testing Vercel JSON Schema Behavior ---')
  testVercelJsonSchema()
}
