import { ReactNode, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveView, setActiveView } from '@/lib/store/appStateSlice' // Import setActiveView
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { setSettingsState } from '@/lib/store/settingsSlice'
// import { defaultSettings } from '@/lib/services/settingsService' // defaultSettings seems unused now
import { Toaster } from '@/components/ui/sonner'
import OnboardingDialog from '@/components/OnboardingDialog'

import ProjectOverview from '@/pages/ProjectOverview'
import Intro from '@/pages/Intro'
import SettingsPage from '@/pages/SettingsPage' // Import new page
import BookOutlineWizard from '@/pages/BookOutlineWizard' // Import wizard page
export default function App(): ReactNode {
  const dispatch = useDispatch()
  const activeProject = useSelector(selectActiveProject)
  const activeView = useSelector(selectActiveView)

  const [hasLoaded, setHasLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Refactored loadSettings to directly dispatch setSettingsState
  const loadSettings = async () => {
    console.log('Loading settings')
    try {
      const appSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
      dispatch(setSettingsState(appSettings || {})) // Dispatch loaded settings or empty object

      // Check if onboarding is needed *after* settings are loaded into state
      if (!appSettings?.workingRootDirectory || !appSettings?.apiKey) {
        console.log('Onboarding needed based on loaded settings:', appSettings)
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error("Failed to load settings in App:", error);
      // Handle error, maybe show a persistent error message?
    }
  }

  const router = (activeView) => {
    switch (activeView) {
      case 'intro':
        return <Intro />
      case 'wizard':
        return <BookOutlineWizard /> // Render the wizard page
      case 'project/outline':
      case 'project/parameters':
      case 'project/dashboard':
      case 'project/editor':
        // Ensure activeProject exists before rendering ProjectOverview
        return activeProject ? <ProjectOverview key={activeProject.projectPath} /> : <Intro />; // Fallback to Intro if no project
      case 'settings': // Added case for settings
        return <SettingsPage />
      default:
        return <Intro />
    }
  }

  // Load settings on first boot
  useEffect(() => {
    if (!hasLoaded) {
      loadSettings() // Call the async function
      setHasLoaded(true)
    }
  }, [hasLoaded, dispatch]) // Added dispatch dependency

  return (
    <>
      <div className="h-screen">
        {router(activeView)}
        <Toaster position="bottom-center" richColors />
      </div>

      {/* Pass dispatch down if Onboarding needs to trigger settings save */}
      <OnboardingDialog showOnboarding={showOnboarding} setShowOnboarding={setShowOnboarding} />
    </>
  )
}
