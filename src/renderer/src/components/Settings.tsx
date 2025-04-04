import { ReactNode, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setSettingsState } from '@/lib/store/settingsSlice'
import { RootState, AppDispatch } from '@/lib/store/store'
import { Button } from './ui/button'

const Settings = (): ReactNode => {
  const apiStoreValue = useSelector((state: RootState) => state.settings?.api ?? '')
  const apiKeyStoreValue = useSelector((state: RootState) => state.settings?.apiKey ?? '')
  const workingRootDirectoryStoreValue = useSelector((state: RootState) => state.settings?.workingRootDirectory ?? '')
  const [apiValue, setApiValue] = useState<string>(apiStoreValue || '')
  const [apiKeyValue, setApiKeyValue] = useState<string>(apiKeyStoreValue || '')
  const [workingRootDirectoryValue, setWorkingRootDirectoryValue] = useState<string>(workingRootDirectoryStoreValue || '')
  const dispatch = useDispatch<AppDispatch>()

  const loadSettings = async () => {
    const appSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
    setApiValue(appSettings?.api || '')
    setApiKeyValue(appSettings?.apiKey || '')
    setWorkingRootDirectoryValue(appSettings?.workingRootDirectory || '')
  }

  const saveSettings = async () => {
    window.electron.ipcRenderer.invoke('save-app-settings', {
      api: apiValue,
      apiKey: apiKeyValue,
      workingRootDirectory: workingRootDirectoryValue
    })
  }

  const handleSaveSettings = () => {
    dispatch(
      setSettingsState({
        api: apiValue,
        apiKey: apiKeyValue,
        workingRootDirectory: workingRootDirectoryValue
      })
    )

    saveSettings()

    alert('Settings Saved!')
  }

  useEffect(() => {
    loadSettings()
  }, [dispatch])

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="api" className="block text-gray-700 text-sm font-bold">
          API
        </label>
        <input
          type="text"
          id="api"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={apiValue}
          onChange={(e) => setApiValue(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="workingRootDirectory" className="block text-gray-700 text-sm font-bold ">
          Project Path
        </label>
        <input
          type="text"
          id="workingRootDirectory"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={workingRootDirectoryValue}
          onChange={(e) => setWorkingRootDirectoryValue(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="apiKey" className="block text-gray-700 text-sm font-bold">
          API Key
        </label>
        <input
          type="text"
          id="apiKey"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={apiKeyValue}
          onChange={(e) => setApiKeyValue(e.target.value)}
        />
      </div>
      <Button onClick={handleSaveSettings} className="mr-4">
        Save
      </Button>
      <Button>Close</Button>
    </div>
  )
}

export default Settings
