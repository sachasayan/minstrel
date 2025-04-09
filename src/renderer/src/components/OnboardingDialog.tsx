import { useState, createContext, useContext } from 'react'
import Torrent from '@/components/visuals/torrent'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Folder, MoveRight, WandSparkles } from 'lucide-react'
import { ReactNode } from 'react'
import { Key } from 'lucide-react'
import geminiService from '@/lib/services/llmService'
import { setSettingsState } from '@/lib/store/settingsSlice'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion' // Correct import from framer-motion

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
  editFormData: (newData) => void
  setShowOnboarding: (show: boolean) => void
}

const OnboardingFlow = createContext<OnboardingFlowProps>({
  totalSteps: 3,
  currentStep: 0,
  setCurrentStep: () => { },
  formData: {},
  setFormData: () => { },
  editFormData: () => { },
  setShowOnboarding: () => { }
})

// Custom hook for using wizard context
const useOnboarding = () => useContext(OnboardingFlow)

// Page 0
const Intro = () => {
  const { setCurrentStep, editFormData } = useOnboarding()

  const selectFolder = async () => {
    const exportPath = await window.electron.ipcRenderer.invoke('select-directory', 'export')

    editFormData({ workingRootDirectory: exportPath })
  }

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence> {/* Wrap DialogContent with AnimatePresence */}
        <motion.div
          key="dialog-content" // Add a key for AnimatePresence
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 5.0 }}
        >
          <div className="flex-grow space-y-4 flex flex-col items-center justify-center p-16 ">
            <h2 className="text-2xl font-bold text-center">Welcome to Minstrel</h2>
            <p className="text-center text-sm text-gray-500">
              Looks like you&apos;re new here! It&apos;s nice to meet you.  Before we get started, let&apos;s set up a couple things. First of all, where can we put our projects?
              <br /> We suggest <b>~/Documents/Minstrel</b>, but it&apos;s your choice.
            </p>
            <div className="flex flex-row items-center justify-center gap-4">
              <Button
                onClick={() => {
                  selectFolder()
                  setCurrentStep(1)
                }}
              >
                {' '}
                <Folder /> {`Choose a Directory`}{' '}
              </Button>
              <Button
                onClick={() => {
                  editFormData({ workingRootDirectory: '~/Documents/Minstrel' })
                  setCurrentStep(1)
                }}
              >
                <WandSparkles /> {`Use the default.`}{' '}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Page 1
const SetUpKey = () => {
  const { setCurrentStep, editFormData, setShowOnboarding } = useOnboarding()
  const [keyValue, setKeyValue] = useState('')
  const [keyError, setKeyError] = useState(false)
  const [verifyingKey, setVerifyingKey] = useState(false)
  let debounceTimeout

  const handleKey = async (keyInput) => {
    setKeyValue(keyInput)
    if (keyInput.length < 10) {
      return
    }
    clearTimeout(debounceTimeout)

    // Set up new timeout
    debounceTimeout = setTimeout(async () => {

      setVerifyingKey(true)
      try {
        console.log('Verifying key...' + keyInput)
        const keyTest = await geminiService.verifyKey(keyInput)
        console.log(keyTest)
        if (!keyTest) {
          console.error('Key verification failed.')
          setKeyError(true)
          return false
        }

        console.log('Key verified.')
        editFormData({ apiKey: keyInput.trim() })
        setCurrentStep(2)
        return true
      } catch (e) {
        console.error(e)
        setKeyError(true)
        return false
      } finally {
        setVerifyingKey(false)
      }
    }, 500)
  }

  return (
    <div className="flex flex-col h-full justify-center gap-4 items-center p-16">
      <h2 className="text-2xl font-bold text-center">API Key </h2>
      <p className="text-center text-sm text-gray-500">
        Great! We also need to set up your API key. Head over to{' '}
        <a href="https://aistudio.google.com/" rel="noreferrer" className="font-bold cursor-pointer underline" target="_blank">
          Google AI Studio
        </a>{' '}
        and sign into your Google Account. Find the blue button labelled <i>Get API Key</i>, generate a key, and copy it here.
      </p>
      <div className="flex flex-row justify-center align-middle gap-4">
        <a
          href="https://aistudio.google.com/"
          target="_blank"
          rel="noreferrer"
          className="block shadow-md  mx-auto flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-4 py-2 bg-[#87a9ff] text-[#1a1c1e] w-fit"
        >
          <Key className="mr-2 h-4 w-4" />
          Get API Key
        </a>
        <MoveRight className="h-full  text-gray-500" />
        <Input value={keyValue} onChange={(e) => handleKey(e.target.value)} className="w-10" disabled={verifyingKey} />
      </div>
      {keyError && <div className="text-red-700">Hmm that didn&apos;t work. Try again.</div>}
      {verifyingKey && <div className="text-xs">Verifying key...</div>}
      <p className="text-sm bg-amber-100 outline-1 outline-amber-300 text-amber-900 p-4 rounded-md">
        <span className="font-bold">What is an API key?</span> It&apos;s like a password, but for computers. Minstrel needs to talk to Google on your behalf.{' '}
        <a className="underline pointer text-amber-900" href="https://ai.google.dev/gemini-api/docs/api-key" target="blank" rel="noreferrer">
          More info here.
        </a>
      </p>
    </div>
  )
}

// Summary Page
const SummaryPage = () => {
  const { formData, setShowOnboarding } = useOnboarding()
  const dispatch = useDispatch()

  const handleSaveSettings = () => {
    const apiCall = {
      api: '',
      ...formData
    }
    dispatch(setSettingsState(apiCall))
    console.log(apiCall)
    window.electron.ipcRenderer.invoke('save-app-settings', apiCall)

    setShowOnboarding(false) // Close the dialog after saving
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col items-center justify-center p-8 gap-4">
        <h2 className="text-2xl text-center font-bold">Great. We&apos;re ready to go.</h2>
        <p className="text-sm text-gray-500">{`That was painless, right? If you need to change things in the future, you can go to the Settings area.`}</p>

        <div className="flex flex-row items-center justify-center">
          <Button onClick={handleSaveSettings}>I&apos;m ready!</Button>
        </div>
      </div>
    </div>
  )
}

// Wizard component
const OnboardingDialog = ({ showOnboarding, setShowOnboarding }: OnboardingDialogProps): ReactNode => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const totalSteps = 4 // Includes summary page, but not the start page
  const editFormData = (newData) => {
    setFormData({ ...formData, ...newData })
  }

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <OnboardingFlow.Provider value={{ currentStep, setCurrentStep, formData, setFormData, editFormData, totalSteps, setShowOnboarding }}>
        {' '}
        {/* Added setShowOnboarding to context value */}
        <DialogContent
          className="sm:max-w-[800px]"
          onInteractOutside={(e) => {
            e.preventDefault()
          }}
        >
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2 flex flex-col justify-center">
              <AnimatePresence> {/* Wrap DialogContent with AnimatePresence */}

                <motion.div
                  key="dialog-content" // Add a key for AnimatePresence
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}

                  transition={{ duration: 8.0 }}
                >
                  <Torrent />
                </motion.div>
              </AnimatePresence>
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
