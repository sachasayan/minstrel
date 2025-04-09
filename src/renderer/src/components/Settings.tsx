import { ReactNode, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setSettingsState,
  setApi,
  setApiKey,
  setWorkingRootDirectory,
  setHighPreferenceModelId,
  setLowPreferenceModelId,
  selectSettingsState
} from '@/lib/store/settingsSlice'
import { AppDispatch, store } from '@/lib/store/store'
import { Button } from './ui/button'
import { Label } from './ui/label' // Assuming Label component exists
import { Input } from './ui/input' // Assuming Input component exists
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import Versions from './Versions'
import { Folder } from 'lucide-react'

// Define Model Options
const modelOptions = [
  'gemini-2.5-pro-preview-03-25',
  'gemini-2.0-flash-thinking-exp-01-21', // Default High
  'gemini-2.0-flash',         // Default Low
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];

const Settings = (): ReactNode => {
  // Get full settings state object
  const settings = useSelector(selectSettingsState);
  const dispatch = useDispatch<AppDispatch>()

  // Local state ONLY for text inputs that aren't saved immediately
  const [apiValue, setApiValue] = useState<string>('') // Initialize empty
  const [apiKeyValue, setApiKeyValue] = useState<string>('') // Initialize empty


  // Effect to load settings on mount and sync local state for text inputs
  useEffect(() => {
    const loadAndSetSettings = async () => {
      try {
        const loadedSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
        dispatch(setSettingsState(loadedSettings || {})) // Load into Redux
        // Sync local state for text inputs *after* Redux state is updated
        setApiValue(loadedSettings?.api || '')
        setApiKeyValue(loadedSettings?.apiKey || '')

      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings.");
      }
    }
    loadAndSetSettings()
  }, [dispatch]) // Depend only on dispatch

  // Effect to update local state when Redux state changes (e.g., after loading)
  // This handles the case where settings might be loaded after initial render
  useEffect(() => {
    setApiValue(settings.api || '');
    setApiKeyValue(settings.apiKey || '');

  }, [settings.api, settings.apiKey]);


  // Function to save the current FULL settings state from Redux via IPC
  const saveCurrentSettings = async () => {
    try {
      // Get latest full state including potentially updated directory from Redux
      const currentSettings = store.getState().settings;
      await window.electron.ipcRenderer.invoke('save-app-settings', currentSettings);
      console.log("Settings saved via IPC.");
      toast.success("Settings Saved!"); // Use toast for feedback
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings.");
    }
  };

  // Handler for the Save button (saves API text inputs AND current Redux state)
  const handleSaveButton = () => {
    // Dispatch actions for text inputs first to update Redux state
    dispatch(setApi(apiValue));
    dispatch(setApiKey(apiKeyValue));
    // The workingRootDirectory is already updated in Redux state by selectFolder
    // Then save the entire current state via IPC
    saveCurrentSettings();
  }

  // Handler for High Preference Model Select change
  const handleHighModelChange = (value: string) => {
    dispatch(setHighPreferenceModelId(value));
    // Don't save immediately, wait for button press
    // saveCurrentSettings();
  };

  // Handler for Low Preference Model Select change
  const handleLowModelChange = (value: string) => {
    dispatch(setLowPreferenceModelId(value));
    // Don't save immediately, wait for button press
    // saveCurrentSettings();
  };

  // Handler for selecting the project directory - only updates Redux state
  const selectFolder = async () => {
    try {
      const selectedPath = await window.electron.ipcRenderer.invoke('select-directory', 'export');
      if (selectedPath) {
        dispatch(setWorkingRootDirectory(selectedPath));

      } else {
        console.log("Folder selection cancelled.");
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
      toast.error("Failed to select directory.");
    }
  };


  return (

    <div>
      {/* Grid container for two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-6 p-4">

        {/* Left Column */}
        <div className="space-y-4">
          {/* API Input */}
          <div>
            <Label htmlFor="api">API Endpoint</Label>
            <Input
              type="text"
              id="api"
              value={apiValue}
              onChange={(e) => setApiValue(e.target.value)}
              placeholder="Optional API Endpoint"
            />
          </div>

          {/* API Key Input */}
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              type="password" // Use password type for API key
              id="apiKey"
              value={apiKeyValue}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder="Enter your Gemini API Key"
            />
          </div>

          {/* High Preference Model Select */}
          <div>
            <Label htmlFor="highModel">High Preference Model</Label>
            <Select
              // Use value directly from Redux state
              value={settings.highPreferenceModelId || ''}
              onValueChange={handleHighModelChange}
            >
              <SelectTrigger id="highModel" className="w-full">
                <SelectValue placeholder="Select high preference model" />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((model) => (
                  <SelectItem key={`high-${model}`} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-1">Model used for complex tasks like outlining and writing.</p>
          </div>

          {/* Low Preference Model Select */}
          <div>
            <Label htmlFor="lowModel">Low Preference Model</Label>
            <Select
              // Use value directly from Redux state
              value={settings.lowPreferenceModelId || ''}
              onValueChange={handleLowModelChange}
            >
              <SelectTrigger id="lowModel" className="w-full">
                <SelectValue placeholder="Select low preference model" />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((model) => (
                  <SelectItem key={`low-${model}`} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-1">Model used for simpler tasks like routing and critique.</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Project Path Selector */}
          <div>
            <Label>Project Path</Label>
            <Button variant="outline" onClick={selectFolder} className="w-full justify-start mt-1">
              <Folder className="mr-2 h-4 w-4" />
              Select Project Directory
            </Button>
            <p className="text-sm text-muted-foreground pt-2 truncate"> {/* Added truncate */}
              Current: {settings.workingRootDirectory || 'Default (determined by system)'}
            </p>
          </div>
          {/* Versions Component */}
          <div className="pt-4"> {/* Add some spacing */}
            <Label>App Versions</Label>
            {/* Removed styling from this div */}
            <div className="mt-2">
              <Versions />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button - Saves ALL settings */}
      <div className="flex justify-end space-x-2 px-4 pb-4"> {/* Added padding */}
        <Button onClick={handleSaveButton}>
          Save Settings {/* Changed button text back */}
        </Button>
        {/* Assuming there's a way to close the settings dialog/modal */}
        {/* <Button variant="outline">Close</Button> */}
      </div>
    </div>
  )
}

export default Settings
