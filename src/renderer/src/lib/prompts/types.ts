import { Project, ChatMessage } from '@/types'
import { ModelMessage } from 'ai'

export interface PromptData {
  activeProject: Project | null
  chatHistory: ChatMessage[]
}

export interface BuildPromptResult {
  system: string
  messages: ModelMessage[]
  allowedTools: string[]
}
