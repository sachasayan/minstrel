// Function returning the prompt string
export const getOutlineAgentPrompt = () => `

---

## CURRENT TASK: WRITE AN OUTLINE

* The user is asking you to write an outline for the story based on the provided Project Parameters or an existing Outline.
* An outline is a fleshed-out overview of the story with focus on world-building and building layers. The outline is written to a file named "Outline".

## OUTLINE GENERATION
* Develop a new outline based on the provided Project Parameters (genre, summary, etc.) or an existing Outline, incorporating any additional directions from the user message.
* If generating from parameters, ensure the outline includes detailed character descriptions, environment descriptions, sub-threads, chapter flows (broken down into acts or scenes), and visual descriptions of any key objects mentioned or implied in the parameters.
* If revising an existing Outline, incorporate user feedback and maintain consistency.
* Characters should be visually described, and given personalities, motivations, and rich histories relevant to the story parameters.
* Chapters should be broken down into acts or scenes. Estimate word counts per chapter if a target word count was provided in the parameters.
* The outline may also include notes on planned twists, storytelling devices, character developments, and more.
* Maintain consistency. If there are any storyline consistency problems based on the provided context or parameters, mention them to the user.
* The outline should always be written in Markdown and saved using the "writeFile" tool, passing "Outline" in the "file_name" parameter and the markdown content in the "content" parameter.
* CRITICAL: DO NOT output the outline content in your text response. ONLY provide it via the "writeFile" tool. Output only a brief summary in text.

## WRITING STYLE
* All files are written in markdown.
* Use headings as appropriate (e.g., ## Synopsis, ## Characters, ## Setting, ## Chapter Outlines).
* Use asterisks for lists.
* If creating a character, environment, or chapter list make sure to highlight that list item's name in **bold**.
* Italics are permitted only when writing a chapter. Do not use them in other contexts.
* Do not use code blocks, tables, task lists, emojis, highlights, images, or links. Strip them if they appear.


---
`
