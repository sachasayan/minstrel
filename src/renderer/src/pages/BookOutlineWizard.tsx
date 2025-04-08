'use client'

import type React from 'react'
import { useState, useContext } from 'react'
import ParameterChecklist from '@/components/BookWizard/ParameterChecklist'
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { useSelector } from 'react-redux'

import Intro from '@/components/BookWizard/Intro'
import StoryLength from '@/components/BookWizard/StoryLength'
import SettingAndTitle from '@/components/BookWizard/SettingAndTitle'
import PlotPage from '@/components/BookWizard/PlotPage'
import WritingSamplePage from '@/components/BookWizard/WritingSamplePage'
import SummaryPage from '@/components/BookWizard/SummaryPage'
import { WizardContext, useWizard, WizardNavigation, genres, novelLengths, genreSettings, cheatData, sanitizeFilename } from '@/components/BookWizard/index' // Updated imports from BookWizard/index.tsx


// Navigation component is kept in BookOutlineWizard.tsx
const Navigation = WizardNavigation


export const BookOutlineWizard = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const totalSteps = 5

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WizardContext.Provider value={{ currentStep, setCurrentStep, formData, setFormData, totalSteps }}>
        <DialogContent
          className="sm:max-w-[800px]"
          onInteractOutside={(e) => {
            e.preventDefault()
          }}
        >
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2">
              <ParameterChecklist />
            </div>
            <div className="col-span-3 flex flex-col">
              {currentStep === 0 && <Intro />}
              {currentStep === 1 && <StoryLength />}
              {currentStep === 2 && <SettingAndTitle />}
              {currentStep === 3 && <PlotPage />}
              {currentStep === 4 && <WritingSamplePage />}
              {currentStep === 5 && <SummaryPage />}
            </div>
          </div>
        </DialogContent>
      </WizardContext.Provider>
    </Dialog>
  )
}
