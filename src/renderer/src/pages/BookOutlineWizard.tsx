'use client'

import type { ReactNode } from 'react' // Keep ReactNode
import { useState } from 'react' // Keep useState, remove useContext
import { useDispatch } from 'react-redux' // Add useDispatch
import { setActiveView } from '@/lib/store/appStateSlice' // Add setActiveView
import { Button } from '@/components/ui/button' // Keep Button
import { ArrowLeft } from 'lucide-react' // Add ArrowLeft
import { cn } from '@/lib/utils' // Add cn

// Removed Dialog imports
// Removed Progress import
// Removed selectSettingsState and useSelector imports

import ParameterChecklist from '@/components/BookWizard/ParameterChecklist'
import Intro from '@/components/BookWizard/Intro'
import StoryLength from '@/components/BookWizard/StoryLength'
import SettingAndTitle from '@/components/BookWizard/SettingAndTitle'
import PlotPage from '@/components/BookWizard/PlotPage'
import WritingSamplePage from '@/components/BookWizard/WritingSamplePage'
import SummaryPage from '@/components/BookWizard/SummaryPage'
import { WizardContext } from '@/components/BookWizard/index' // Keep WizardContext, remove others for now

// Removed Navigation assignment

export default function BookOutlineWizard(): ReactNode { // Changed export and removed props
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const totalSteps = 5 // Assuming Intro is step 0, then 5 steps for data entry + summary
  const dispatch = useDispatch() // Add dispatch hook

  const handleGoBack = () => {
    dispatch(setActiveView('intro')) // Navigate back to intro as decided
  }

  return (
    // Added SettingsPage layout structure
    <div className={cn(
      "flex flex-col h-screen p-16 md:p-32", // Use SettingsPage padding
      "animate-in fade-in zoom-in-95 duration-300"
    )}>
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-2xl font-bold">Create New Project Outline</h1>
      </header>

      {/* Added main content wrapper */}
      <main className="flex-grow overflow-y-auto">
        {/* WizardContext Provider wraps the grid */}
        <WizardContext.Provider value={{ currentStep, setCurrentStep, formData, setFormData, totalSteps }}>
          {/* Kept the 5-column grid */}
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2">
              <ParameterChecklist />
            </div>
            <div className="col-span-3 flex flex-col">
              {/* Step rendering logic remains the same */}
              {currentStep === 0 && <Intro />}
              {currentStep === 1 && <StoryLength />}
              {currentStep === 2 && <SettingAndTitle />}
              {currentStep === 3 && <PlotPage />}
              {currentStep === 4 && <WritingSamplePage />}
              {currentStep === 5 && <SummaryPage />}
            </div>
          </div>
          {/* WizardNavigation is NOT rendered here - handled by steps */}
        </WizardContext.Provider>
      </main>
      {/* Optional: Add a footer if needed later */}
      {/* <footer className="mt-auto pt-4 border-t">Footer content</footer> */}
    </div>
  )
}
