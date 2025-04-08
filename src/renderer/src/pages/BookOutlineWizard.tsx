'use client'

import type { ReactNode, UIEvent } from 'react'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setActiveView } from '@/lib/store/appStateSlice'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

import Intro from '@/components/BookWizard/Intro' // Import Intro component
import ParameterChecklist from '@/components/BookWizard/ParameterChecklist'
import StoryLengthStep from '@/components/BookWizard/StoryLength'
import GenreStep from '@/components/BookWizard/GenreStep'
import SettingStep from '@/components/BookWizard/SettingStep'
import TitleStep from '@/components/BookWizard/TitleStep'
import PlotStep from '@/components/BookWizard/PlotPage'
import WritingSampleStep from '@/components/BookWizard/WritingSamplePage'
import SummaryStep from '@/components/BookWizard/SummaryPage'

import { WizardContext } from '@/components/BookWizard/index'

const SCROLL_THRESHOLD = 50 // Pixels from bottom to consider "at bottom"

export default function BookOutlineWizard(): ReactNode {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isAtBottom, setIsAtBottom] = useState(true) // State for sticky scroll
  const dispatch = useDispatch()
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleGoBack = () => {
    if (currentStep > 0) {
      setCurrentStep(0)
      setIsAtBottom(true) // Reset scroll state when going back to Intro
    } else {
      dispatch(setActiveView('intro'))
    }
  }

  const handleProceedToStep = useCallback((nextStep: number) => {
    setCurrentStep(nextStep)
    // Assuming proceeding should always try to scroll to bottom initially
    // We might need more nuanced logic if steps can be added without user interaction
    // For now, let useEffect handle the scroll based on isAtBottom
  }, [])

  const wizardSteps = useMemo(() => [
    { step: 1, Component: StoryLengthStep },
    { step: 2, Component: GenreStep },
    { step: 3, Component: SettingStep },
    { step: 4, Component: TitleStep },
    { step: 5, Component: PlotStep },
    { step: 6, Component: WritingSampleStep },
    { step: 7, Component: SummaryStep }
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
      "flex flex-col h-screen",
      "animate-in fade-in zoom-in-95 duration-300"
    )}>
      <header className="flex items-center p-4 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-xl font-bold">Create New Project Outline</h1>
      </header>

      <WizardContext.Provider value={{ currentStep, setCurrentStep, formData, setFormData, totalSteps: 8 }}>
        {currentStep === 0 ? (
          <Intro />
        ) : (
          <div className="flex flex-grow overflow-hidden p-16 md:p-32">
            <aside className="w-[280px] border-r p-4 overflow-y-auto shrink-0">
              <ParameterChecklist />
            </aside>

            {/* Attach scroll handler here */}
            <main ref={chatContainerRef} onScroll={handleScroll} className="flex-grow p-6 overflow-y-auto space-y-6">
              {wizardSteps
                .filter(stepInfo => stepInfo.step <= currentStep)
                .map(stepInfo => (
                  <stepInfo.Component
                    key={stepInfo.step}
                    handleProceed={handleProceedToStep}
                    currentStep={stepInfo.step}
                    isActive={stepInfo.step === currentStep}
                  />
                ))}
            </main>
          </div>
        )}
      </WizardContext.Provider>
    </div>
  )
}
