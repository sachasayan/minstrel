'use client'

import type { ReactNode, UIEvent } from 'react'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setActiveView } from '@/lib/store/appStateSlice'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

import Intro from '@/components/BookWizard/Intro'
import ParameterChecklist from '@/components/BookWizard/ParameterChecklist'
import StoryLengthStep from '@/components/BookWizard/StoryLength'
import GenreStep from '@/components/BookWizard/GenreStep'
import SettingStep from '@/components/BookWizard/SettingStep'
import TitleStep from '@/components/BookWizard/TitleStep'
import PlotStep from '@/components/BookWizard/PlotPage'
import WritingSampleStep from '@/components/BookWizard/WritingSamplePage'
import SummaryStep from '@/components/BookWizard/SummaryPage'
import CoverStep from '@/components/BookWizard/CoverStep'

import { WizardContext } from '@/components/BookWizard/index'

const SCROLL_THRESHOLD = 50 // Pixels from bottom to consider "at bottom"

// Animation variants for steps appearing
const stepVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.5 } } // Increased delay to 0.5s
};


export default function BookOutlineWizard(): ReactNode {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [selectedCoverPath, setSelectedCoverPath] = useState<string | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true) // State for sticky scroll
  const dispatch = useDispatch()
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleGoBack = () => {
    // Always navigate back to the main intro/library view when back is clicked
    dispatch(setActiveView('intro'))
    // No longer resetting step to 0
  }

  const handleProceedToStep = useCallback(() => {
    // Calculate next step based on current step
    const nextStep = currentStep + 1
    // Check if nextStep exceeds total steps? Maybe not needed if SummaryStep handles finalization.
    setCurrentStep(nextStep) // Update step immediately
    // Scrolling logic remains in useEffect
    // Delay will be handled by animation transition
  }, [currentStep])

  // Function to scroll the main content area to the bottom
  const requestScrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []); // No dependencies needed, relies on the ref

  const wizardSteps = useMemo(() => [
    { step: 0, Component: Intro },
    { step: 1, Component: StoryLengthStep },
    { step: 2, Component: GenreStep },
    { step: 3, Component: SettingStep },
    { step: 4, Component: CoverStep },
    { step: 5, Component: PlotStep },
    { step: 6, Component: TitleStep },
    { step: 7, Component: WritingSampleStep },
    { step: 8, Component: SummaryStep }
  ], [])

  // Effect to scroll to bottom if isAtBottom is true when step changes
  useEffect(() => {
    if (chatContainerRef.current && currentStep > 0 && isAtBottom) {
      // Only scroll if we are considered "at the bottom"
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
    // Dependency on currentStep ensures this runs when new steps are added
    // Dependency on isAtBottom ensures we respect user scrolling away
  }, [currentStep, isAtBottom])

  // Handler for scroll events on the chat container
  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const scrollFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    // Update isAtBottom state based on threshold
    setIsAtBottom(scrollFromBottom <= SCROLL_THRESHOLD)
  }, []) // No dependencies needed as it only uses event target

  return (
    <div className={cn(
      "flex flex-col h-screen p-16 md:p-32",
      "animate-in fade-in zoom-in-95 duration-300"
    )}>
      <header className="flex items-center p-4 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-xl font-bold">Create New Project Outline</h1>
      </header>

      <WizardContext.Provider value={{ currentStep, setCurrentStep, formData, setFormData, totalSteps: 9, selectedCoverPath, setSelectedCoverPath, requestScrollToBottom }}> {/* <-- Pass setSelectedCoverPath */}
        {/* Removed old conditional Intro rendering */}
        <div className="flex flex-grow overflow-hidden">
          {/* Conditionally render sidebar */}
          {currentStep > 0 && (
            <aside className="w-[280px] border-r p-4 overflow-y-auto shrink-0 animate-in fade-in duration-300">
              <ParameterChecklist />
            </aside>
          )}
            {/* Attach scroll handler here */}
            <main ref={chatContainerRef} onScroll={handleScroll} className="flex-grow p-6 overflow-y-auto space-y-6">
              {wizardSteps
                .filter(stepInfo => stepInfo.step <= currentStep)
                .map((stepInfo) => (
                  // Wrap component in motion.div for animation
                  <motion.div
                    key={stepInfo.step} // Use step number as key
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    // layout
                  >
                    <stepInfo.Component
                      // Pass all potentially relevant props directly
                      // Components will ignore props they don't use
                      handleProceed={handleProceedToStep} // Note: Intro might not use this
                      currentStep={stepInfo.step}
                      isActive={stepInfo.step === currentStep}
                      selectedGenre={formData.genre || ''}
                      selectedCoverPath={selectedCoverPath}
                      setSelectedCoverPath={setSelectedCoverPath}
                    />
                  </motion.div>
              ))}
          </main>
        </div>
        {/* End of main content flex container */}
      </WizardContext.Provider>
    </div>
  )
}
