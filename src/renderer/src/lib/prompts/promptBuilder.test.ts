import { describe, it, expect } from 'vitest'
import * as pb from './promptBuilder'
import { PromptData } from './types'
import { RequestContext, Project, ChatMessage, AppSettings } from '@/types'

describe('promptBuilder', () => {
  const mockProject: Project = {
    title: 'Test Project',
    storyContent: '# <!-- id: id1 --> Chapter 1: The Beginning\nOnce upon a time...',
    files: [
      { title: 'Outline', content: 'Test outline content' },
      { title: 'World', content: 'Test world content' }
    ],
    projectPath: '/test',
    genre: 'fantasy',
    wordCountTarget: 50000,
    wordCountCurrent: 100,
    year: 2024,
    expertSuggestions: [],
    knowledgeGraph: null,
    summary: 'Test summary'
  }

  const mockChat: ChatMessage[] = [
    { sender: 'User', text: 'Hello AI' },
    { sender: 'Gemini', text: 'Hello User' },
    { sender: 'User', text: 'Write a chapter' }
  ]

  const mockData: PromptData = {
    activeProject: mockProject,
    chatHistory: mockChat
  }

  const mockSettings: AppSettings = {
    writingSample: '',
    writingStyleDescription: ''
  }

  it('getAvailableFiles returns all files including virtual chapters with IDs', () => {
    const files = pb.getAvailableFiles(mockData)
    expect(files).toContain('Outline')
    expect(files).toContain('World')
    expect(files).toContain('<!-- id: id1 --> Chapter 1: The Beginning')
  })

  it('getProvidedFiles filters available files', () => {
    const provided = pb.getProvidedFiles(mockData, ['Outline', 'NonExistent'])
    expect(provided).toEqual(['Outline'])
  })

  it('resolves bare chapter IDs to the display-form chapter entry', () => {
    const resolved = pb.resolveRequestedFiles(mockData, ['id1', 'Outline'])
    expect(resolved.resolvedFiles).toEqual(['<!-- id: id1 --> Chapter 1: The Beginning', 'Outline'])
    expect(resolved.unresolvedFiles).toEqual([])
  })

  it('getFileContents returns concatenated contents (handles ID suffix)', () => {
    const contents = pb.getFileContents(mockData, ['Outline', '<!-- id: id1 --> Chapter 1: The Beginning'])
    expect(contents).toContain('Test outline content')
    expect(contents).toContain('Once upon a time...')
  })

  it('buildPrompt returns correct structure for storyAgent', () => {
    const context: RequestContext = {
      agent: 'storyAgent',
      currentStep: 0
    }
    const result = pb.buildPrompt(context, mockData, mockSettings)
    expect(result.messages).toHaveLength(3) // 3 messages in mockChat + ensuring last is user (already user in mock)
    expect(result.allowedTools).toHaveLength(3)
    expect(result.allowedTools).toContain('writeFile')
    expect(result.allowedTools).toContain('readFile')
    expect(result.allowedTools).toContain('actionSuggestion')
    expect(result.allowedTools).not.toContain('routeTo')
    expect(result.metadata.agent).toBe('storyAgent')
    expect(result.metadata.sectionMetadata.some((section) => section.key === 'toolsPrompt')).toBe(true)
    expect(result.metadata.systemHash).toMatch(/^fnv1a:/)
  })

  it('buildPrompt includes writing style personalization for storyAgent when available', () => {
    const context: RequestContext = {
      agent: 'storyAgent',
      currentStep: 0
    }
    const result = pb.buildPrompt(context, mockData, {
      ...mockSettings,
      writingStyleDescription: 'Measured first-person voice with lyrical imagery and long, winding sentences.'
    })

    expect(result.system).toContain('PERSONALIZATION: TARGET WRITING STYLE')
    expect(result.system).toContain('Measured first-person voice with lyrical imagery')
  })

  it('buildPrompt omits writing style personalization when description is blank', () => {
    const context: RequestContext = {
      agent: 'storyAgent',
      currentStep: 0
    }
    const result = pb.buildPrompt(context, mockData, {
      ...mockSettings,
      writingStyleDescription: '   '
    })

    expect(result.system).not.toContain('PERSONALIZATION: TARGET WRITING STYLE')
  })

  it('buildPrompt auto-includes the outline for storyAgent', () => {
    const context: RequestContext = {
      agent: 'storyAgent',
      currentStep: 0
    }
    const result = pb.buildPrompt(context, mockData, mockSettings)
    expect(result.metadata.providedFiles).toContain('Outline')
  })

  it('buildMessages notes when a synthetic continue message is added', () => {
    const { messages, syntheticContinueMessage } = pb.buildMessages({
      activeProject: mockProject,
      chatHistory: [{ sender: 'Gemini', text: 'Need anything else?' }]
    })

    expect(messages[messages.length - 1]).toEqual({ role: 'user', content: '(Continue)' })
    expect(syntheticContinueMessage).toBe(true)
  })
})
