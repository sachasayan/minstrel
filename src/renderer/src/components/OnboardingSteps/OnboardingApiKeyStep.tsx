import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
// import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Key, MoveRight, Loader2, CircleCheck, CircleX } from 'lucide-react'
import { useOnboarding } from './context'
import llmService from '@/lib/services/llmService'
import minstrelIcon from '@/assets/bot/base.png'



interface OnboardingApiKeyStepProps {
  isActive: boolean
}

const OnboardingApiKeyStep = ({ isActive }: OnboardingApiKeyStepProps): ReactNode => {
  const { setCurrentStep, setFormData } = useOnboarding()
  const [keyValue, setKeyValue] = useState('')
  const [keyValidationStatus, setKeyValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const validationRequestIdRef = useRef(0)

  // Prevent stale async responses from updating state after unmount.
  useEffect(() => {
    return () => {
      validationRequestIdRef.current += 1
    }
  }, [])

  useEffect(() => {
    const apiKey = keyValue.trim()
    if (!apiKey) {
      validationRequestIdRef.current += 1
      setKeyValidationStatus('idle')
      return
    }

    setKeyValidationStatus('checking')
    const requestId = ++validationRequestIdRef.current

    const timeoutId = window.setTimeout(async () => {
      try {
        const isValid = await llmService.verifyKey(apiKey, 'google')
        if (requestId !== validationRequestIdRef.current) return

        if (isValid) {
          setKeyValidationStatus('valid')
          setFormData(prev => ({ ...prev, googleApiKey: apiKey }))
          setCurrentStep(3) // Proceed to next step (Summary)
        } else {
          console.error('API key validation failed for provider: google')
          setKeyValidationStatus('invalid')
        }
      } catch (error) {
        if (requestId !== validationRequestIdRef.current) return
        console.error('API key validation request errored for provider: google', error)
        setKeyValidationStatus('invalid')
      }
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [keyValue, setCurrentStep, setFormData])

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow">
          <h2 className="text-lg font-semibold mb-1">API Key Setup</h2>
          <p className="text-sm mb-4">
            Great! We also need your Google AI API key. Head over to{' '}
            <a href="https://aistudio.google.com/" rel="noreferrer" className="font-bold underline hover:text-blue-300" target="_blank">
              Google AI Studio
            </a>{' '}
            and sign in. Find the blue button labelled <i>Get API Key</i>, generate a key, and copy it here.
          </p>

          {/* Input Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 bg-background/10 p-4 rounded">
            {/* "Get API Key" Link/Button - Retaining specific style */}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="block shadow-md flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-4 py-2 bg-[#87a9ff] text-[#1a1c1e] w-full sm:w-fit whitespace-nowrap"
            >
              <Key className="mr-2 h-4 w-4" />
              Get API Key
            </a>
            <MoveRight className="h-6 w-6 text-highlight-100 hidden sm:block" /> {/* Arrow visible on larger screens */}
            <div className="relative w-full sm:w-auto flex-grow">
              <Input
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                className="w-full text-black pr-8"
                placeholder="Paste API Key here..."
                type="password" // Hide key visually
                disabled={!isActive}
              />
              {keyValidationStatus === 'checking' && (
                <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
          </div>
          {keyValue.trim() && (
            <div className="mt-2 text-center text-sm">
              {keyValidationStatus === 'checking' && (
                <span>Checking API key...</span>
              )}
              {keyValidationStatus === 'valid' && (
                <span className="inline-flex items-center gap-1 text-green-300">
                  <CircleCheck className="h-4 w-4" />
                  API key is valid.
                </span>
              )}
              {keyValidationStatus === 'invalid' && (
                <span className="inline-flex items-center gap-1 text-red-300">
                  <CircleX className="h-4 w-4" />
                  API key is invalid.
                </span>
              )}
            </div>
          )}

          {/* Info Box */}
          <p className="text-xs bg-background/10 text-highlight-100/80 p-3 rounded mt-4">
            <span className="font-bold">What is an API key?</span> It&apos;s like a password, but for computers. Minstrel needs it to talk to Google AI on your behalf.{' '}
            <a className="underline hover:text-blue-300" href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noreferrer">
              More info here.
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default OnboardingApiKeyStep
