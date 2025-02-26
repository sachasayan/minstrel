import { MDXEditor, MDXEditorMethods, headingsPlugin, listsPlugin } from '@mdxeditor/editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin, CreateLink, BlockTypeSelect, ListsToggle } from '@mdxeditor/editor'
import { useDispatch, useSelector } from 'react-redux'
import { useRef, useEffect, JSX, useCallback } from 'react'

import '@mdxeditor/editor/style.css'
import { setProjectHasLiveEdits, selectProjects, updateFile, renameFile } from '@/lib/store/projectsSlice'
import EditableHeading from './EditableHeading' // Import the new component

interface MarkdownViewerProps {
  title: string | null // Allow null
  content: string
}

export default function MarkdownViewer({ title }: MarkdownViewerProps): JSX.Element {
  const dispatch = useDispatch()
  const projectState = useSelector(selectProjects)
  const ref = useRef<MDXEditorMethods>(null)

  const handleContentChange = (content: string) => {
    if (title) {
      // Only update if title is not null
      dispatch(updateFile({ title, content }))
      if (!projectState.projectHasLiveEdits) {
        dispatch(setProjectHasLiveEdits(true))
      }
    }
  }

  useEffect(() => {
    ref.current?.setMarkdown(projectState.activeProject?.files.find((file) => file.title == title)?.content || '')
  }, [projectState.activeProject?.files])

  const handleError = (error: { error: string; source: string }) => {
    console.error('MDXEditor Error:', error.error)
    console.error('Source Markdown:', error.source)
  }

  const handleHeadlineChange = (newHeadline: string) => {
    if (title) {
      dispatch(renameFile({ oldTitle: title, newTitle: newHeadline }))
    }
  }


  return (
    <div className="relative container px-2 py-1 mx-auto md:p-24">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {title ? (
          <>

            <div className="col-span-3">
            </div>
            <div className="col-span-6">
              <EditableHeading heading={title} onHeadlineHasChanged={handleHeadlineChange} /> {/* REMOVE onHeadlineHasChanged prop */}
            </div>
            <div className="col-span-3">
            </div>
            <div className="col-span-3">

            </div>

            <div className="col-span-6">


              <MDXEditor
                ref={ref}
                className="mdx-theme h-full"
                markdown={projectState.activeProject?.files.find((file) => file.title == title)?.content || ''}
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
                        <BlockTypeSelect />
                        <ListsToggle options={['number', 'bullet']} />

                      </>
                    )
                  })
                ]}
                contentEditableClassName="prose"
              />
            </div>
            <div className="col-span-2">
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 mt-8">Select a file to view its content</p>
        )}
      </div>
    </div>
  )
}
