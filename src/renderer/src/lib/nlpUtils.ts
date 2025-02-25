import { ProjectFile } from '../types'

export const stringToProjectFile = (markdownString: string): ProjectFile => {
  const lines = markdownString.split('\\n')
  let title = 'Untitled'
  let content = markdownString
  for (const line of lines) {
    if (line.startsWith('#')) {
      title = line.replace(/^#+/, '').trim() // Remove leading #s and trim
      content = lines.slice(lines.indexOf(line) + 1).join('\\n').trim()
      break
    }
  }

  const wordcount = content.split(/\\s+/).filter(word => word.length > 0).length
  return {
    title,
    content,
    wordcount,
    hasEdits: false,
  }
}
