import { ReactNode, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setSettingsState,
  setWorkingRootDirectory,
  setHighPreferenceModelId,
  setLowPreferenceModelId,
  setProvider,
  setGoogleApiKey,
  setDeepseekApiKey,
  setZaiApiKey,
  setOpenaiApiKey,
  setNvidiaApiKey,
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
import { Folder } from 'lucide-react'
import { PROVIDER_OPTIONS, MODEL_OPTIONS_BY_PROVIDER } from '@shared/constants'

const Settings = (): ReactNode => {
  // Get full settings state object
  const settings = useSelector(selectSettingsState);
  const dispatch = useDispatch<AppDispatch>()

  // Provider-specific API key states
  const [googleApiKeyValue, setGoogleApiKeyValue] = useState<string>('')
  const [openaiApiKeyValue, setOpenaiApiKeyValue] = useState<string>('')
  const [deepseekApiKeyValue, setDeepseekApiKeyValue] = useState<string>('')
  const [zaiApiKeyValue, setZaiApiKeyValue] = useState<string>('')
  const [nvidiaApiKeyValue, setNvidiaApiKeyValue] = useState<string>('')

  // Get current model options based on selected provider
  const currentModelOptions =
    MODEL_OPTIONS_BY_PROVIDER[settings.provider || 'google'] ||
    MODEL_OPTIONS_BY_PROVIDER.google

  // Effect to load settings on mount and sync local state
  useEffect(() => {
    const loadAndSetSettings = async () => {
      try {
        const loadedSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
        dispatch(setSettingsState(loadedSettings || {}))
        // Sync local state
        setGoogleApiKeyValue(loadedSettings?.googleApiKey || '')
        setOpenaiApiKeyValue(loadedSettings?.openaiApiKey || '')
        setDeepseekApiKeyValue(loadedSettings?.deepseekApiKey || '')
        setZaiApiKeyValue(loadedSettings?.zaiApiKey || '')
        setNvidiaApiKeyValue(loadedSettings?.nvidiaApiKey || '')

      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings.");
      }
    }
    loadAndSetSettings()
  }, [dispatch])

  // Effect to update local state when Redux state changes
  useEffect(() => {
    setGoogleApiKeyValue(settings.googleApiKey || '');
    setOpenaiApiKeyValue(settings.openaiApiKey || '');
    setDeepseekApiKeyValue(settings.deepseekApiKey || '');
    setZaiApiKeyValue(settings.zaiApiKey || '');
    setNvidiaApiKeyValue(settings.nvidiaApiKey || '');
  }, [
    settings.googleApiKey,
    settings.openaiApiKey,
    settings.deepseekApiKey,
    settings.zaiApiKey,
    settings.nvidiaApiKey
  ]);


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

  // Handler for provider change
  const handleProviderChange = (value: string) => {
    dispatch(setProvider(value));
  };

  // Handler for provider API key changes
  const handleGoogleApiKeyChange = (value: string) => {
    setGoogleApiKeyValue(value);
    dispatch(setGoogleApiKey(value));
  };

  const handleOpenaiApiKeyChange = (value: string) => {
    setOpenaiApiKeyValue(value);
    dispatch(setOpenaiApiKey(value));
  };

  const handleDeepseekApiKeyChange = (value: string) => {
    setDeepseekApiKeyValue(value);
    dispatch(setDeepseekApiKey(value));
  };

  const handleZaiApiKeyChange = (value: string) => {
    setZaiApiKeyValue(value);
    dispatch(setZaiApiKey(value));
  };

  const handleNvidiaApiKeyChange = (value: string) => {
    setNvidiaApiKeyValue(value);
    dispatch(setNvidiaApiKey(value));
  };

  // Handler for the Save button (saves API text inputs AND current Redux state)
  const handleSaveButton = () => {
    // Dispatch provider API keys
    dispatch(setGoogleApiKey(googleApiKeyValue));
    dispatch(setOpenaiApiKey(openaiApiKeyValue));
    dispatch(setDeepseekApiKey(deepseekApiKeyValue));
    dispatch(setZaiApiKey(zaiApiKeyValue));
    dispatch(setNvidiaApiKey(nvidiaApiKeyValue));
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
          {/* Provider Selection */}
          <div>
            <Label htmlFor="provider">AI Provider</Label>
            <Select
              value={settings.provider || 'google'}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger id="provider" className="w-full">
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider-specific API Keys */}
          {settings.provider === 'google' && (
            <div>
              <Label htmlFor="googleApiKey">Google API Key</Label>
              <Input
                type="text"
                id="googleApiKey"
                value={googleApiKeyValue}
                onChange={(e) => handleGoogleApiKeyChange(e.target.value)}
                placeholder="Enter your Google API Key"
              />
            </div>
          )}

          {settings.provider === 'openai' && (
            <div>
              <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
              <Input
                type="text"
                id="openaiApiKey"
                value={openaiApiKeyValue}
                onChange={(e) => handleOpenaiApiKeyChange(e.target.value)}
                placeholder="Enter your OpenAI API Key"
              />
            </div>
          )}

          {settings.provider === 'deepseek' && (
            <div>
              <Label htmlFor="deepseekApiKey">DeepSeek API Key</Label>
              <Input
                type="text"
                id="deepseekApiKey"
                value={deepseekApiKeyValue}
                onChange={(e) => handleDeepseekApiKeyChange(e.target.value)}
                placeholder="Enter your DeepSeek API Key"
              />
            </div>
          )}

          {settings.provider === 'zai' && (
            <div>
              <Label htmlFor="zaiApiKey">Z.AI API Key</Label>
              <Input
                type="text"
                id="zaiApiKey"
                value={zaiApiKeyValue}
                onChange={(e) => handleZaiApiKeyChange(e.target.value)}
                placeholder="Enter your Z.AI API Key"
              />
            </div>
          )}

          {settings.provider === 'nvidia' && (
            <div>
              <Label htmlFor="nvidiaApiKey">NVIDIA API Key</Label>
              <Input
                type="text"
                id="nvidiaApiKey"
                value={nvidiaApiKeyValue}
                onChange={(e) => handleNvidiaApiKeyChange(e.target.value)}
                placeholder="Enter your NVIDIA API Key"
              />
            </div>
          )}
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
              {currentModelOptions.map((model) => (
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
              {currentModelOptions.map((model) => (
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
        {/* Minstrel Version */}
        <div className="pt-4">
          {/* Add some spacing */}
          <Label>Minstrel Version</Label>
          <p className="text-sm text-muted-foreground mt-2">1.0</p>
        </div>
      </div>

      {/* Save Button - Saves ALL settings */}
      <div className="flex justify-end space-x-2 px-4 pb-4">
        {/* Added padding */}
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
