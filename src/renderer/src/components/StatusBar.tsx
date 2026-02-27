import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import SettingsModal from '@/pages/SettingsPage'
import { useDispatch, useSelector } from 'react-redux'
import { Sparkles, Loader2, Sun, Moon, Settings } from 'lucide-react'
import { selectActiveProject, updateReviews } from '@/lib/store/projectsSlice'
import { runCritique } from '@/lib/assistants/criticAssistant'
import { RootState } from '@/lib/store/store'
import { AppDispatch } from '@/lib/store/store'

type StatusBarProps = {
  floating?: boolean
}

const StatusBar = ({ floating = true }: StatusBarProps) => {
  const { theme, setTheme } = useTheme()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isCritiquing, setIsCritiquing] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  const activeProject = useSelector(selectActiveProject)
  const settings = useSelector((state: RootState) => state.settings)

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleRunCritique = async () => {
    if (!activeProject || isCritiquing) return

    const outlineFile = activeProject.files.find(f => f.title.toLowerCase().includes('outline'))
    const outlineContent = outlineFile?.content || ''

    if (!outlineContent) {
      console.warn('Cannot run critique without an outline.')
      return
    }

    setIsCritiquing(true)
    console.log('[StatusBar] Triggered story critique.')
    try {
      const result = await runCritique(settings, outlineContent, activeProject.storyContent)
      if (result) {
        console.log('[StatusBar] Critique result received, updating store.')
        dispatch(updateReviews(result))
      }
    } catch (err) {
      console.error('[StatusBar] Failed to run critique:', err)
    } finally {
      setIsCritiquing(false)
    }
  }

  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <>
      <div
        className={cn(
          'bg-background/80 flex items-center gap-1 rounded-full border p-1 backdrop-blur-sm',
          floating && 'fixed top-4 right-4 z-50 shadow-sm'
        )}
      >
        <div
          className={cn('mx-2 h-2.5 w-2.5 rounded-full', isOnline ? 'bg-green-500' : 'bg-red-500')}
          role="status"
          aria-label={isOnline ? 'Online' : 'Offline'}
          title={isOnline ? 'Online' : 'Offline'}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={themeLabel}
              className="h-8 w-8 rounded-full"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{themeLabel}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRunCritique}
              disabled={isCritiquing || !activeProject}
              aria-label="Critique Story"
              className={cn(
                "h-8 w-8 rounded-full",
                isCritiquing && "animate-pulse"
              )}
            >
              {isCritiquing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Critique Story</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="h-8 w-8 rounded-full"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Settings</TooltipContent>
        </Tooltip>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

export default StatusBar
