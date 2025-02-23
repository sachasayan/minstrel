import { ReactNode, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveView } from '@/lib/store/appStateSlice'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { setSettingsState } from '@/lib/store/settingsSlice'
import { defaultSettings } from '@/lib/services/settingsManager'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Settings from '@/components/Settings'

import ProjectOverview from '@/pages/ProjectOverview'
import Intro from '@/pages/Intro'
import { Key } from 'lucide-react'

export default function App(): ReactNode {
  const dispatch = useDispatch()
  // const settings = useSelector(selectSettingsState)
  const activeProject = useSelector(selectActiveProject)
  const activeView = useSelector(selectActiveView)

  const [hasLoaded, setHasLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)

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
        workingRootDirectory: appSettings?.workingRootDirectory || defaultSettings.workingRootDirectory
      })
    )
  }

  const router = (activeView) => {
    switch (activeView) {
      case 'intro':
        return <Intro />
        break
      case 'wizard':
        return
        break
      case 'project/outline':
      case 'project/parameters':
      case 'project/dashboard':
      case 'project/editor':
        return <ProjectOverview key={activeProject?.id} />
        break
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

      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="min-w-[800px] px-16 py-8">
          <DialogHeader>
            <DialogTitle className="text-center">Looks like you&apos;re new here!</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col justify-center gap-4">
              <p>
                Before you can use Minstrel, you&apos;ll need to set up your API key. Head over to{' '}
                <a href="https://aistudio.google.com/" rel="noreferrer" className="cursor-pointer underline" target="_blank">
                  Google AI Studio
                </a>{' '}
                and sign into your Google Account. Find the blue button labelled...
              </p>
              <p>
                <button className="shadow-md ring-1 ring-black-500 mx-auto flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-4 py-2 bg-[#87a9ff] text-[#1a1c1e] w-fit">
                  <Key className="mr-2 h-4 w-4" />
                  Get API Key
                </button>
              </p>
              <p>... and click it. Generate a new API key add it to Minstrel on the right.</p>
            </div>
            <Settings />
          </div>
          <DialogFooter>
            <Button className="px-4 py-2 rounded-md mt-4" onClick={() => setShowOnboarding(false)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
