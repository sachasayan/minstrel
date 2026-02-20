import { Project, ChatMessage } from '@/types'

export interface PromptData {
  activeProject: Project | null
  chatHistory: ChatMessage[]
}

export interface BuildPromptResult {
  system: string
  userPrompt: string
  allowedTools: string[]
}
