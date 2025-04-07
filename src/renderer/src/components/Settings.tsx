import { ReactNode, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setSettingsState,
  setApi, // Import specific setters
  setApiKey, // Import specific setters
  setWorkingRootDirectory, // Import specific setters
  setHighPreferenceModelId, // Import new action
  setLowPreferenceModelId,  // Import new action
  selectSettingsState // Import selector for full state
} from '@/lib/store/settingsSlice'
import { RootState, AppDispatch, store } from '@/lib/store/store' // Import store for getState
import { Button } from './ui/button'
import { Label } from './ui/label' // Assuming Label component exists
import { Input } from './ui/input' // Assuming Input component exists
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" // Import Select components
import { toast } from 'sonner' // Import toast for feedback

// Define Model Options
const modelOptions = [
  'gemini-2.5-pro-preview-03-25',
  'gemini-2.0-flash-thinking', // Default High
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
  const [workingRootDirectoryValue, setWorkingRootDirectoryValue] = useState<string | null>('') // Initialize empty, allow null

  // Effect to load settings on mount and sync local state for text inputs
  useEffect(() => {
    const loadAndSetSettings = async () => {
      try {
        const loadedSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
        dispatch(setSettingsState(loadedSettings || {})) // Load into Redux
        // Sync local state for text inputs *after* Redux state is updated
        setApiValue(loadedSettings?.api || '')
        setApiKeyValue(loadedSettings?.apiKey || '')
        setWorkingRootDirectoryValue(loadedSettings?.workingRootDirectory || '')
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
    setWorkingRootDirectoryValue(settings.workingRootDirectory || '');
  }, [settings.api, settings.apiKey, settings.workingRootDirectory]);


  // Function to save the current FULL settings state from Redux via IPC
  const saveCurrentSettings = async () => {
    try {
      const currentSettings = store.getState().settings; // Get latest full state
      await window.electron.ipcRenderer.invoke('save-app-settings', currentSettings);
      console.log("Settings saved via IPC.");
      toast.success("Settings Saved!"); // Use toast for feedback
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings.");
    }
  };

  // Handler for the Save button (saves only text inputs)
  const handleSaveButton = () => {
    // Dispatch actions for text inputs first
    dispatch(setApi(apiValue));
    dispatch(setApiKey(apiKeyValue));
    dispatch(setWorkingRootDirectory(workingRootDirectoryValue));
    // Then save the entire current state (including potentially changed selects)
    saveCurrentSettings();
    // Removed alert, using toast now
  }

  // Handler for High Preference Model Select change
  const handleHighModelChange = (value: string) => {
    dispatch(setHighPreferenceModelId(value));
    saveCurrentSettings(); // Save immediately
  };

  // Handler for Low Preference Model Select change
  const handleLowModelChange = (value: string) => {
    dispatch(setLowPreferenceModelId(value));
    saveCurrentSettings(); // Save immediately
  };


  return (
    <div className="space-y-4 p-4"> {/* Added padding */}
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

      {/* Project Path Input */}
      <div>
        <Label htmlFor="workingRootDirectory">Project Path</Label>
        <Input
          type="text"
          id="workingRootDirectory"
          value={workingRootDirectoryValue ?? ''} // Handle null for input value
          onChange={(e) => setWorkingRootDirectoryValue(e.target.value)}
          placeholder="e.g., /Users/you/Documents/MinstrelProjects"
        />
        <p className="text-xs text-muted-foreground pt-1">Leave blank to use default.</p>
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
          value={settings.highPreferenceModelId}
          onValueChange={handleHighModelChange}
        >
          <SelectTrigger id="highModel" className="w-full"> {/* Added class */}
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
          value={settings.lowPreferenceModelId}
          onValueChange={handleLowModelChange}
        >
          <SelectTrigger id="lowModel" className="w-full"> {/* Added class */}
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

      {/* Save Button (for text inputs) */}
      <div className="flex justify-end space-x-2 pt-4"> {/* Added padding top */}
        <Button onClick={handleSaveButton}>
          Save Text Fields
        </Button>
        {/* Assuming there's a way to close the settings dialog/modal */}
        {/* <Button variant="outline">Close</Button> */}
      </div>
    </div>
  )
}

export default Settings
