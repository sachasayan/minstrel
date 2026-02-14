import { useEffect, ReactNode } from 'react'
import StatusBar from '@/components/StatusBar'
import { Button } from '@/components/ui/button'
import ProjectLibrary from '@/components/ProjectLibrary'
import { useDispatch, useSelector } from 'react-redux'
import { setProjectList, selectProjectList, setActiveView, setActiveSection } from '@/lib/store/appStateSlice' // setActiveView and setActiveSection are now used
import { setActiveProjectFromFragment, startNewProject } from '@/lib/store/projectsSlice'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { fetchProjects } from '@/lib/services/fileService'
import { cn } from '@/lib/utils'

const Intro = (): ReactNode => {
  const dispatch = useDispatch()

  const projectList = useSelector(selectProjectList)
  const settingsState = useSelector(selectSettingsState)


  const handleProjectSelect = (projectPath: string) => {
    if (projectPath == 'add') {
      dispatch(startNewProject())
      // dispatch(setActiveSection('Chapter 1|||0')) // Handled by projectListeners
      return
    }

    const project = projectList.find((p) => p.projectPath === projectPath)
    if (project) {
      dispatch(setActiveProjectFromFragment(project))
      // dispatch(setActiveSection('Chapter 1|||0')) // Handled by projectListeners
    }
  }

  const loadProjects = () => async (dispatch) => {
    // Ensure working directory is not null/empty before fetching
    const dir = settingsState?.workingRootDirectory;
    if (dir) {
      try {
        const projectsList = await fetchProjects(dir);
        dispatch(setProjectList(projectsList));
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        // Optionally dispatch an error state or show a toast
      }
    } else {
      console.log("Working directory not set, skipping project load.");
      dispatch(setProjectList([])); // Clear project list if directory is invalid
    }
  }

  useEffect(() => {
    // Trigger loadProjects only when workingRootDirectory is valid
    if (settingsState.workingRootDirectory) {
      console.log('Loading projects from: ' + settingsState.workingRootDirectory)
      dispatch(loadProjects() as any)
    } else {
      // Handle case where directory becomes invalid later (e.g., cleared in settings)
      dispatch(setProjectList([]));
    }
    // Depend on the specific setting property
  }, [settingsState.workingRootDirectory, dispatch])


  return (
    <>
      <StatusBar />
      <div className={cn(
        "flex flex-col items-center justify-center p-8 h-full",
        "animate-in fade-in zoom-in-95 gap-8 duration-300"
      )}>
        <h1 className="text-2xl font-bold text-highlight-700 ">Welcome to Minstrel</h1>

        <ProjectLibrary workingRootDirectory={settingsState?.workingRootDirectory || ''} projects={projectList} onProjectChange={handleProjectSelect} />

        <p className="outline rounded-2xl py-2 px-4 text-sm text-highlight-800">
          Minstrel is totally free for personal use. Like it?{' '}
          <a href="https://ko-fi.com/writewithminstrel" rel="noreferrer" className="cursor-pointer underline" target="_blank">
            Buy me a coffee.
          </a>{' '}
          ☕ ❤️
        </p>
      </div>
    </>
  )
}

export default Intro
