'use client'

import type { ReactNode } from 'react'
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

export default function BookOutlineWizard(): ReactNode {
  const [currentStep, setCurrentStep] = useState(0) // Start at step 0 for Intro
  const [formData, setFormData] = useState<Record<string, any>>({})
  const dispatch = useDispatch()

  const handleGoBack = () => {
    // If on step 1 or later, go back to step 0 (Intro)
    if (currentStep > 0) {
      setCurrentStep(0)
    } else {
      // If on step 0 (Intro), go back to the main app view
      dispatch(setActiveView('intro'))
    }
  }

  const handleProceedToStep = useCallback((nextStep: number) => {
    setCurrentStep(nextStep)
  }, [])

  // Note: wizardSteps array now represents steps 1 through 7 (chat flow)
  const wizardSteps = useMemo(() => [
    { step: 1, Component: StoryLengthStep },
    { step: 2, Component: GenreStep },
    { step: 3, Component: SettingStep },
    { step: 4, Component: TitleStep },
    { step: 5, Component: PlotStep },
    { step: 6, Component: WritingSampleStep },
    { step: 7, Component: SummaryStep }
  ], [])

  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only scroll if the chat container exists (i.e., currentStep > 0)
    if (chatContainerRef.current && currentStep > 0) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [currentStep])

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

      {/* Provide context globally */}
      <WizardContext.Provider value={{ currentStep, setCurrentStep, formData, setFormData, totalSteps: 8 }}>
        {/* Conditionally render Intro or the main chat flow */}
        {currentStep === 0 ? (
          <Intro />
        ) : (
          <div className="flex flex-grow overflow-hidden p-16 md:p-32">
            <aside className="w-[280px] border-r p-4 overflow-y-auto bg-muted/40 shrink-0">
              <ParameterChecklist />
            </aside>

            <main ref={chatContainerRef} className="flex-grow p-6 overflow-y-auto space-y-6">
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
