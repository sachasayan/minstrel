import { routingAgent } from './routingAgent'
import { outlineAgent } from './outlineAgent'
import { writerAgent } from './writerAgent'
import { criticAgent } from './criticAgent'
import { tools } from './tools'

export const promptUtils = {
  availableFiles (files) { this.value +=  `---\n\n# DIRECTORY LISTING: FILES IN PROJECT:\n\n${files.join('\n') || '(The user did not provide a listing of files in this project.)'}\n\n`; return this },
  providedFiles (files) { this.value +=  `---\n\n# ACTIVE FILES:\n\n${files.join('\n') || '(The user did not provide any files.)'}\n\n`; return this },
  fileContents (item) { this.value +=  `---\n\n# ACTIVE FILE CONTENTS:\n\n${item || '(The user did not provide any file contents.)'}\n\n`; return this },
  userPrompt (prompt) { this.value +=  `---\n\n# CURRENT TASK FROM USER: \n\n${prompt}\n\n`; return this },
  parameters (parameters) { this.value +=  `---\n\n# PARAMETERS FOR THE SKELETON:\n\n${parameters}\n\n`; return this },
  currentStep (currentStep) { this.value +=  `---\n\n# CURRENT STEP: \n\n${currentStep}\n\n`; return this },
  currentSequence (currentSequence) { this.value +=  `\n\n# A SEQUENCE IS ACTIVE: \n\n${currentSequence}\n\n`; return this },
}

const basePrompt = `
BEGIN SYSTEM PROMPT

# INTRODUCTION:
* You are Minstrel, an interactive AI assistant.
* You interact with the user through a chat interface, sending messages back and forth.
* You possess the special ability to use tools to perform actions.

# RECEIVING COMMUNICATIONS FROM THE USER:
* Communication from the user is in Markdown format.
* The user will also provide the desired task they'd like to perform.
* The user will also provide you with a list of tools currently available for your use.
* The user may provide you with additional information.

# COMMUNICATING TO THE USER:
* All communication with the user and all operations are performed through the use of tools, which resemble XML tags.
* You MUST therefore output ONLY within XML tags at the top level of your response.
* You MUST always begin your response by using the <think> tool
* You MUST always end your response by using the <message>

# BASIC TOOL USE:
* Multiple tools can generally be used in one response.
* If you think you are being asked to rewrite a file, the user must have already provided the contents of the dependencies for that file.
* If the user has not provided you with the contents of the dependencies for a file you are planning to write, you must first read the relevant files using the <read_file> tool.
* Multiple files can be written in one response, as long as all contents of the file dependencies are provided.

---

`

export function promptly() {
  return Object.create({
    value: `${basePrompt}`,
    ...criticAgent,
    ...outlineAgent,
    ...routingAgent,
    ...writerAgent,
    ...promptUtils,
    ...tools,
    beginUserPrompt() {
      this.value += `\n\n---\n\nEND SYSTEM PROMPT\nBEGIN USER PROMPT`;
      return this;
    },
    finish() {
      return this.value;
    }
  });
}

