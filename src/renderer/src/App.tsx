import { ReactNode, useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveView } from '@/lib/store/appStateSlice'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { setSettingsState } from '@/lib/store/settingsSlice'
import { bridge } from '@/lib/bridge'
import { AnimatePresence, motion } from 'framer-motion'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

import ProjectOverview from '@/pages/ProjectOverview'
import Intro from '@/pages/Intro'

const ROUTE_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const
}

const ROUTE_VARIANTS = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.06 }
}

export default function App(): ReactNode {
  const dispatch = useDispatch()
  const activeProject = useSelector(selectActiveProject)
  const activeView = useSelector(selectActiveView)

  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const loadSettings = useCallback(async () => {
    console.log('Loading settings')
    setLoadError(null)
    try {
      const appSettings = await bridge.getAppSettings()
      dispatch(setSettingsState(appSettings || {})) // Dispatch loaded settings or empty object
    } catch (error) {
      console.error('Failed to load settings in App:', error)
      setLoadError('Failed to load application settings. Please check your configuration and try again.')
    } finally {
      setHasLoaded(true)
    }
  }, [dispatch])

  const router = (activeView) => {
    switch (activeView) {
      case 'intro':
        return <Intro />
      case 'project/outline':
      case 'project/parameters':
      case 'project/editor':
        // Ensure activeProject exists before rendering ProjectOverview
        return activeProject ? <ProjectOverview key={activeProject.projectPath} /> : <Intro /> // Fallback to Intro if no project

      default:
        return <Intro />
    }
  }

  const routeKey = activeView.startsWith('project/') ? `${activeView}:${activeProject?.projectPath || 'new-project'}` : activeView

  // Load settings on first boot
  useEffect(() => {
    if (!hasLoaded) {
      loadSettings() // Call the async function
    }
  }, [hasLoaded, loadSettings])

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
        <div className="h-full">
          <TooltipProvider>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={routeKey}
                data-testid="app-route-transition"
                data-route-key={routeKey}
                className="h-full"
                initial={ROUTE_VARIANTS.initial}
                animate={ROUTE_VARIANTS.animate}
                exit={ROUTE_VARIANTS.exit}
                transition={ROUTE_TRANSITION}
              >
                {router(activeView)}
              </motion.div>
            </AnimatePresence>
            <Toaster position="bottom-center" richColors />
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
