import { AppDispatch } from '@/lib/store/store'
import { addChatMessage, setActionSuggestions } from '@/lib/store/chatSlice'
import { updateFile, updateReviews, updateChapter, setLastEdit } from '@/lib/store/projectsSlice'
import { setActiveSection, setActiveView } from '@/lib/store/appStateSlice'
import { findChapterById, getChaptersFromStoryContent, extractChapterContent, stripChapterId } from '@/lib/storyContent'
import { Project } from '@/types'

export const handleWriteFile = (
  fileName: string, // This is either a chapter ID or an artifact title
  content: string,
  dispatch: AppDispatch,
  activeProject: Project | null
) => {
  const storyContent = activeProject?.storyContent || ''

  // 1. Attempt exact ID lookup in storyContent
  const chapter = findChapterById(storyContent, fileName)
  if (chapter) {
    // It's a chapter!
    const lines = storyContent.split('\n')
    const matchIndex = lines.findIndex(line => line.trim().startsWith('# ') && line.includes(`id: ${fileName}`))
    const chapterIndex = lines.slice(0, matchIndex).filter(l => l.trim().startsWith('# ')).length

    // For highlighting, we need the FULL chapter content including the header
    const oldContentWithHeader = extractChapterContent(storyContent, '', fileName, true) || chapter.content
    
    // Ensure the new content also starts with a header for alignment
    let newContentWithHeader = content
    if (!newContentWithHeader.trim().startsWith('# ')) {
      const headerLine = lines[matchIndex].trim()
      newContentWithHeader = `${headerLine}\n\n${content}`
    }

    dispatch(
      setLastEdit({
        fileTitle: chapter.title,
        oldContent: oldContentWithHeader,
        newContent: newContentWithHeader,
        chapterIndex,
        chapterId: fileName
      })
    )

    dispatch(updateChapter({ chapterId: fileName, content: content }))
    
    // Force view switch so the user sees the highlights immediately
    dispatch(setActiveSection(`${chapter.title}|||${chapterIndex}|||${fileName}`))
    dispatch(setActiveView('project/editor'))
    
    return
  }

  // 2. Check artifacts in files[] by exact title match
  const artifactFile = activeProject?.files.find((f) => f.title === fileName)

  if (artifactFile) {
    // It's an artifact!
    dispatch(
      setLastEdit({
        fileTitle: fileName,
        oldContent: artifactFile.content || '',
        newContent: content
      })
    )

    let fileType = artifactFile.type || 'unknown'
    let sortOrder = artifactFile.sort_order || 0

    if (fileName.toLowerCase().includes('outline')) {
      fileType = 'outline'
      sortOrder = 0
    }

    dispatch(
      updateFile({
        title: fileName,
        content: content,
        type: fileType,
        sort_order: sortOrder
      })
    )
    return
  }

  // 3. Special case: Avoid creating artifacts for chapters or existing titles.
  const chapters = getChaptersFromStoryContent(storyContent)
  const matchingChapterByTitle = chapters.find(c => c.title.toLowerCase() === fileName.toLowerCase())

  if (matchingChapterByTitle) {
    // LLM used the title instead of the ID. Reject and instruct it.
    console.error(`handleWriteFile: AI used title "${fileName}" instead of ID "${matchingChapterByTitle.id}"`)
    dispatch(addChatMessage({ 
      sender: 'Gemini', 
      text: `Error: You tried to write to a chapter using its title ("${fileName}"). You MUST use its unique ID (e.g. "${matchingChapterByTitle.id}") found in the directory listing: "<!-- id: ${matchingChapterByTitle.id} --> ${fileName}". Please retry using verbatim "${matchingChapterByTitle.id}" as the file_name (do not add .md or any other text).` 
    }))
    return
  }

  // Final heuristic for NEW artifact creation: prevent chapter-like names from becoming files
  const isIdSnippet = /^[a-zA-Z0-9-]{5,15}$/.test(fileName)
  const lowerFileName = fileName.toLowerCase().replace(/\.md$/, '')
  const looksLikeChapter = 
    lowerFileName.includes('chapter') || 
    lowerFileName.startsWith('ch') || 
    /^[a-z]+-?\d+/.test(lowerFileName) || 
    /^\d+$/.test(lowerFileName)
  
  if (!isIdSnippet && looksLikeChapter) {
    console.error(`handleWriteFile: Rejected chapter-like filename "${fileName}" from artifact creation`)
    dispatch(addChatMessage({ 
      sender: 'Gemini', 
      text: `Error: "${fileName}" looks like a chapter identifier, but I couldn't find a matching ID. You MUST use the exact ID snippet (e.g. "abc123") from the directory listing. DO NOT use "ch1", "chapter-1", or "ch1.md".` 
    }))
    return
  }
  
  if (fileName.length > 3) {
    console.log(`handleWriteFile: Creating new artifact/file "${fileName}"`)
    const fileType = fileName.toLowerCase().includes('outline') ? 'outline' : 'unknown'
    
    dispatch(
      setLastEdit({
        fileTitle: fileName,
        oldContent: '',
        newContent: content
      })
    )

    dispatch(
      updateFile({
        title: fileName,
        content: content,
        type: fileType,
        sort_order: 100
      })
    )
    return
  }

  // 4. Fail loudly
  console.error(`handleWriteFile: No chapter ID or existing artifact found matching "${fileName}"`)
  dispatch(addChatMessage({ 
    sender: 'Gemini', 
    text: `Error: I couldn't find a matching chapter ID or file title for "${fileName}". For chapters, you MUST use the ID snippet verbatim from the directory listing, e.g. "<!-- id: abc123 --> Title" -> use "abc123" as the file_name.` 
  }))
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
