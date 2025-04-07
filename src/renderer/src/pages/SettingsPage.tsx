import { ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { setActiveView } from '@/lib/store/appStateSlice'
import { AppDispatch } from '@/lib/store/store'
import Settings from '@/components/Settings'
import Versions from '@/components/Versions' // Include Versions here if desired
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'; // Import an icon for the back button

const SettingsPage = (): ReactNode => {
  const dispatch = useDispatch<AppDispatch>()

  const handleGoBack = () => {
    // Navigate back to the intro screen for simplicity
    // Could potentially track previous view for more complex navigation
    dispatch(setActiveView('intro'))
  }

  return (
    <div className="flex flex-col h-screen p-4 md:p-8">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <main className="flex-grow overflow-y-auto">
        {/* Render the actual settings form component */}
        <Settings />
      </main>

      <footer className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
        {/* Render Versions component in the footer */}
        <Versions />
      </footer>
    </div>
  )
}

export default SettingsPage
