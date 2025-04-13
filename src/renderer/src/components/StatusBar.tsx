import { useEffect, useState } from 'react'
import { Sun, Moon, Settings } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { useDispatch } from 'react-redux'
import { setActiveView } from '@/lib/store/appStateSlice'

const StatusBar = () => {
  const dispatch = useDispatch()
  const { theme, setTheme } = useTheme()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const openSettings = () => {
    dispatch(setActiveView('settings'))
  }

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 rounded-full border p-2  z-50">
      <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />

      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? 'Disable dark mode' : 'Enable dark mode'}
      >
        {theme === 'dark' ? <Sun className="size-4" fill="currentColor" />: <Moon className="size-4" />}
      </button>

      <button onClick={openSettings}>
        <Settings className="w-4 h-4" />
      </button>
    </div>
  )
}

export default StatusBar
