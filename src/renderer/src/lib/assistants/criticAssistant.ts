import llmService from '@/lib/services/llmService'
import { AppSettings } from '@/types'

const SYSTEM_PROMPT = `
## CURRENT TASK: CRITIQUE THE STORY

* The user is asking you to critique the story. They have provided the outline, and every available chapter of the story.
* Pick three experts with professional relevance to this story.
* They may be a literary critic, historian, politician, doctor, artist, musician, linguist, scientist, politician etc.
* Each expert should have unique perspective on the book.
* The critiques should analyze the story's strengths and weaknesses and suggest areas for improvement. They should be harsh, but fair.
* Write in paragraph form, from the perspective of the expert.
* Up to five paragraphs may be written per expert.
* The story may be unfinished. If so, review the book as an in-progress work.

# CREATING A STRUCTURED RESPONSE

* You must respond ONLY with a valid JSON object. No markdown, no explanation, no extra text.
* The object must contain exactly two properties, in this order:
* "critique": an array of three expert objects. Each object contains:
  - "name": the expert's name. (string)
  - "expertise": their field of focus. (string)
  - "critique": short paragraph summary (max 200 chars) of their critique. (string)
  - "rating": integer from 1-5. (number)
* "analysis": an object containing at least:
  - "dialogCounts": a map where each key is a **main** character's name (string), and each value is an **array** of integers.
  - The array length equals the total chapters, where each integer is the total number of that character's spoken dialogue sentences **for that chapter**.
  - When counting, split character speech by sentences.
  - Exclude any sentence fragments or interjections **shorter than 3 words**.
  - Include all main characters explicitly; if zero sentences for a chapter, put '0' in that chapter's array position.
  - Do NOT include minor or side characters.
  - Ignore unattributed dialogue entirely.
* The experts' critiques should NOT reference the analysis data — it is included purely for the user's review.
`

/**
 * Uses the LLM to critique a story based on its outline and full content.
 * Returns the parsed critique object or null if it fails.
 */
export async function runCritique(
  settings: AppSettings,
  outlineContent: string,
  storyContent: string
): Promise<any | null> {
  console.log('[criticAssistant] Starting story critique...')
  const prompt = `${SYSTEM_PROMPT}\n\n---\nOUTLINE:\n${outlineContent}\n\nSTORY CONTENT:\n${storyContent}`

  try {
    const raw = await llmService.generateContent(settings, prompt, 'high')
    console.log('[criticAssistant] Raw LLM response received.')
    
    // Strip any accidental markdown fences before parsing
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
    
    const parsed = JSON.parse(cleaned)
    if (parsed.critique && parsed.analysis) {
      console.log('[criticAssistant] Critique successfully generated and parsed.')
      return parsed
    }
    console.warn('[criticAssistant] Parsed value is missing required fields:', parsed)
    return null
  } catch (err) {
    console.error('[criticAssistant] Failed to generate or parse critique:', err)
    return null
  }
}
