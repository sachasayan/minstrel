import { useState, useEffect } from 'react'
import Settings from '@/components/Settings'
import Versions from '@/components/Versions'
import { Button } from '@/components/ui/button'
import ProjectLibrary from '@/components/ProjectLibrary'
import { BookOutlineWizard } from '@/pages/BookOutlineWizard'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useDispatch, useSelector } from 'react-redux'
import { setProjectList, selectProjectList, setActiveView } from '@/lib/store/appStateSlice'
import { setActiveProjectFromFragment } from '@/lib/store/projectsSlice'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { fetchProjects } from '@/lib/services/projectManager'

const Intro = (): JSX.Element => {
  const dispatch = useDispatch()
  const [showBookOutlineWizard, setShowBookOutlineWizard] = useState(false)
  const projectList = useSelector(selectProjectList)
  const settingsState = useSelector(selectSettingsState)

  const handleProjectSelect = (projectId: string) => {
    if (projectId == 'add') {
      setShowBookOutlineWizard(true)
      //dispatch(setActiveView('wizard'))
      return
    }

    const project = projectList.find((p) => p.id === projectId)
    if (project) {
      dispatch(setActiveProjectFromFragment(project))
      dispatch(setActiveView('project/dashboard'))
    }
  }

  const loadProjects = () => async (dispatch) => {
    const projectsList = await fetchProjects(settingsState?.workingRootDirectory || '')
    dispatch(setProjectList(projectsList))
  }

  useEffect(() => {
    if (!!settingsState.workingRootDirectory) {
      console.log('Loading projects:' + settingsState.workingRootDirectory)
      dispatch(loadProjects() as any)
    }
  }, [settingsState.workingRootDirectory])

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full">
      <h1 className="text-2xl font-bold mb-4">Welcome to Minstrel</h1>
      <p className="text-gray-500 mb-2">Start a new project or set your project directory to begin.</p>
      <ProjectLibrary workingRootDirectory={settingsState?.workingRootDirectory || ''} projects={projectList} onProjectChange={handleProjectSelect} />

      <p className="text-gray-500 m-8">Current project path: {settingsState?.workingRootDirectory || ''}</p>

      <div className="m-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Settings</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] p-8">
            <Settings />
            <Versions />
          </DialogContent>
        </Dialog>
      </div>

      <BookOutlineWizard open={showBookOutlineWizard} onOpenChange={setShowBookOutlineWizard} />
    </div>
  )
}

export default Intro
