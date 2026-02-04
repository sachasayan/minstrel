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
  setProvider,
  setGoogleApiKey,
  setAnthropicApiKey,
  setDeepseekApiKey,
  setZaiApiKey,
  setOpenaiApiKey,
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

// Define Provider Options
const providerOptions = [
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (ChatGPT)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'zai', label: 'Z.AI' }
];

// Define Model Options by Provider
const modelOptionsByProvider: Record<string, string[]> = {
  google: [
    'gemini-2.5-pro-preview-03-25',
    'gemini-flash-3-preview',
    'gemini-2.0-flash-thinking-exp-01-21', // Default High
    'gemini-2.0-flash',         // Default Low
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ],
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ],
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-coder'
  ],
  zai: [
    'zai-model-1', // Placeholder - need actual Z.AI model names
    'zai-model-2'
  ]
};

const SettingsPage = (): ReactNode => {
  const settings = useSelector(selectSettingsState);
  const dispatch = useDispatch<AppDispatch>()

  // Local state for text inputs
  const [apiValue, setApiValue] = useState<string>('')
  const [apiKeyValue, setApiKeyValue] = useState<string>('')
  // Provider-specific API key states
  const [googleApiKeyValue, setGoogleApiKeyValue] = useState<string>('')
  const [anthropicApiKeyValue, setAnthropicApiKeyValue] = useState<string>('')
  const [openaiApiKeyValue, setOpenaiApiKeyValue] = useState<string>('')
  const [deepseekApiKeyValue, setDeepseekApiKeyValue] = useState<string>('')
  const [zaiApiKeyValue, setZaiApiKeyValue] = useState<string>('')

  // Get current model options based on selected provider
  const currentModelOptions = modelOptionsByProvider[settings.provider || 'google'] || modelOptionsByProvider.google;

  // Effect to load settings on mount and sync local state
  useEffect(() => {
    const loadAndSetSettings = async () => {
      try {
        const loadedSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
        dispatch(setSettingsState(loadedSettings || {}))
        // Sync local state
        setApiValue(loadedSettings?.api || '')
        setApiKeyValue(loadedSettings?.apiKey || '')
        setGoogleApiKeyValue(loadedSettings?.googleApiKey || '')
        setAnthropicApiKeyValue(loadedSettings?.anthropicApiKey || '')
        setOpenaiApiKeyValue(loadedSettings?.openaiApiKey || '')
        setDeepseekApiKeyValue(loadedSettings?.deepseekApiKey || '')
        setZaiApiKeyValue(loadedSettings?.zaiApiKey || '')

      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings.");
      }
    }
    loadAndSetSettings()
  }, [dispatch])

  // Effect to update local state when Redux state changes
  useEffect(() => {
    setApiValue(settings.api || '');
    setApiKeyValue(settings.apiKey || '');
    setGoogleApiKeyValue(settings.googleApiKey || '');
    setAnthropicApiKeyValue(settings.anthropicApiKey || '');
    setOpenaiApiKeyValue(settings.openaiApiKey || '');
    setDeepseekApiKeyValue(settings.deepseekApiKey || '');
    setZaiApiKeyValue(settings.zaiApiKey || '');
  }, [
    settings.api,
    settings.apiKey,
    settings.googleApiKey,
    settings.anthropicApiKey,
    settings.openaiApiKey,
    settings.deepseekApiKey,
    settings.zaiApiKey
  ]);

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

  // Handler for provider change
  const handleProviderChange = (value: string) => {
    dispatch(setProvider(value));
  };

  // Handler for provider API key changes
  const handleGoogleApiKeyChange = (value: string) => {
    setGoogleApiKeyValue(value);
    dispatch(setGoogleApiKey(value));
  };

  const handleAnthropicApiKeyChange = (value: string) => {
    setAnthropicApiKeyValue(value);
    dispatch(setAnthropicApiKey(value));
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

  // Handler for the Save button
  const handleSaveButton = () => {
    dispatch(setApi(apiValue));
    dispatch(setApiKey(apiKeyValue));
    dispatch(setGoogleApiKey(googleApiKeyValue));
    dispatch(setAnthropicApiKey(anthropicApiKeyValue));
    dispatch(setOpenaiApiKey(openaiApiKeyValue));
    dispatch(setDeepseekApiKey(deepseekApiKeyValue));
    dispatch(setZaiApiKey(zaiApiKeyValue));
    saveCurrentSettings();
  }

  // Handler for High Preference Model Select change
  const handleHighModelChange = (value: string) => {
    dispatch(setHighPreferenceModelId(value));
  };

  // Handler for Low Preference Model Select change
  const handleLowModelChange = (value: string) => {
    dispatch(setLowPreferenceModelId(value));
  };

  // Handler for selecting the project directory
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

      <main className="flex-grow overflow-y-auto">
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-6">
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
                    {providerOptions.map((provider) => (
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
                    type="password"
                    id="googleApiKey"
                    value={googleApiKeyValue}
                    onChange={(e) => handleGoogleApiKeyChange(e.target.value)}
                    placeholder="Enter your Google API Key"
                  />
                </div>
              )}

              {settings.provider === 'anthropic' && (
                <div>
                  <Label htmlFor="anthropicApiKey">Anthropic API Key</Label>
                  <Input
                    type="password"
                    id="anthropicApiKey"
                    value={anthropicApiKeyValue}
                    onChange={(e) => handleAnthropicApiKeyChange(e.target.value)}
                    placeholder="Enter your Anthropic API Key"
                  />
                </div>
              )}

              {settings.provider === 'openai' && (
                <div>
                  <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                  <Input
                    type="password"
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
                    type="password"
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
                    type="password"
                    id="zaiApiKey"
                    value={zaiApiKeyValue}
                    onChange={(e) => handleZaiApiKeyChange(e.target.value)}
                    placeholder="Enter your Z.AI API Key"
                  />
                </div>
              )}

              {/* Legacy API Key (for backward compatibility) */}
              <div>
                <Label htmlFor="apiKey">Legacy API Key</Label>
                <Input
                  type="password"
                  id="apiKey"
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder="Legacy API Key (for backward compatibility)"
                />
                <p className="text-xs text-muted-foreground pt-1">This field is maintained for backward compatibility.</p>
              </div>

              {/* API Endpoint */}
              <div>
                <Label htmlFor="api">API Endpoint (Optional)</Label>
                <Input
                  type="text"
                  id="api"
                  value={apiValue}
                  onChange={(e) => setApiValue(e.target.value)}
                  placeholder="Optional API Endpoint"
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

          {/* Save Button */}
          <div className="flex justify-end space-x-2">
            <Button onClick={handleSaveButton}>
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
