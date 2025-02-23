import type React from 'react'
import { useState, createContext, useContext, useEffect } from 'react'
import Torrent from '@/components/visuals/torrent'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MoveRight } from 'lucide-react'
import { ReactNode } from 'react'
import { Key } from 'lucide-react'
import geminiService from '@/lib/services/llmService'

interface OnboardingDialogProps {
  showOnboarding: boolean
  setShowOnboarding: (show: boolean) => void
}

// Context for managing wizard state
interface OnboardingFlowProps {
  totalSteps: number
  currentStep: number
  setCurrentStep: (step: number) => void
  formData: { [key: string]: any }
  setFormData: (data: { [key: string]: any }) => void
}

const OnboardingFlow = createContext<OnboardingFlowProps>({
  totalSteps: 3,
  currentStep: 0,
  setCurrentStep: () => {},
  formData: {},
  setFormData: () => {}
})

// Custom hook for using wizard context
const useOnboarding = () => useContext(OnboardingFlow)

// Page 0
const Intro = () => {
  const { setCurrentStep, setFormData, currentStep } = useOnboarding()

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow space-y-4 flex flex-col items-center justify-center p-16 ">
        <h2 className="text-2xl font-bold text-center">Hello, Dreamer</h2>
        <p className="text-center text-sm text-gray-500">{`Welcome to Minstrel. It's nice to meet you! Before we get started, let's set up a couple things. `}</p>

        <Button onClick={() => setCurrentStep(1)}>{`I'm ready!`} </Button>
      </div>
    </div>
  )
}

// Page 1
const SetUpKey = () => {
  const { currentStep, setCurrentStep, formData, setFormData, totalSteps } = useOnboarding()
  const [keyValue, setKeyValue] = useState('')
  const [keyError, setKeyError] = useState(false)

  const handleKey = async (keyInput) => {
    try {
      setKeyValue(keyInput)
      console.log('Verifying key...' + keyInput)
      const keyTest = await geminiService.verifyKey(keyInput)
      console.log(keyTest)
      if (!keyTest) {
        console.error('Key verification failed.')
        return
      }
      console.log('Key verified.')
      setCurrentStep(2)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    setFormData(formData.length || 0)
  }, [formData.length])

  useEffect(() => {
    setFormData(formData.length || 50000)
  }, [])

  return (
    <div className="flex flex-col h-full justify-center gap-4 items-center p-16">
      <h2 className="text-2xl font-bold text-center">API Key </h2>
      <p className="text-center text-sm text-gray-500">
        Before you can use Minstrel, you&apos;ll need to set up your API key. Head over to{' '}
        <a href="https://aistudio.google.com/" rel="noreferrer" className="font-bold cursor-pointer underline" target="_blank">
          Google AI Studio
        </a>{' '}
        and sign into your Google Account. Find the blue button labelled <i>Get API Key</i>, generate a key, and copy it here.
      </p>
      <div className="flex flex-row justify-center align-middle gap-4">
        <div className="shadow-md  mx-auto flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-4 py-2 bg-[#87a9ff] text-[#1a1c1e] w-fit">
          <Key className="mr-2 h-4 w-4" />
          Get API Key
        </div>
        <MoveRight className="h-full  text-gray-500" />
        <Input value={keyValue} onChange={(e) => handleKey(e.target.value)} className="w-10" />
      </div>
      {keyError && <div className="text-red-700 text-xs">Hmm that didn&apos;t work. Try again.</div>}
      <p className="text-sm bg-amber-100 outline-1 outline-amber-300 text-amber-900 p-4 rounded-md">
        <span className="font-bold">What is an API key?</span> It's like a password, but for computers. Minstrel needs to talk to Google on your behalf.{' '}
        <a className="underline pointer text-amber-900" href="https://ai.google.dev/gemini-api/docs/api-key" target="blank" rel="noreferrer">
          More info here.
        </a>
      </p>
    </div>
  )
}

// Summary Page
const SummaryPage = () => {
  const { currentStep, formData, totalSteps } = useOnboarding()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col items-center justify-center p-8 gap-4">
        <h2 className="text-2xl text-center font-bold">Great. We&apos;re ready to go.</h2>
        <p className="text-sm text-gray-500">{`That was painless, right? `}</p>

        <div className="flex flex-row items-center justify-center">{!requestPending && <Button>I'm ready!</Button>}</div>
      </div>
    </div>
  )
}

// Wizard component
const OnboardingDialog = ({ showOnboarding, setShowOnboarding }: OnboardingDialogProps): ReactNode => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const totalSteps = 4 // Includes summary page, but not the start page

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <OnboardingFlow.Provider value={{ currentStep, setCurrentStep, formData, setFormData, totalSteps }}>
        <DialogContent
          className="sm:max-w-[800px]"
          onInteractOutside={(e) => {
            e.preventDefault()
          }}
        >
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2 flex flex-col justify-center">
              <Torrent />
            </div>
            <div className="col-span-3 flex flex-col">
              {currentStep === 0 && <Intro />}
              {currentStep === 1 && <SetUpKey />}
              {currentStep === 2 && <SummaryPage />}
            </div>
          </div>
        </DialogContent>
      </OnboardingFlow.Provider>
    </Dialog>
  )
}

export default OnboardingDialog
