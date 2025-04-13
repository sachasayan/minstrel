import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWizard, genreSettings } from '@/components/BookWizard/index'
import minstrelIcon from '@/assets/bot/base.png' // <-- Import icon

interface SettingStepProps {
  handleProceed: (nextStep: number) => void
  currentStep: number
  isActive: boolean
}

const SettingStep = ({ handleProceed, currentStep, isActive }: SettingStepProps) => {
  const { formData, setFormData } = useWizard()

  const availableSettings = useMemo(() => {
    return genreSettings[formData.genre as keyof typeof genreSettings] || ['Other']
  }, [formData.genre])

  const onNextClick = () => {
    if (formData.setting) handleProceed(currentStep + 1)
  }

  return (
    <div className="space-y-4">
      {/* Assistant Message */}
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow"> {/* Applied chat colors */}
          <p className="text-sm font-semibold">Next, what&apos;s the initial setting for your story?</p> {/* Escaped apostrophe */}
        </div>
      </div>

      {isActive ? (
        <>
          <div className="p-4 border rounded-lg">
            <Select
              value={formData.setting || ''}
              onValueChange={(value) => setFormData({ ...formData, setting: value })}
              disabled={!formData.genre}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a setting" />
              </SelectTrigger>
              <SelectContent>
                {availableSettings.map((setting) => (
                  <SelectItem key={setting} value={setting}>
                    {setting}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={onNextClick} disabled={!formData.setting}>
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm font-medium text-muted-foreground">Initial Setting:</p>
          <p className="text-sm">{formData.setting || 'Not set'}</p>
        </div>
      )}
    </div>
  )
}

export default SettingStep
