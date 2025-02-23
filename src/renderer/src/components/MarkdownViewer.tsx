import { MDXEditor, MDXEditorMethods, headingsPlugin, listsPlugin } from '@mdxeditor/editor'

import { UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin, CreateLink, BlockTypeSelect, ListsToggle } from '@mdxeditor/editor'
import { useDispatch, useSelector } from 'react-redux'
import { useRef, useEffect, JSX } from 'react'

import '@mdxeditor/editor/style.css'
import { setProjectHasLiveEdits, selectProjects, updateFile } from '@/lib/store/projectsSlice'

interface MarkdownViewerProps {
  fileName: string | null // Allow null
  content: string
}

export default function MarkdownViewer({ fileName }: MarkdownViewerProps): JSX.Element {
  const dispatch = useDispatch()
  const projectState = useSelector(selectProjects)
  const ref = useRef<MDXEditorMethods>(null)

  const handleContentChange = (content: string) => {
    if (fileName) {
      // Only update if fileName is not null
      dispatch(updateFile({ fileName, fileContent: content }))
      if (!projectState.projectHasLiveEdits) {
        dispatch(setProjectHasLiveEdits(true))
      }
    }
  }

  useEffect(() => {
    ref.current?.setMarkdown(projectState.activeProject?.files.find((file) => file.title == fileName)?.content || '')
  }, [projectState.activeProject?.files])

  const handleError = (error: { error: string; source: string }) => {
    console.error('MDXEditor Error:', error.error)
    console.error('Source Markdown:', error.source)
  }

  return (
    <div className="relative px-2 py-1 mx-auto max-w-[1000px] md:px-36 md:py-20 max-h-full rounded-md">
      {fileName ? (
        <>
          <MDXEditor
            ref={ref}
            className="mdx-theme h-full"
            markdown={projectState.activeProject?.files.find((file) => file.title == fileName)?.content || ''}
            onChange={handleContentChange}
            onError={handleError}
            plugins={[
              headingsPlugin(),
              listsPlugin(), // Add listsPlugin
              toolbarPlugin({
                toolbarClassName: 'mdx-toolbar',
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <CreateLink />
                    <BlockTypeSelect />
                    <ListsToggle />
                  </>
                )
              })
            ]}
            contentEditableClassName="prose"
          />
        </>
      ) : (
        <p className="text-center text-gray-500 mt-8">Select a file to view its content</p>
      )}
    </div>
  )
}
