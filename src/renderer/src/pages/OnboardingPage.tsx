'use client'

import type { ReactNode, UIEvent } from 'react'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { OnboardingContext } from '@/components/OnboardingSteps/context'

// Import actual step components
import OnboardingIntroStep from '@/components/OnboardingSteps/OnboardingIntroStep'
import OnboardingApiKeyStep from '@/components/OnboardingSteps/OnboardingApiKeyStep'
import OnboardingSummaryStep from '@/components/OnboardingSteps/OnboardingSummaryStep'

// Placeholders removed, actual components imported above


const SCROLL_THRESHOLD = 50 // Pixels from bottom to consider "at bottom"

// Animation variants (copied from BookOutlineWizard)
const stepVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.5 } }
};


export default function OnboardingPage(): ReactNode {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isAtBottom, setIsAtBottom] = useState(true) // State for sticky scroll
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Note: No handleGoBack needed as per plan

  // Proceed to next step (no delay needed here, animation handles it)


  // Function to scroll the main content area to the bottom
  const requestScrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      // Add a slight delay to ensure content has rendered before scrolling
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50); // Short delay
    }
  }, []);

  // Use imported components in the steps array
  const onboardingSteps = useMemo(() => [
    { step: 0, Component: OnboardingIntroStep },
    { step: 1, Component: OnboardingApiKeyStep },
    { step: 2, Component: OnboardingSummaryStep }
  ], [])

  const totalSteps = onboardingSteps.length;

  // Effect to scroll to bottom if isAtBottom is true when step changes
  useEffect(() => {
    if (isAtBottom) {
      requestScrollToBottom();
    }
  }, [currentStep, isAtBottom, requestScrollToBottom])

  // Handler for scroll events on the chat container
  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const scrollFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    setIsAtBottom(scrollFromBottom <= SCROLL_THRESHOLD)
  }, [])

  return (
    // Root element with full page styling and padding
    <div className={cn(
      "flex flex-col h-screen p-16 md:p-32", // Use same padding as Settings/BookWizard
      "animate-in fade-in duration-500" // Simpler fade-in for the whole page
    )}>

      {/* No Header */}

      <OnboardingContext.Provider value={{ currentStep, setCurrentStep, formData, setFormData, totalSteps }}>
        <div className="flex flex-grow overflow-hidden gap-8"> {/* Added gap */}


          {/* Right Main Area (Chat Flow) */}
          <main ref={chatContainerRef} onScroll={handleScroll} className="flex-grow overflow-y-auto space-y-6 pr-4"> {/* Added padding-right */}
            {onboardingSteps
              .filter(stepInfo => stepInfo.step <= currentStep) // Render current and previous steps
              .map((stepInfo) => (
                <motion.div
                  key={stepInfo.step}
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  layout // Add layout for smoother transitions if needed
                >
                  <stepInfo.Component
                    isActive={stepInfo.step === currentStep}
                  />
                </motion.div>
              ))}
          </main>
        </div>
      </OnboardingContext.Provider>
    </div>
  )
}
