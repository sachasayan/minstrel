import { ReactNode, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveView } from '@/lib/store/appStateSlice'
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

import Versions from '@/components/Versions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { ArrowLeft, Folder } from 'lucide-react';
import { cn } from '@/lib/utils'

// Define Model Options (Moved from Settings.tsx)
const modelOptions = [
  'gemini-2.5-pro-preview-03-25',
  'gemini-2.0-flash-thinking-exp-01-21', // Default High
  'gemini-2.0-flash',         // Default Low
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];


const SettingsPage = (): ReactNode => {
  // --- Logic moved from Settings.tsx ---
  const settings = useSelector(selectSettingsState);
  const dispatch = useDispatch<AppDispatch>()

  // Local state ONLY for text inputs that aren't saved immediately
  const [apiValue, setApiValue] = useState<string>('')
  const [apiKeyValue, setApiKeyValue] = useState<string>('')

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
  useEffect(() => {
    setApiValue(settings.api || '');
    setApiKeyValue(settings.apiKey || '');
  }, [settings.api, settings.apiKey]);


  // Function to save the current FULL settings state from Redux via IPC
  const saveCurrentSettings = async () => {
    try {
      const currentSettings = store.getState().settings;
      await window.electron.ipcRenderer.invoke('save-app-settings', currentSettings);
      console.log("Settings saved via IPC.");
      toast.success("Settings Saved!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings.");
    }
  };

  // Handler for the Save button (saves API text inputs AND current Redux state)
  const handleSaveButton = () => {
    dispatch(setApi(apiValue));
    dispatch(setApiKey(apiKeyValue));
    saveCurrentSettings();
  }

  // Handler for High Preference Model Select change
  const handleHighModelChange = (value: string) => {
    dispatch(setHighPreferenceModelId(value));
    // Don't save immediately
  };

  // Handler for Low Preference Model Select change
  const handleLowModelChange = (value: string) => {
    dispatch(setLowPreferenceModelId(value));
    // Don't save immediately
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
  // --- End of logic moved from Settings.tsx ---


  const handleGoBack = () => {
    dispatch(setActiveView('intro'))
  }

  return (

    <div className={cn(
      "flex flex-col h-screen p-16 md:p-32",
      "animate-in fade-in zoom-in-95 duration-300"
    )}>
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      {/* Main content area now contains the settings form JSX */}
      <main className="flex-grow overflow-y-auto">
        {/* --- JSX moved from Settings.tsx --- */}
        <div>
          {/* Grid container for two columns */}
          {/* Removed inner p-4 from grid container as root div now has more padding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-6">

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
                <p className="text-sm text-muted-foreground pt-2 truncate">
                  Current: {settings.workingRootDirectory || 'Default (determined by system)'}
                </p>
              </div>
              {/* Versions Component */}
              <div className="pt-4">
                <Label>App Versions</Label>
                <div className="mt-2">
                  <Versions />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button - Saves ALL settings */}
          {/* Removed inner px-4 pb-4 as root div now has more padding */}
          <div className="flex justify-end space-x-2">
            <Button onClick={handleSaveButton}>
              Save Settings
            </Button>
          </div>
        </div>
        {/* --- End of JSX moved from Settings.tsx --- */}
      </main>

      {/* Footer can remain empty or be removed if Versions is always in the main content */}
      {/* <footer className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground"></footer> */}
    </div>
  )
}

export default SettingsPage
