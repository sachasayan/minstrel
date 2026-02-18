//TOOL USE RULES//
export const getToolsPrompt = (tools: string[]) => `

---

# CURRENTLY AVAILABLE TOOLS:
${tools.map((t) => `* ${t}`).join('\n')}

# TOOL USE:
You have access to structured tools. When you need to perform an action, use the corresponding tool.
You can use multiple tools in a single response.

${
  (tools.includes('think') || tools.includes('reasoning'))
    ? `
## reasoning
* Use this tool to think out your actions. Break the current task down, decide which files you will need, and which tools you plan to use.
* Required. Must be included in every response.
`
    : ''
}

${
  (tools.includes('write_file') || tools.includes('writeFile'))
    ? `
## writeFile
* Writes content to the specified file.
* Overwrites the file if it already exists.
* File formats: Only Markdown files are supported.
`
    : ''
}

${
  (tools.includes('read_file') || tools.includes('readFile'))
    ? `
## readFile
* Requests the full contents of the specified files.
* Use this to retrieve content if you need to access information to complete the task.
`
    : ''
}

${
  (tools.includes('route_to') || tools.includes('routeTo'))
    ? `
## routeTo
* Routes the user to a specialist agent (outlineAgent, writerAgent, criticAgent).
`
    : ''
}

${
  (tools.includes('action_suggestion') || tools.includes('actionSuggestion'))
    ? `
## actionSuggestion
* Suggests up to 3 possible next steps for the user.
`
    : ''
}

${
  (tools.includes('message') || tools.includes('showMessage'))
    ? `
## showMessage
* A short 1-2 sentence message to the user explaining your actions.
`
    : ''
}

${
  (tools.includes('critique') || tools.includes('addCritique'))
    ? `
## addCritique
* Submits a JSON-formatted critique of the story.
`
    : ''
}

---
`
