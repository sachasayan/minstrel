import { Project, ChatMessage } from '@/types'
import { ModelMessage } from 'ai'

export interface PromptData {
  activeProject: Project | null
  chatHistory: ChatMessage[]
}

export interface PromptSectionMetadata {
  key: string
  title: string
  contentLength: number
  hash: string
  itemCount?: number
}

export interface BuildPromptMetadata {
  agent: 'storyAgent'
  availableFiles: string[]
  resolvedRequestedFiles: string[]
  unresolvedRequestedFiles: string[]
  providedFiles: string[]
  sectionMetadata: PromptSectionMetadata[]
  systemLength: number
  systemHash: string
  messageCount: number
  messageHash: string
  syntheticContinueMessage: boolean
}

export interface BuildPromptResult {
  system: string
  messages: ModelMessage[]
  allowedTools: string[]
  metadata: BuildPromptMetadata
}
