import { ProjectFile } from '../types'

export const getBoldAsKey = (markdownString: string): string => {
  const match = markdownString.match(/^[*-]\s+\*\*([\p{L}\s]+)[-:]\*\*/iu) || []
  if (match[1]) {
    return match[1]
  }
  return ''
}

export const lineIsHeading = (markdownString: string): boolean => {
  return markdownString.search(/^#+/) != -1
}

export const stringToProjectFile = (markdownString: string): ProjectFile => {
  const lines = markdownString.trim().split('\n')
  let title = '(No title)'
  let content = markdownString
  for (const line of lines) {
    if (line.startsWith('----')) {
      title = line.replace(/----/, '')
    } else if (line.startsWith('#')) {
      title = line.replace(/^#+/, '').trim()
      content = lines
        .slice(lines.indexOf(line) + 1)
        .join('\n')
        .trim()
      break
    } else if (line.trim().length > 0) {
      break
    }
  }

  const wordcount = content.split(/\\s+/).filter((word) => word.length > 0).length
  return {
    title,
    content,
    wordcount,
    hasEdits: false
  }
}
