import { MDXEditor, headingsPlugin, listsPlugin } from '@mdxeditor/editor'
import {
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  CreateLink,
  BlockTypeSelect
} from '@mdxeditor/editor'
import { useDispatch, useSelector } from 'react-redux'
import type { JSX } from 'react'

import '@mdxeditor/editor/style.css'
import { setProjectHasLiveEdits, selectProjects, updateFile } from '@/lib/utils/projectsSlice'

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
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {fileName ? (
        <>
          <h2 className="text-2xl font-bold mb-4">{fileName}</h2>
          <div className="flex-grow overflow-y-auto" style={{ fontFamily: '"Inter", sans-serif' }}>
            <MDXEditor
              markdown={
                projectState.activeProject?.files.find((file) => file.title == fileName)?.content ||
                ''
              }
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
                    </>
                  )
                })
              ]}
              contentEditableClassName="prose"
            />
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 mt-8">Select a file to view its content</p>
      )}
    </div>
  )
}
