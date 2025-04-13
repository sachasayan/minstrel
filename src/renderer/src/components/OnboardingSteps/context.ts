import { createContext, useContext } from 'react'

// Context for managing onboarding wizard state
export interface OnboardingContextProps {
  totalSteps: number
  currentStep: number
  setCurrentStep: (step: number) => void
  formData: { [key: string]: any }
  // Use a more specific type if possible, e.g., Partial<SettingsState>
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>
  // editFormData is redundant if setFormData allows partial updates
  // setShowOnboarding is handled by App.tsx logic now
}

export const OnboardingContext = createContext<OnboardingContextProps>({
  totalSteps: 3, // 0: Intro, 1: API Key, 2: Summary
  currentStep: 0,
  setCurrentStep: () => {},
  formData: {},
  setFormData: () => {}
})

// Custom hook for using onboarding context
export const useOnboarding = () => useContext(OnboardingContext)
