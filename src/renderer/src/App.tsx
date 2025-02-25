import { ReactNode, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveView } from '@/lib/store/appStateSlice'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { setSettingsState } from '@/lib/store/settingsSlice'
import { defaultSettings } from '@/lib/services/settingsService'
import { Toaster } from '@/components/ui/sonner'
import OnboardingDialog from '@/components/OnboardingDialog'

import ProjectOverview from '@/pages/ProjectOverview'
import Intro from '@/pages/Intro'

export default function App(): ReactNode {
  const dispatch = useDispatch()
  // const settings = useSelector(selectSettingsState)
  const activeProject = useSelector(selectActiveProject)
  const activeView = useSelector(selectActiveView)

  const [hasLoaded, setHasLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const loadSettings = () => async (dispatch) => {
    console.log('Loading settings')
    const appSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
    if (!appSettings?.workingRootDirectory || !appSettings?.apiKey) {
      console.log(appSettings)
      setShowOnboarding(true)
    } else {
      dispatch(
        setSettingsState({
          api: appSettings?.api || defaultSettings.api,
          apiKey: appSettings?.apiKey || defaultSettings.apiKey,
          workingRootDirectory: appSettings?.workingRootDirectory || defaultSettings.workingRootDirectory
        })
      )
    }
  }

  const router = (activeView) => {
    switch (activeView) {
      case 'intro':
        return <Intro />
      case 'wizard':
        return null // was <Wizard /> - component not defined in file
      case 'project/outline':
      case 'project/parameters':
      case 'project/dashboard':
      case 'project/editor':
        return <ProjectOverview key={activeProject?.fullPath} />
      default:
        return <Intro />
    }
  }

  // Load settings on first boot
  useEffect(() => {
    if (!hasLoaded) {
      dispatch(loadSettings() as any)
      setHasLoaded(true)
    }
  }, [])

  return (
    <>
      <div className="h-screen">
        {router(activeView)}
        <Toaster position="bottom-center" richColors />
      </div>

      <OnboardingDialog showOnboarding={showOnboarding} setShowOnboarding={setShowOnboarding} />
    </>
  )
}
