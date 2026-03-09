import llmService from '@/lib/services/llmService'
import { AppSettings } from '@/types'

const SYSTEM_PROMPT = `You analyze an author's prose style from a writing sample.
Return a single concise paragraph describing only observable writing traits.
Cover tone, rhythm, diction, point of view, sentence shape, imagery, dialogue habits, and notable constraints.
Do not praise the sample. Do not give advice. Do not mention the reader or the author directly.
Do not quote the sample. Do not use markdown, lists, or JSON.
Keep the response under 140 words.`

export async function describeWritingStyle(
  settings: AppSettings,
  writingSample: string
): Promise<string | null> {
  if (!writingSample.trim()) return null

  const prompt = `${SYSTEM_PROMPT}\n\n---\nWRITING SAMPLE:\n${writingSample.trim()}`

  try {
    const raw = await llmService.generateContent(settings, prompt, 'low')
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').replace(/\s+/g, ' ').trim()
    return cleaned || null
  } catch (error) {
    console.error('[writingStyleAssistant] Failed to analyze writing style:', error)
    return null
  }
}
