import { AppDispatch } from '@/lib/store/store'
import { addChatMessage, setActionSuggestions } from '@/lib/store/chatSlice'
import { updateFile, updateReviews, updateChapter, setLastEdit } from '@/lib/store/projectsSlice'
import { extractChapterContent } from '@/lib/storyContent'
import { Project } from '@/types'

export const handleWriteFile = (
  fileName: string,
  content: string,
  dispatch: AppDispatch,
  activeProject: Project | null
) => {
  let oldContent = ''

  let chapterIndex: number | undefined = undefined
  let chapterId: string | undefined = undefined
  if (fileName.toLowerCase().includes('chapter')) {
    // Find chapter content in monolithic storyContent
    const storyContent = activeProject?.storyContent || ''
    const lines = storyContent.split('\n')
    const matchIndex = lines.findIndex(line => {
       const normalizedTitle = fileName.trim().toLowerCase()
       const trimmedLine = line.trim().toLowerCase()
       return trimmedLine.startsWith('# ') && (trimmedLine.includes(normalizedTitle) || normalizedTitle.includes(trimmedLine.replace(/^#\s+/, '')))
    })
    
    if (matchIndex !== -1) {
       chapterIndex = lines.slice(0, matchIndex).filter(l => l.trim().startsWith('# ')).length
       
       // Try to extract ID from the header line
       const idMatch = lines[matchIndex].match(/<!--\s*id:\s*([a-zA-Z0-9-]+)\s*-->/)
       if (idMatch) {
         chapterId = idMatch[1]
       }
    }

    // Surgical extraction using ID if possible
    oldContent = extractChapterContent(storyContent, fileName, chapterId) || ''
  } else {
    const file = activeProject?.files.find((f) => f.title === fileName)
    oldContent = file?.content || ''
  }

  // Record the edit for highlighting
  dispatch(
    setLastEdit({
      fileTitle: fileName,
      oldContent: oldContent,
      newContent: content,
      chapterIndex,
      chapterId
    })
  )

  let fileType = 'unknown'
  let sortOrder = 0

  if (fileName.toLowerCase().includes('outline')) {
    fileType = 'outline'
    sortOrder = 0

    dispatch(
      updateFile({
        title: fileName,
        content: content,
        type: fileType,
        sort_order: sortOrder
      })
    )
  } else if (fileName.toLowerCase().includes('chapter')) {
    dispatch(updateChapter({ title: fileName, content: content }))
  } else {
    dispatch(
      updateFile({
        title: fileName,
        content: content,
        type: fileType,
        sort_order: sortOrder
      })
    )
  }
}

export const handleCritique = (critiqueString: string, dispatch: AppDispatch) => {
  try {
    const payload = JSON.parse(critiqueString)
    dispatch(updateReviews(payload))
  } catch (error) {
    console.error('Error parsing critique JSON:', error)
    dispatch(addChatMessage({ sender: 'Gemini', text: 'Error parsing critique from AI response.' }))
  }
}

export const handleMessage = (text: string, dispatch: AppDispatch) => {
  dispatch(addChatMessage({ sender: 'Gemini', text }))
}

export const handleActionSuggestions = (suggestions: string[] | undefined, dispatch: AppDispatch) => {
  if (suggestions && suggestions.length > 0) {
    const flattened = suggestions.map((item) => `${item}`).slice(0, 3)
    dispatch(setActionSuggestions(flattened))
  } else {
    dispatch(setActionSuggestions([]))
  }
}
