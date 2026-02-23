import llmService from '@/lib/services/llmService'
import { AppSettings } from '@/types'

const SYSTEM_PROMPT = `You are a creative writing assistant specializing in book titles.
Given a story outline, suggest exactly 12 compelling, distinct titles for the novel.
Prefix each title with a single thematically fitting emoji (e.g. a genre or mood cue).
Respond ONLY with a valid JSON array of 12 strings. No markdown, no explanation, no extra text.
Example format: ["🌙 Title One", "⚔️ Title Two", ...]`

/**
 * Uses the LLM to suggest 12 title options for a story based on its outline.
 * Returns an empty array if the LLM call fails or the outline is missing.
 */
export async function suggestTitles(
  settings: AppSettings,
  outlineContent: string
): Promise<string[]> {
  if (!outlineContent?.trim()) return []

  const prompt = `${SYSTEM_PROMPT}\n\n---\nOUTLINE:\n${outlineContent}`

  try {
    const raw = await llmService.generateContent(settings, prompt, 'low')
    console.log('[titleSuggestion] Raw LLM response:', raw)
    // Strip any accidental markdown fences before parsing
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
    console.log('[titleSuggestion] Cleaned for parse:', cleaned)
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
      return parsed.slice(0, 12)
    }
    console.warn('[titleSuggestion] Parsed value is not a string array:', parsed)
    return []
  } catch (err) {
    console.error('[titleSuggestion] Failed to parse LLM response:', err)
    return []
  }
}
