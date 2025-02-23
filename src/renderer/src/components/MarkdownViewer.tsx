import { MDXEditor, headingsPlugin, listsPlugin } from '@mdxeditor/editor'
import { ScrollArea } from '@/components/ui/scroll-area'

import { UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin, CreateLink, BlockTypeSelect, ListsToggle } from '@mdxeditor/editor'
import { useDispatch, useSelector } from 'react-redux'
import type { JSX } from 'react'

import '@mdxeditor/editor/style.css'
import { setProjectHasLiveEdits, selectProjects, updateFile } from '@/lib/store/projectsSlice'

interface MarkdownViewerProps {
  fileName: string | null // Allow null
  content: string
}

export default function MarkdownViewer({ fileName }: MarkdownViewerProps): JSX.Element {
  const dispatch = useDispatch()
  const projectState = useSelector(selectProjects)

  const handleContentChange = (content: string) => {
    if (fileName) {
      // Only update if fileName is not null
      dispatch(updateFile({ fileName, fileContent: content }))
      if (!projectState.projectHasLiveEdits) {
        dispatch(setProjectHasLiveEdits(true))
      }
    }
  }

  const handleError = (error: { error: string; source: string }) => {
    console.error('MDXEditor Error:', error.error)
    console.error('Source Markdown:', error.source)
  }

  return (
    <div className="relative px-2 py-1  md:px-36 md:py-20 max-h-full rounded-md">
      {fileName ? (
        <>
          <MDXEditor
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
