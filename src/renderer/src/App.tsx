import { ReactNode, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveView } from '@/lib/store/appStateSlice'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { setSettingsState } from '@/lib/store/settingsSlice'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import OnboardingPage from '@/pages/OnboardingPage'

import ProjectOverview from '@/pages/ProjectOverview'
import Intro from '@/pages/Intro'
import SettingsPage from '@/pages/SettingsPage'
export default function App(): ReactNode {
  const dispatch = useDispatch()
  const activeProject = useSelector(selectActiveProject)
  const activeView = useSelector(selectActiveView)

  const [hasLoaded, setHasLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)


  const loadSettings = async () => {
    console.log('Loading settings')
    setLoadError(null)
    try {
      const appSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
      dispatch(setSettingsState(appSettings || {})) // Dispatch loaded settings or empty object

      // Check if onboarding is needed *after* settings are loaded into state
      if (!appSettings?.workingRootDirectory || !appSettings?.googleApiKey) {
        console.log('Onboarding needed based on loaded settings:', appSettings)
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error("Failed to load settings in App:", error);
      setLoadError("Failed to load application settings. Please check your configuration and try again.")
    } finally {
      setHasLoaded(true)
    }
  }

  const router = (activeView) => {
    switch (activeView) {
      case 'intro':
        return <Intro />
      case 'project/outline':
      case 'project/parameters':
      case 'project/dashboard':
      case 'project/editor':
        // Ensure activeProject exists before rendering ProjectOverview
        return activeProject ? <ProjectOverview key={activeProject.projectPath} /> : <Intro />; // Fallback to Intro if no project
      case 'settings':
        return <SettingsPage />
      default:
        return <Intro />
    }
  }

  // Load settings on first boot
  useEffect(() => {
    if (!hasLoaded) {
      loadSettings() // Call the async function
    }
  }, [hasLoaded])

  // Conditionally render OnboardingPage or the main app router
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {loadError && (
        <div className="p-4 bg-background border-b border-border shadow-sm">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Settings</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{loadError}</span>
              <Button variant="outline" size="sm" onClick={() => loadSettings()} className="ml-4">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="flex-grow overflow-hidden">
        {showOnboarding ? (
          <OnboardingPage /> // Render the full-page onboarding flow
        ) : (
          // Render the main application UI
          <div className="h-full">
            <TooltipProvider>
              {router(activeView)}
              <Toaster position="bottom-center" richColors />
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  )
}
