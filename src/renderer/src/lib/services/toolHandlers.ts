import { store } from '@/lib/store/store'
import { addChatMessage, setActionSuggestions } from '@/lib/store/chatSlice'
import { updateFile, updateReviews, updateChapter, setLastEdit } from '@/lib/store/projectsSlice'
import { extractChapterContent } from '@/lib/storyContent'

export const handleWriteFile = (fileName: string, content: string) => {
  const activeProject = store.getState().projects.activeProject
  let oldContent = ''

  let chapterIndex: number | undefined = undefined
  if (fileName.toLowerCase().includes('chapter')) {
    // Find chapter content in monolithic storyContent
    oldContent = extractChapterContent(activeProject?.storyContent || '', fileName) || ''
    
    // Find which index this chapter has
    const storyContent = activeProject?.storyContent || ''
    const lines = storyContent.split('\n')
    const matchIndex = lines.findIndex(line => {
       const normalizedTitle = fileName.trim().toLowerCase()
       const trimmedLine = line.trim().toLowerCase()
       return trimmedLine.startsWith('# ') && (trimmedLine.includes(normalizedTitle) || normalizedTitle.includes(trimmedLine.replace(/^#\s+/, '')))
    })
    if (matchIndex !== -1) {
       chapterIndex = lines.slice(0, matchIndex).filter(l => l.trim().startsWith('# ')).length
    }
  } else {
    const file = activeProject?.files.find((f) => f.title === fileName)
    oldContent = file?.content || ''
  }

  // Record the edit for highlighting
  store.dispatch(
    setLastEdit({
      fileTitle: fileName,
      oldContent: oldContent,
      newContent: content,
      chapterIndex
    })
  )

  let fileType = 'unknown'
  let sortOrder = 0 // Default sort order

  // Infer type and sort_order based on filename
  if (fileName.toLowerCase().includes('outline')) {
    fileType = 'outline'
    sortOrder = 0 // Outline always comes first

    store.dispatch(
      updateFile({
        title: fileName,
        content: content,
        type: fileType,
        sort_order: sortOrder
      })
    )
  } else if (fileName.toLowerCase().includes('chapter')) {
    // Chapters are updated surgically in the monolithic storyContent
    store.dispatch(updateChapter({ title: fileName, content: content }))
  } else {
    // Dispatch updateFile for any other file types
    store.dispatch(
      updateFile({
        title: fileName,
        content: content,
        type: fileType,
        sort_order: sortOrder
      })
    )
  }
}

export const handleCritique = (critiqueString: string) => {
  try {
    const payload = JSON.parse(critiqueString)
    store.dispatch(updateReviews(payload))
    console.log('Critique content dispatched to store:', payload)
  } catch (error) {
    console.error('Error parsing critique JSON:', error)
    store.dispatch(addChatMessage({ sender: 'Gemini', text: 'Error parsing critique from AI response.' }))
  }
}

export const handleMessage = (text: string) => {
  store.dispatch(addChatMessage({ sender: 'Gemini', text }))
}

export const handleActionSuggestions = (suggestions: string[] | undefined) => {
  if (suggestions && suggestions.length > 0) {
    const flattened = suggestions.map((item) => `${item}`).slice(0, 3)
    store.dispatch(setActionSuggestions(flattened))
  } else {
    store.dispatch(setActionSuggestions([])) // Clear suggestions if not present
  }
}
