import { describe, it, expect } from 'vitest'
import * as pb from './promptBuilder'
import { PromptData } from './types'
import { RequestContext, Project, ChatMessage } from '@/types'

describe('promptBuilder', () => {
  const mockProject: Project = {
    title: 'Test Project',
    storyContent: '# Chapter 1: The Beginning\nOnce upon a time...',
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

  it('getAvailableFiles returns all files including virtual chapters', () => {
    const files = pb.getAvailableFiles(mockData)
    expect(files).toContain('Outline')
    expect(files).toContain('World')
    expect(files).toContain('Chapter 1: The Beginning')
  })

  it('getProvidedFiles filters available files', () => {
    const provided = pb.getProvidedFiles(mockData, ['Outline', 'NonExistent'])
    expect(provided).toEqual(['Outline'])
  })

  it('getFileContents returns concatenated contents', () => {
    const contents = pb.getFileContents(mockData, ['Outline', 'Chapter 1: The Beginning'])
    expect(contents).toContain('Test outline content')
    expect(contents).toContain('Once upon a time...')
  })

  it('getLatestUserMessage trims and returns latest user text', () => {
    const msg = pb.getLatestUserMessage(mockData)
    expect(msg).toBe('Write a chapter')
  })

  it('buildPrompt returns correct structure for writerAgent', () => {
    const context: RequestContext = {
      agent: 'writerAgent',
      currentStep: 0
    }
    const result = pb.buildPrompt(context, mockData)
    expect(result.userPrompt).toBeDefined()
    expect(result.allowedTools).toHaveLength(1)
    expect(result.allowedTools).toContain('writeFile')
    expect(result.allowedTools).not.toContain('routeTo')
  })

  it('buildPrompt returns correct structure for routingAgent', () => {
    const context: RequestContext = {
      agent: 'routingAgent',
      currentStep: 0
    }
    const result = pb.buildPrompt(context, mockData)
    expect(result.allowedTools).toContain('routeTo')
    expect(result.allowedTools).toContain('readFile')
  })
})
