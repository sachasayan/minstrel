import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveView } from '@/lib/utils/appStateSlice'
import { selectActiveProject } from '@/lib/utils/projectsSlice'
import { setSettingsState } from '@/lib/utils/settingsSlice'
import { defaultSettings } from '@/lib/settingsManager'
import { Toaster } from '@/components/ui/sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Settings from '@/components/Settings'

import ProjectOverview from '@/pages/ProjectOverview'
import Intro from '@/pages/Intro'
import { BookOutlineWizard } from '@/pages/BookOutlineWizard'
import { Key } from 'lucide-react'

import type { JSX } from 'react' // Import JSX namespace

export default function App(): JSX.Element {
  const dispatch = useDispatch()
  // const settings = useSelector(selectSettingsState)
  const activeProject = useSelector(selectActiveProject)
  const activeView = useSelector(selectActiveView)

  const [hasLoaded, setHasLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const loadSettings = () => async (dispatch) => {
    console.log('Loading settings')
    const appSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
    if (!appSettings?.api || !appSettings?.apiKey) {
      setShowOnboarding(true)
    }
    dispatch(
      setSettingsState({
        api: appSettings?.api || defaultSettings.api,
        apiKey: appSettings?.apiKey || defaultSettings.apiKey,
        workingRootDirectory:
          appSettings?.workingRootDirectory || defaultSettings.workingRootDirectory
      })
    )
  }

  const router = (activeView) => {
    switch (activeView) {
      case 'intro':
        return <Intro />
        break
      case 'wizard':
        return <BookOutlineWizard />
        break
      case 'project/outline':
      case 'project/dashboard':
      case 'project/editor':
        return <ProjectOverview key={activeProject?.id} />
        break
      default:
        return <Intro />
    }
  }

  // Load settngs on first boot
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

      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="min-w-[800px]">
          <DialogHeader>
            <DialogTitle>Looks like you&apos;re new here!</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                Before you can use Minstrel, you&apos;ll need to set up your API key. Head over to
                Google AI Studio and sign into your Google Account. Find the blue button labelled
              </p>
              <p>
                {' '}
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none data-[state=open]:bg-secondary/50 h-9 px-4 py-2 bg-[#87a9ff] text-[#1a1c1e] hover:bg-[#87a9ff]/80 w-fit">
                  <Key className="mr-2 h-4 w-4" />
                  Get API Key
                </button>
              </p>
              <p>... and click it. Generate a new API key add it to Minstrel on the right.</p>
            </div>
            <Settings />
          </div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
            onClick={() => setShowOnboarding(false)}
          >
            Got it!
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}
