import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useOnboarding } from './context'
import { useDispatch } from 'react-redux'
import { setSettingsState } from '@/lib/store/settingsSlice'
import minstrelIcon from '@/assets/bot/base.png'
import { AppDispatch } from '@/lib/store/store'

interface OnboardingSummaryStepProps {
  isActive: boolean // Prop received from parent map
}
const OnboardingSummaryStep = ({ isActive }: OnboardingSummaryStepProps): ReactNode => { // Added isActive back
  const { formData } = useOnboarding()
  const dispatch = useDispatch<AppDispatch>() // Use typed dispatch

  const handleSaveSettings = () => {
    // Ensure formData has the expected structure before saving
    const settingsToSave = {
      api: '', // Assuming default empty API endpoint if not collected
      apiKey: formData.apiKey || '',
      workingRootDirectory: formData.workingRootDirectory || '',
      // Include default model IDs if they should be set during onboarding
      // highPreferenceModelId: 'default-high-model', // Example
      // lowPreferenceModelId: 'default-low-model', // Example
    }

    // Dispatch to update Redux state
    dispatch(setSettingsState(settingsToSave))

    // Save settings persistently via IPC
    console.log('Saving settings:', settingsToSave)
    window.electron.ipcRenderer.invoke('save-app-settings', settingsToSave)

    // Closing the onboarding flow is now handled by App.tsx based on settings state change
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow">
          <h2 className="text-lg font-semibold mb-1 text-center">Great. We&apos;re ready to go.</h2>
          <p className="text-sm mb-4 text-center">
            {`That was painless, right? If you need to change things in the future, you can go to the Settings area.`}
          </p>

          {/* Button inside the bubble */}
          <div className="flex flex-row items-center justify-center mt-4">
            <Button variant="secondary" size="sm" onClick={handleSaveSettings}>
                I&apos;m ready!
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingSummaryStep
