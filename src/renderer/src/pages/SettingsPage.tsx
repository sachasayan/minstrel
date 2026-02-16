import { ReactNode, useState, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveView } from '@/lib/store/appStateSlice'
import {
  setSettingsState,
  setApi,
  setWorkingRootDirectory,
  setHighPreferenceModelId,
  setLowPreferenceModelId,
  setProvider,
  setGoogleApiKey,
  setDeepseekApiKey,
  setZaiApiKey,
  setOpenaiApiKey,
  selectSettingsState
} from '@/lib/store/settingsSlice'
import { AppDispatch, store } from '@/lib/store/store'

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
import { ArrowLeft, CircleCheck, CircleX, Folder, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import llmService from '@/lib/services/llmService'
import { PROVIDER_OPTIONS, MODEL_OPTIONS_BY_PROVIDER } from '@shared/constants'

type KeyValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid'

const SettingsPage = (): ReactNode => {
  const settings = useSelector(selectSettingsState);
  const dispatch = useDispatch<AppDispatch>()

  // Local state for text inputs
  const [apiValue, setApiValue] = useState<string>('')
  // Provider-specific API key states
  const [googleApiKeyValue, setGoogleApiKeyValue] = useState<string>('')
  const [openaiApiKeyValue, setOpenaiApiKeyValue] = useState<string>('')
  const [deepseekApiKeyValue, setDeepseekApiKeyValue] = useState<string>('')
  const [zaiApiKeyValue, setZaiApiKeyValue] = useState<string>('')
  const [keyValidationStatus, setKeyValidationStatus] = useState<KeyValidationStatus>('idle')
  const validationRequestIdRef = useRef(0)

  // Get current model options based on selected provider
  const currentModelOptions =
    MODEL_OPTIONS_BY_PROVIDER[settings.provider || 'google'] ||
    MODEL_OPTIONS_BY_PROVIDER.google
  const selectedProvider = settings.provider || 'google'
  const selectedProviderApiKey = useMemo(() => {
    switch (selectedProvider) {
      case 'google':
        return googleApiKeyValue
      case 'openai':
        return openaiApiKeyValue
      case 'deepseek':
        return deepseekApiKeyValue
      case 'zai':
        return zaiApiKeyValue
      default:
        return ''
    }
  }, [selectedProvider, googleApiKeyValue, openaiApiKeyValue, deepseekApiKeyValue, zaiApiKeyValue])

  // Effect to load settings on mount and sync local state
  useEffect(() => {
    const loadAndSetSettings = async () => {
      try {
        const loadedSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
        dispatch(setSettingsState(loadedSettings || {}))
        // Sync local state
        setApiValue(loadedSettings?.api || '')
        setGoogleApiKeyValue(loadedSettings?.googleApiKey || '')
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
    setGoogleApiKeyValue(settings.googleApiKey || '');
    setOpenaiApiKeyValue(settings.openaiApiKey || '');
    setDeepseekApiKeyValue(settings.deepseekApiKey || '');
    setZaiApiKeyValue(settings.zaiApiKey || '');
  }, [
    settings.api,
    settings.googleApiKey,
    settings.openaiApiKey,
    settings.deepseekApiKey,
    settings.zaiApiKey
  ]);

  useEffect(() => {
    const apiKey = selectedProviderApiKey.trim()
    if (!apiKey) {
      validationRequestIdRef.current += 1
      setKeyValidationStatus('idle')
      return
    }

    setKeyValidationStatus('checking')
    const requestId = ++validationRequestIdRef.current

    const timeoutId = window.setTimeout(async () => {
      try {
        const isValid = await llmService.verifyKey(apiKey, selectedProvider)
        if (requestId !== validationRequestIdRef.current) return
        if (isValid) {
          setKeyValidationStatus('valid')
        } else {
          console.error(`API key validation failed for provider: ${selectedProvider}`)
          setKeyValidationStatus('invalid')
        }
      } catch (error) {
        if (requestId !== validationRequestIdRef.current) return
        console.error(`API key validation request errored for provider: ${selectedProvider}`, error)
        setKeyValidationStatus('invalid')
      }
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [selectedProvider, selectedProviderApiKey])

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
    dispatch(setGoogleApiKey(googleApiKeyValue));
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
                    type="password"
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
              {selectedProviderApiKey.trim() && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {keyValidationStatus === 'checking' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Checking API key...</span>
                    </>
                  )}
                  {keyValidationStatus === 'valid' && (
                    <>
                      <CircleCheck className="h-4 w-4 text-green-600" />
                      <span className="text-green-700">API key is valid.</span>
                    </>
                  )}
                  {keyValidationStatus === 'invalid' && (
                    <>
                      <CircleX className="h-4 w-4 text-red-600" />
                      <span className="text-red-700">API key is invalid.</span>
                    </>
                  )}
                </div>
              )}

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
              {/* Minstrel Version */}
              <div className="pt-4">
                <Label>Minstrel Version</Label>
                <p className="text-sm text-muted-foreground mt-2">1.0</p>
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
