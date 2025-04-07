import { useState, useEffect, ReactNode } from 'react' // Removed React import, kept ReactNode
// Removed Settings import as it's no longer rendered directly here
// Removed Versions import as it's moved to SettingsPage
import { Button } from '@/components/ui/button'
import ProjectLibrary from '@/components/ProjectLibrary'
import { BookOutlineWizard } from '@/pages/BookOutlineWizard'
// Removed Dialog imports
import { useDispatch, useSelector } from 'react-redux'
import { setProjectList, selectProjectList, setActiveView } from '@/lib/store/appStateSlice' // setActiveView is now used
import { setActiveProjectFromFragment } from '@/lib/store/projectsSlice'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { fetchProjects } from '@/lib/services/fileService'

const Intro = (): ReactNode => { // Changed return type to ReactNode
  const dispatch = useDispatch()
  const [showBookOutlineWizard, setShowBookOutlineWizard] = useState(false)
  const projectList = useSelector(selectProjectList)
  const settingsState = useSelector(selectSettingsState)

  const handleProjectSelect = (projectPath: string) => {
    if (projectPath == 'add') {
      setShowBookOutlineWizard(true)
      //dispatch(setActiveView('wizard')) // Keep commented if wizard view isn't fully implemented
      return
    }

    const project = projectList.find((p) => p.projectPath === projectPath)
    if (project) {
      dispatch(setActiveProjectFromFragment(project))
      dispatch(setActiveView('project/dashboard'))
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

  // Function to navigate to the settings page
  const goToSettings = () => {
    dispatch(setActiveView('settings'))
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full">
      <h1 className="text-2xl font-bold mb-4">Welcome to Minstrel</h1>
      <p className="text-gray-500 mb-2">Start a new project or set your project directory to begin.</p>
      <ProjectLibrary workingRootDirectory={settingsState?.workingRootDirectory || ''} projects={projectList} onProjectChange={handleProjectSelect} />

      {/* Updated Settings Button */}
      <div className="mt-12">
        <Button variant="outline" onClick={goToSettings}>Settings</Button>
      </div>
      {/* Removed Dialog and Versions component */}

      <p className="text-gray-300 m-4 text-xs">Current project path: {settingsState?.workingRootDirectory || 'Not Set'}</p>

      <p className="outline rounded-2xl py-2 px-4 text-sm text-gray-800 m-4">
        Minstrel is totally free for personal use. Like it?{' '}
        <a href="https://ko-fi.com/writewithminstrel" rel="noreferrer" className="cursor-pointer underline" target="_blank">
          Buy me a coffee.
        </a>{' '}
        ☕ ❤️
      </p>

      <BookOutlineWizard open={showBookOutlineWizard} onOpenChange={setShowBookOutlineWizard} />
    </div>
  )
}

export default Intro
