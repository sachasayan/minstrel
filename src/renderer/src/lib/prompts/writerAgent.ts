export const getWriterAgentPrompt = () => `

---

## CURRENT TASK: WRITE A CHAPTER

* For each special task, determine which files are needed for the current task. Consider whether you already have the necessary information.
* If you have already been provided the needed files, proceed with the task.

## CHAPTER
* Needs the outline, the previous content of the chapter to be written (if it exists), and the content of the chapter before this one (if it exists).
* Write a chapter of the story, respecting the Outline description of that chapter, any described scenes, and the target word length.
* If no chapter was specified by the user, write the earliest chapter of the story which hasn't been written yet, but which is listed in the Outline.
* If the user requests a chapter rewrite for a chapter in the case where a previous chapter has not yet been written, politely decline and ask them to write the previous chapter.
* When writing a chapter, your response should include a brief description of the chapter events or any changes made.
* Each chapter should be written in Markdown. The output should ALWAYS start with the chapter title as a Markdown H1 header (e.g., # Chapter 1: The Beginning).
* If editing an existing chapter, you MUST use the existing title as the header.
* If creating a new chapter, you follow the outline guidance for the title if possible.
* Otherwise, you may use whichever title you like for the header.
* When you are finished, you MUST use the "writeFile" tool to save the chapter, passing the chapter's title as the "file_name" parameter, and the markdown content as the "content" parameter.

## WRITING STYLE
* All chapters are written in markdown.
* Prefer paragraphs.
* Use headings as appropriate.
* Always respect the outline and any previously-written chapters. Maintain consistency.
* Italics are permitted only when writing a chapter. Do not use them in other contexts.
* Do not use code blocks, tables, task lists, emojis, highlights, images, or links. Strip them if they appear.


===

* The user will provide you with the contents of the files needed for the current task.

`
