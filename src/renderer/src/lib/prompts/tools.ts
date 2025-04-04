//TOOL USE RULES//
export const getToolsPrompt = (tools: string[]) => `

---

# CURRENTLY AVAILABLE TOOLS:
${tools.map((t) => `* <${t}>`).join('\n')}

# TOOL USE:

${tools.includes('think') && `
## THINK
\`\`\`xml
<think>(message)</think>
\`\`\`
* Allows you to think out your actions. Break the current task down, decide which files you will need, and which tools you plan to use.
* Required. Must be included in every response.
* Is not shown to the user, but will be seen in the debugging logs.
` || ''} ${tools.includes('write_file') && `
## WRITE_FILE:
\`\`\`xml
<write_file>
<file_name>{file_name}</file_name>
<content>{file_content}</content>
</write_file>
\`\`\`
* Writes content to the specified file.
* Overwrites the file if it already exists.
* Writes a new file if the file doesn't exist.

* Maximum file size for 'write_file': 20,000 characters
* File formats: Only Markdown files are supported.
` || ''} ${tools.includes('read_file') && `
## READ FILE:
\`\`\`xml
<read_file>{file_name}</read_file>
\`\`\`
* Requests the **full** contents of the specified file. This tool can be used multiple times in a single response to request multiple files.
* Use the <read_file> tool to retrieve the content of files if you need to access information within those files to complete the current task.
* It can also be used to request files you know will be needed for the next step in a sequence.
` || ''} ${tools.includes('sequence') && `
## SEQUENCE:
\`\`\`xml
<sequence>
{Markdown-numbered list of future actions in plain english.}
</sequence>
\`\`\`
* Initiates a sequence of actions. The sequence plan should be a Markdown numbered list. This tool can ONLY be used when the current sequence number is 0.
` || ''} ${tools.includes('action_suggestion') && `
## ACTION_SUGGESTION:
\`\`\`xml
<action_suggestion>(message)</action_suggestion>
\`\`\`
* A suggestion for the user's next possible task, written from their point of view. (ie "Write Chapter 3")
* No more than three <action_suggestion> tools may be used in one response.
* Action suggestions should be short — no more than 30 characters.
` || ''} ${tools.includes('message') && `
## MESSAGE:
\`\`\`xml
<message>(message)</message>
\`\`\`
* A message to the user regarding your current task.
* It should be no more than 1-2 sentences.
* Explain any tool use if any has occured.
 tool, briefly explaining the actions you have performed to the user in first person, such as: "I've written Chapter 3."
 ` || ''}
---
`
