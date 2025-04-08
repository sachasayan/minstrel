import { MDXEditor, MDXEditorMethods, headingsPlugin, listsPlugin, thematicBreakPlugin } from '@mdxeditor/editor'
import { UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin, BlockTypeSelect, ListsToggle } from '@mdxeditor/editor'
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

  const handleContentChange = useCallback((content: string) => {
    if (title) {
      dispatch(updateFile({ title, content }))
      if (!projectState.projectHasLiveEdits) {
        dispatch(setProjectHasLiveEdits(true))
      }
    }

  }, [dispatch, projectState.activeProject?.files, projectState.projectHasLiveEdits, title])

  useEffect(() => {
    ref.current?.setMarkdown(projectState.activeProject?.files.find((file) => file.title == title)?.content || '')
  }, [projectState.activeProject?.files, title])

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
    <>


      <div className="relative container px-2 py-1 mx-auto md:p-24">
        {projectState.pendingFiles?.includes(title || '') && (
          <div className="absolute z-50 top-0 left-0 inset-0 bg-black opacity-50">
            <div className="loader sticky top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  size-20"></div>
          </div>
        )}

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
                    thematicBreakPlugin(),
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
    </>
  )
}
