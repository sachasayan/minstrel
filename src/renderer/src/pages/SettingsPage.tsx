import { ReactNode, useState, useEffect, useMemo, useRef } from 'react'
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
  setWritingSample,
  setWritingStyleDescription,
  selectSettingsState
} from '@/lib/store/settingsSlice'
import { AppDispatch } from '@/lib/store/store'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { bridge } from '@/lib/bridge'
import { toast } from 'sonner'
import { Bot, CircleCheck, CircleX, FolderOpen, Loader2, Sparkles, FolderCog, PenTool } from 'lucide-react'
import llmService from '@/lib/services/llmService'
import { PROVIDER_OPTIONS, MODEL_OPTIONS_BY_PROVIDER, PROVIDER_MODELS } from '@shared/constants'
import { describeWritingStyle } from '@/lib/assistants/writingStyleAssistant'

type KeyValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid'
type PersonalizationStatus = 'idle' | 'analyzing' | 'ready' | 'failed'
type SettingsTab = 'ai' | 'workspace' | 'personalization'

type SettingsModalProps = {
  open: boolean
  onClose: () => void
}

// ── Small helper: a labeled settings row ──────────────────────────────────────
function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

// ── Small helper: a section card ──────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-accent/30 p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
const SettingsModal = ({ open, onClose }: SettingsModalProps): ReactNode => {
  const settings = useSelector(selectSettingsState)
  const dispatch = useDispatch<AppDispatch>()

  const [activeTab, setActiveTab] = useState<SettingsTab>('ai')
  const [keyValidationStatus, setKeyValidationStatus] = useState<KeyValidationStatus>('idle')
  const [personalizationStatus, setPersonalizationStatus] = useState<PersonalizationStatus>('idle')
  const [writingSampleDraft, setWritingSampleDraft] = useState('')
  const [writingStyleDraft, setWritingStyleDraft] = useState('')
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const validationRequestIdRef = useRef(0)
  const styleRequestIdRef = useRef(0)

  const currentModelOptions =
    MODEL_OPTIONS_BY_PROVIDER[settings.provider || 'google'] ||
    MODEL_OPTIONS_BY_PROVIDER.google

  const selectedProvider = settings.provider || 'google'

  const selectedProviderApiKey = useMemo(() => {
    switch (selectedProvider) {
      case 'google': return settings.googleApiKey || ''
      case 'openai': return settings.openaiApiKey || ''
      case 'deepseek': return settings.deepseekApiKey || ''
      case 'zai': return settings.zaiApiKey || ''
      default: return ''
    }
  }, [selectedProvider, settings.googleApiKey, settings.openaiApiKey, settings.deepseekApiKey, settings.zaiApiKey])

  // Load settings when modal opens
  useEffect(() => {
    if (!open) return
    setSettingsLoaded(false)
    const load = async () => {
      try {
        const loaded = await bridge.getAppSettings()
        dispatch(setSettingsState(loaded || {}))
        setWritingSampleDraft(loaded?.writingSample || '')
        setWritingStyleDraft(loaded?.writingStyleDescription || '')
        styleRequestIdRef.current += 1
        const loadedDescription = loaded?.writingStyleDescription?.trim() || ''
        setPersonalizationStatus(loadedDescription ? 'ready' : 'idle')
        setSettingsLoaded(true)
      } catch (err) {
        console.error('Failed to load settings:', err)
        toast.error('Failed to load settings.')
        setSettingsLoaded(true)
      }
    }
    load()
  }, [open, dispatch])

  // Auto-save with debounce
  useEffect(() => {
    if (!open || !settingsLoaded) return

    const hasAnySetting =
      Boolean(settings.provider) ||
      Boolean(settings.workingRootDirectory) ||
      Boolean(settings.highPreferenceModelId) ||
      Boolean(settings.lowPreferenceModelId)

    if (!hasAnySetting) return

    let cancelled = false
    const id = setTimeout(async () => {
      try {
        await bridge.saveAppSettings(settings)
        if (cancelled) return
        setLastSaved(new Date())
      } catch (err) {
        if (cancelled) return
        console.error('Failed to auto-save settings:', err)
      }
    }, 1000)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [open, settingsLoaded, settings, dispatch])

  // Validate API key (debounced)
  useEffect(() => {
    const key = selectedProviderApiKey.trim()
    if (!key) {
      validationRequestIdRef.current += 1
      setKeyValidationStatus('idle')
      return
    }
    setKeyValidationStatus('checking')
    const reqId = ++validationRequestIdRef.current
    const id = window.setTimeout(async () => {
      try {
        const isValid = await llmService.verifyKey(key, selectedProvider)
        if (reqId !== validationRequestIdRef.current) return
        setKeyValidationStatus(isValid ? 'valid' : 'invalid')
      } catch {
        if (reqId !== validationRequestIdRef.current) return
        setKeyValidationStatus('invalid')
      }
    }, 500)
    return () => window.clearTimeout(id)
  }, [selectedProvider, selectedProviderApiKey])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleProviderChange = (value: string) => {
    dispatch(setProvider(value))
    dispatch(setHighPreferenceModelId(PROVIDER_MODELS[value as keyof typeof PROVIDER_MODELS]?.high || PROVIDER_MODELS.google.high))
    dispatch(setLowPreferenceModelId(PROVIDER_MODELS[value as keyof typeof PROVIDER_MODELS]?.low || PROVIDER_MODELS.google.low))
  }

  const handleApiKeyChange = (value: string) => {
    switch (selectedProvider) {
      case 'google': dispatch(setGoogleApiKey(value)); break
      case 'openai': dispatch(setOpenaiApiKey(value)); break
      case 'deepseek': dispatch(setDeepseekApiKey(value)); break
      case 'zai': dispatch(setZaiApiKey(value)); break
    }
  }

  const selectFolder = async () => {
    try {
      const path = await bridge.selectDirectory('export')
      if (path) dispatch(setWorkingRootDirectory(path))
    } catch {
      toast.error('Failed to select directory.')
    }
  }

  // ── Validation badge ──────────────────────────────────────────────────────
  const ValidationBadge = () => {
    if (!selectedProviderApiKey.trim()) return null
    return (
      <div className={cn(
        'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit',
        keyValidationStatus === 'checking' && 'bg-muted text-muted-foreground',
        keyValidationStatus === 'valid' && 'bg-highlight-100 text-highlight-700 dark:bg-highlight-900/40 dark:text-highlight-300',
        keyValidationStatus === 'invalid' && 'bg-destructive/10 text-destructive',
      )}>
        {keyValidationStatus === 'checking' && <><Loader2 className="h-3 w-3 animate-spin" /> Verifying…</>}
        {keyValidationStatus === 'valid' && <><CircleCheck className="h-3 w-3" /> Valid</>}
        {keyValidationStatus === 'invalid' && <><CircleX className="h-3 w-3" /> Invalid</>}
      </div>
    )
  }

  const apiKeyFieldId = `${selectedProvider}ApiKey`
  const apiKeyLabel: Record<string, string> = {
    google: 'Google API Key', openai: 'OpenAI API Key',
    deepseek: 'DeepSeek API Key', zai: 'Z.AI API Key',
  }

  const tabs: { id: SettingsTab; label: string; icon: ReactNode }[] = [
    { id: 'ai', label: 'AI Provider', icon: <Bot className="h-4 w-4" /> },
    { id: 'personalization', label: 'Personalization', icon: <PenTool className="h-4 w-4" /> },
    { id: 'workspace', label: 'Workspace', icon: <FolderCog className="h-4 w-4" /> },
  ]

  const personalizationStatusCopy: Record<PersonalizationStatus, string> = {
    idle: '',
    analyzing: 'Analyzing your writing sample to build a style profile...',
    ready: 'Style profile is ready and will be used for future chapter writing.',
    failed: 'Style analysis failed. Minstrel will fall back to the default writing prompt until this succeeds.'
  }

  const processWritingSample = async (pastedText: string) => {
    const nextSample = pastedText.trim()

    styleRequestIdRef.current += 1
    const requestId = styleRequestIdRef.current

    setWritingSampleDraft(pastedText)
    setWritingStyleDraft('')

    if (!nextSample) {
      setPersonalizationStatus('idle')
      return
    }

    setPersonalizationStatus('analyzing')

    const description = await describeWritingStyle(settings, nextSample)
    if (requestId !== styleRequestIdRef.current) return

    if (!description) {
      setPersonalizationStatus('failed')
      return
    }

    setWritingStyleDraft(description)
    setPersonalizationStatus('ready')

    const updatedSettings = {
      ...settings,
      writingSample: pastedText,
      writingStyleDescription: description
    }

    try {
      await bridge.saveAppSettings(updatedSettings)
      if (requestId !== styleRequestIdRef.current) return
      dispatch(setWritingSample(pastedText))
      dispatch(setWritingStyleDescription(description))
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save writing style settings:', error)
      setPersonalizationStatus('failed')
    }
  }

  const handleWritingSamplePaste: React.ClipboardEventHandler<HTMLTextAreaElement> = async (event) => {
    event.preventDefault()
    await processWritingSample(event.clipboardData.getData('text/plain'))
  }

  const handleWritingSampleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    const isPasteShortcut =
      (event.key.toLowerCase() === 'v' && (event.metaKey || event.ctrlKey)) ||
      (event.key === 'Insert' && event.shiftKey)

    const isNavigationKey = [
      'Tab',
      'Escape',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    ].includes(event.key)

    if (isPasteShortcut || isNavigationKey) return

    event.preventDefault()
  }

  const handleClearWritingSample = async () => {
    styleRequestIdRef.current += 1
    setWritingSampleDraft('')
    setWritingStyleDraft('')
    setPersonalizationStatus('idle')

    const updatedSettings = {
      ...settings,
      writingSample: '',
      writingStyleDescription: ''
    }

    dispatch(setWritingSample(''))
    dispatch(setWritingStyleDescription(''))

    try {
      await bridge.saveAppSettings(updatedSettings)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to clear writing style settings:', error)
      setPersonalizationStatus('failed')
    }
  }

  const handlePasteButtonClick = async () => {
    try {
      const pastedText = await navigator.clipboard.readText()
      if (!pastedText) return
      await processWritingSample(pastedText)
    } catch (error) {
      console.error('Failed to read clipboard:', error)
      toast.error('Clipboard access failed.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold tracking-tight">Settings</DialogTitle>
        </DialogHeader>

        <div className="flex" style={{ minHeight: '420px' }}>

          {/* Sidebar nav */}
          <nav className="w-44 shrink-0 border-r bg-accent/20 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left',
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* ── AI Provider tab ──────────────────────────────────────────── */}
            {activeTab === 'ai' && (
              <>
                <Section title="Provider" icon={<Bot className="h-3.5 w-3.5" />}>
                  <SettingRow label="AI Provider" description="The service that powers Minstrel's AI features.">
                    <Select value={settings.provider || 'google'} onValueChange={handleProviderChange}>
                      <SelectTrigger id="provider" className="w-full">
                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_OPTIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  <SettingRow label={apiKeyLabel[selectedProvider] ?? 'API Key'}>
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        id={apiKeyFieldId}
                        value={selectedProviderApiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        placeholder={`Enter your ${apiKeyLabel[selectedProvider] ?? 'API key'}`}
                        className="flex-1"
                      />
                    </div>
                    <div className="mt-1.5">
                      <ValidationBadge />
                    </div>
                  </SettingRow>
                </Section>

                <Section title="Models" icon={<Sparkles className="h-3.5 w-3.5" />}>
                  <SettingRow
                    label="High Preference Model"
                    description="Used for complex tasks like outlining and writing."
                  >
                    <Select value={settings.highPreferenceModelId || ''} onValueChange={(v) => dispatch(setHighPreferenceModelId(v))}>
                      <SelectTrigger id="highModel" className="w-full">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentModelOptions.map((m) => (
                          <SelectItem key={`high-${m}`} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  <SettingRow
                    label="Low Preference Model"
                    description="Used for simpler tasks like routing and critique."
                  >
                    <Select value={settings.lowPreferenceModelId || ''} onValueChange={(v) => dispatch(setLowPreferenceModelId(v))}>
                      <SelectTrigger id="lowModel" className="w-full">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentModelOptions.map((m) => (
                          <SelectItem key={`low-${m}`} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SettingRow>
                </Section>
              </>
            )}

            {/* ── Personalization tab ─────────────────────────────────────── */}
            {activeTab === 'personalization' && (
              <Section title="Writing Style" icon={<PenTool className="h-3.5 w-3.5" />}>
                <SettingRow
                  label="Writing Sample"
                  description="Paste a sample of your writing here so Minstrel can analyze it and mimic your style while drafting chapters."
                >
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handlePasteButtonClick}>
                      Paste
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleClearWritingSample}>
                      Clear
                    </Button>
                  </div>
                  <Textarea
                    id="writingSample"
                    value={writingSampleDraft}
                    readOnly
                    onPaste={handleWritingSamplePaste}
                    onKeyDown={handleWritingSampleKeyDown}
                    onDrop={(e) => e.preventDefault()}
                    placeholder="Paste a paragraph or two that reflects the voice you want Minstrel to emulate."
                    className="h-[5.5rem] max-h-[5.5rem] resize-none overflow-y-auto text-[0.5rem] leading-tight"
                  />
                </SettingRow>

                {personalizationStatusCopy[personalizationStatus] && (
                  <div className="rounded-md border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {personalizationStatus === 'analyzing' && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>{personalizationStatusCopy[personalizationStatus]}</span>
                    </div>
                  </div>
                )}

                <SettingRow
                  label="Style Analysis"
                  description="This generated style description is what Minstrel will inject into the writing prompt."
                >
                  <Textarea
                    id="writingStyleDescription"
                    value={writingStyleDraft}
                    disabled
                    readOnly
                    placeholder="Analysis will appear here after you paste a writing sample."
                    className="h-[2.5rem] max-h-[2.5rem] resize-none overflow-y-auto"
                  />
                </SettingRow>
              </Section>
            )}

            {/* ── Workspace tab ────────────────────────────────────────────── */}
            {activeTab === 'workspace' && (
              <Section title="Project Directory" icon={<FolderOpen className="h-3.5 w-3.5" />}>
                <p className="text-sm text-muted-foreground -mt-1">
                  The folder where Minstrel reads and saves your projects.
                </p>
                <Button variant="outline" onClick={selectFolder} className="w-full justify-start gap-2">
                  <FolderOpen className="h-4 w-4 shrink-0" />
                  Choose folder…
                </Button>
                {settings.workingRootDirectory ? (
                  <div className="rounded-md bg-muted/60 px-3 py-2 text-xs font-mono text-muted-foreground break-all">
                    {settings.workingRootDirectory}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No folder selected — using system default.
                  </p>
                )}
              </Section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between bg-accent/10">
          <span className="text-xs text-muted-foreground">
            {lastSaved
              ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Changes saved automatically'}
          </span>
          <span className="text-xs text-muted-foreground">Minstrel v1.0</span>
        </div>

      </DialogContent>
    </Dialog>
  )
}

export default SettingsModal
