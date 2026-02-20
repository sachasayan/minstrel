import { ReactNode, useState, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveView } from '@/lib/store/appStateSlice'
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
  selectSettingsState
} from '@/lib/store/settingsSlice'
import { AppDispatch } from '@/lib/store/store'

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
import { PROVIDER_OPTIONS, MODEL_OPTIONS_BY_PROVIDER, PROVIDER_MODELS } from '@shared/constants'

type KeyValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid'

const SettingsPage = (): ReactNode => {
  const settings = useSelector(selectSettingsState);
  const dispatch = useDispatch<AppDispatch>()

  // Provider-specific API key states
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
        return settings.googleApiKey || ''
      case 'openai':
        return settings.openaiApiKey || ''
      case 'deepseek':
        return settings.deepseekApiKey || ''
      case 'zai':
        return settings.zaiApiKey || ''
      default:
        return ''
    }
  }, [selectedProvider, settings.googleApiKey, settings.openaiApiKey, settings.deepseekApiKey, settings.zaiApiKey])

  // Effect to load settings on mount
  useEffect(() => {
    const loadAndSetSettings = async () => {
      try {
        const loadedSettings = await window.electron.ipcRenderer.invoke('get-app-settings')
        dispatch(setSettingsState(loadedSettings || {}))
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings.");
      }
    }
    loadAndSetSettings()
  }, [dispatch])

  // Effect to auto-save settings when they change
  useEffect(() => {
    // Skip saving if settings are completely empty (e.g. initial load state before getting from disk)
    if (!settings.provider && !settings.workingRootDirectory && !settings.highPreferenceModelId) return;

    const timeoutId = setTimeout(async () => {
      try {
        await window.electron.ipcRenderer.invoke('save-app-settings', settings);
        console.log("Settings auto-saved via IPC.");
      } catch (error) {
        console.error("Failed to auto-save settings:", error);
      }
    }, 1000); // 1 second debounce for saves

    return () => clearTimeout(timeoutId);
  }, [settings]);

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

  // Handler for provider change
  const handleProviderChange = (value: string) => {
    dispatch(setProvider(value));

    // Auto-update to default models for the new provider
    const newHighModel = PROVIDER_MODELS[value as keyof typeof PROVIDER_MODELS]?.high || PROVIDER_MODELS.google.high;
    const newLowModel = PROVIDER_MODELS[value as keyof typeof PROVIDER_MODELS]?.low || PROVIDER_MODELS.google.low;

    dispatch(setHighPreferenceModelId(newHighModel));
    dispatch(setLowPreferenceModelId(newLowModel));
  };

  // Handler for provider API key changes
  const handleGoogleApiKeyChange = (value: string) => {
    dispatch(setGoogleApiKey(value));
  };

  const handleOpenaiApiKeyChange = (value: string) => {
    dispatch(setOpenaiApiKey(value));
  };

  const handleDeepseekApiKeyChange = (value: string) => {
    dispatch(setDeepseekApiKey(value));
  };

  const handleZaiApiKeyChange = (value: string) => {
    dispatch(setZaiApiKey(value));
  };

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
                    value={settings.googleApiKey || ''}
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
                    value={settings.openaiApiKey || ''}
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
                    value={settings.deepseekApiKey || ''}
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
                    value={settings.zaiApiKey || ''}
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

          {/* Save Button is removed, handled by auto-save */}
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
