import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
// import { Button } from '@/components/ui/button' // Removed unused import
import { Input } from '@/components/ui/input'
import { Key, MoveRight, Loader2 } from 'lucide-react' // Added Loader2
import { useOnboarding } from './context'
import geminiService from '@/lib/services/llmService'
import minstrelIcon from '@/assets/bot/base.png'

interface OnboardingApiKeyStepProps {
  isActive: boolean // Prop received from parent map
}

const OnboardingApiKeyStep = ({ isActive }: OnboardingApiKeyStepProps): ReactNode => { // Added isActive back
  const { setCurrentStep, setFormData } = useOnboarding()
  const [keyValue, setKeyValue] = useState('')
  const [keyError, setKeyError] = useState(false)
  const [verifyingKey, setVerifyingKey] = useState(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Use ref for timeout

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleKey = async (keyInput: string) => {
    setKeyValue(keyInput)
    setKeyError(false) // Reset error on new input

    if (keyInput.length < 10) { // Basic length check
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      setVerifyingKey(false); // Ensure verification stops if key becomes too short
      return
    }

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(async () => {
      setVerifyingKey(true)
      try {
        console.log('Verifying key...' + keyInput)
        const keyTest = await geminiService.verifyKey(keyInput)
        console.log('Key verification result:', keyTest)
        if (!keyTest) {
          console.error('Key verification failed.')
          setKeyError(true)
        } else {
          console.log('Key verified.')
          setFormData(prev => ({ ...prev, apiKey: keyInput.trim() }))
          setCurrentStep(2) // Proceed to next step (Summary)
        }
      } catch (e) {
        console.error('Error during key verification:', e)
        setKeyError(true)
      } finally {
        setVerifyingKey(false)
      }
    }, 750) // Increased debounce slightly
  }

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
                    onChange={(e) => handleKey(e.target.value)}
                    className="w-full text-black pr-8" // Added padding-right for loader
                    placeholder="Paste API Key here..."
                    type="password" // Hide key visually
                    disabled={verifyingKey}
                />
                {verifyingKey && (
                    <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}
             </div>
          </div>
           {keyError && <div className="text-sm text-red-400 mt-2 text-center">Hmm, that key didn&apos;t seem to work. Please double-check and try again.</div>}

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
