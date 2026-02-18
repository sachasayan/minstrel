import { XMLParser } from 'fast-xml-parser'
import { RequestContext } from '@/types'

export const isValidAgentType = (agent: string): agent is 'routingAgent' | 'criticAgent' | 'outlineAgent' | 'writerAgent' => {
  return ['routingAgent', 'criticAgent', 'outlineAgent', 'writerAgent'].includes(agent)
}

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  isArray: (name, jpath) => {
    // Ensure 'title' within 'titles' is always treated as an array
    if (jpath === 'root.titles.title') return true
    return ['root.read_file'].includes(jpath) ? true : false
  }
})

export interface ParsedResponse {
  context: RequestContext
  tools: {
    writeFile?: { file_name: string; content: string }
    sequence?: string
    critique?: string
    message?: string
    actionSuggestions?: string[]
  }
  think?: string
}

export const parseLLMResponse = (responseString: string): ParsedResponse | null => {
  let root
  try {
    root = parser.parse(`<root>${responseString}</root>`).root
  } catch (parsingError) {
    console.error('XML Parsing Error:', parsingError)
    return null
  }

  const context: RequestContext = {
    currentStep: 0,
    agent: 'routingAgent'
  }

  const tools: ParsedResponse['tools'] = {}
  
  if (root?.think) {
    console.log('AI Thoughts:', root.think)
  }

  if (!!root?.route_to) {
    if (isValidAgentType(root.route_to)) {
      context.agent = root.route_to
    } else {
      console.warn(`Invalid agent type received from AI: ${root.route_to}. Defaulting to routingAgent.`)
    }
  }

  if (!!root?.read_file) {
    context.requestedFiles = root.read_file
  }

  if (!!root?.write_file) {
    tools.writeFile = {
      file_name: root.write_file.file_name,
      content: root.write_file.content
    }
  }

  if (!!root?.sequence) {
    tools.sequence = root.sequence.sequence
  }

  if (!!root?.critique) {
    tools.critique = root.critique
  }

  if (!!root?.message) {
    tools.message = root.message
  }

  if (!!root?.action_suggestion) {
    tools.actionSuggestions = Array.isArray(root.action_suggestion) 
      ? root.action_suggestion.map(String) 
      : [String(root.action_suggestion)]
  }

  return {
    context,
    tools,
    think: root?.think
  }
}
