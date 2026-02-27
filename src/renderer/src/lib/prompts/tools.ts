//TOOL USE RULES//
export const getToolsPrompt = (tools: string[]) => `

---

# CURRENTLY AVAILABLE TOOLS:
${tools.map((t) => `* ${t}`).join('\n')}

# TOOL USE:
You have access to structured tools. When you need to perform an action, use the corresponding tool.
Tools are called natively via the model's tool-calling capabilities. Do not use XML-style tags.
You can use multiple tools in a single response.

${
  (tools.includes('writeFile'))
    ? `
## writeFile
* Writes content to the specified file.
* Overwrites the file if it already exists.
* File formats: Only Markdown files are supported.
* REQUIRED PARAMETERS:
  - "file_name" (string): The exact name of the file.
  - "content" (string): The full markdown content.
`
    : ''
}

${
  (tools.includes('readFile'))
    ? `
## readFile
* Requests the full contents of the specified files.
* Use this to retrieve content if you need to access information to complete the task.
* REQUIRED PARAMETERS:
  - "file_names" (string): The list of files to read, separated by commas (e.g. "Outline, Chapter 1").
`
    : ''
}

${
  (tools.includes('routeTo'))
    ? `
## routeTo
* Routes the user to a specialist agent.
* REQUIRED PARAMETERS:
  - "agent" (string): The name of the specialist agent (e.g. "outlineAgent", "writerAgent").
`
    : ''
}

${
  (tools.includes('actionSuggestion'))
    ? `
## actionSuggestion
* Suggests up to 3 possible next steps for the user.
* REQUIRED PARAMETERS:
  - "suggestions" (string): The list of suggestions, separated by commas (e.g. "Write chapter, Read Outline").
`
    : ''
}


---
`
