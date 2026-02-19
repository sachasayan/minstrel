// Base prompt shared across agents
export const basePrompt = `
BEGIN SYSTEM PROMPT

# INTRODUCTION:
* You are Minstrel, an interactive AI assistant.
* You interact with the user through a chat interface, providing helpful responses and performing actions.
* You possess the special ability to use tools to perform actions within the project.

# RECEIVING COMMUNICATIONS FROM THE USER:
* Communication from the user is in Markdown format.
* The user will provide the desired task they'd like to perform.
* The user will provide you with a list of tools currently available for your use.
* The user may provide you with additional information or files.

# COMMUNICATING TO THE USER:
* You may use multiple tools in a single response to complete complex tasks.
* Your response should consist of a mix of tool calls and conversational text.
* Conversational text should be used to explain your actions, answer questions, or prompt the user for more information.

# BASIC TOOL USE:
* Multiple tools can generally be used in one response.
* If you think you are being asked to rewrite a file, ensure you have already read its dependencies.
* If you need access to a file's content, use the "readFile" tool.
* When writing or updating files, ensure you use the "writeFile" tool with the full updated content.

---

`

export const separator = '\n\n---\n\n'

// --- Pure Utility Functions ---

/**
 * Appends a new major section (like Agent or Tools prompt) to the main prompt using the standard separator.
 * Skips appending if the sectionToAdd is empty or null.
 */
export function appendWithSeparator(prompt: string, sectionToAdd: string | null | undefined): string {
  if (!sectionToAdd || sectionToAdd.trim() === '') {
    return prompt
  }
  // Ensure the base prompt doesn't accidentally start with the separator if it was empty
  if (prompt.trim() === '') {
    return sectionToAdd;
  }
  return `${prompt}${separator}${sectionToAdd}`
}


/**
 * Adds a formatted subsection (like Available Files, User Prompt) with a title.
 * Uses the internal separator before the title.
 */
function addFormattedSection(prompt: string, sectionTitle: string, content: string): string {
  if (!content || content.trim() === '') {
    return prompt // Don't add empty sections
  }
  // Note: The separator is used *before* the # Title line for these subsections
  return `${prompt}${separator}# ${sectionTitle}:\n\n${content}\n\n`
}


export function addAvailableFiles(prompt: string, files: string[]): string {
  const content = files.join('\n') || '(The user did not provide a listing of files in this project.)'
  return addFormattedSection(prompt, 'DIRECTORY LISTING: FILES IN PROJECT', content)
}

export function addProvidedFiles(prompt: string, files: string[]): string {
  const content = files.join('\n') || '(The user did not provide any files.)'
  return addFormattedSection(prompt, 'ACTIVE FILES', content)
}

export function addFileContents(prompt: string, item: string): string {
  const content = item || '(The user did not provide any file contents.)'
  return addFormattedSection(prompt, 'ACTIVE FILE CONTENTS', content)
}

export function addUserPrompt(prompt: string, userMessage: string): string {
  const content = userMessage || '(No user prompt provided for this turn.)'
  return addFormattedSection(prompt, 'CURRENT TASK FROM USER', content)
}

export function addParameters(prompt: string, parameters: string): string {
  // Assuming parameters is already a formatted string or object stringified
  const content = parameters || '(No parameters provided.)'
  return addFormattedSection(prompt, 'PARAMETERS FOR THE OUTLINE', content)
}

export function addCurrentStep(prompt: string, currentStep: number | undefined): string {
  if (currentStep === undefined || currentStep < 0) {
    return prompt // Don't add if step is invalid or not applicable
  }
  const content = `${currentStep}`
  return addFormattedSection(prompt, 'CURRENT STEP', content)
}

export function addCurrentSequence(prompt: string, currentSequence: string | undefined): string {
  if (!currentSequence) {
    return prompt // Don't add if no sequence is active
  }
  const content = currentSequence
  return addFormattedSection(prompt, 'A SEQUENCE IS ACTIVE', content)
}

export function addBeginUserPrompt(prompt: string): string {
  return `${prompt}${separator}END SYSTEM PROMPT\nBEGIN USER PROMPT`
}
