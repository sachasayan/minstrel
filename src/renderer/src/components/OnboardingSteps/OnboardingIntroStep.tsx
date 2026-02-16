import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Folder, WandSparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useOnboarding } from './context' // Use the new context hook
import minstrelIcon from '@/assets/bot/base.png'

interface OnboardingIntroStepProps {
  isActive: boolean // Prop received from parent map
}

const OnboardingIntroStep = ({ isActive }: OnboardingIntroStepProps): ReactNode => {
  // Get context methods - use setFormData for partial updates
  const { setCurrentStep, setFormData } = useOnboarding()

  const selectFolder = async () => {
    try {
      const exportPath = await window.electron.ipcRenderer.invoke('select-directory', 'export')
      if (exportPath) {
        // Use functional update with setFormData
        setFormData(prev => ({ ...prev, workingRootDirectory: exportPath }))
        return exportPath // Return path for potential immediate use if needed
      }
    } catch (error) {
        console.error("Error selecting directory:", error);
        toast.error("Failed to select directory.");
    }
    return null
  }

  const handleChooseDirectory = async () => {
    const pathSelected = await selectFolder()
    if (pathSelected) {
        setCurrentStep(1) // Proceed only if a path was selected
    }
  }

  const handleUseDefault = () => {
    // Note: '~' might not resolve correctly depending on backend setup.
    // Consider resolving it in the main process or using a placeholder.
    // For now, keeping the original logic.
    setFormData(prev => ({ ...prev, workingRootDirectory: '~/Documents/Minstrel' }))
    setCurrentStep(1)
  }


  return (
    // Restyled to match chat bubble format
     <div className="space-y-4"> {/* Outer container */}
       <div className="flex items-start gap-3"> {/* Icon + Bubble container */}
         <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
         <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow"> {/* Bubble */}
           <h2 className="text-lg font-semibold mb-1">Welcome to Minstrel</h2>
           <p className="text-sm mb-4">
             Looks like you&apos;re new here! It&apos;s nice to meet you. Before we get started, let&apos;s set up a couple things. First, where should Minstrel save your project files?
             <br /> We suggest <b>~/Documents/Minstrel</b>, but it&apos;s your choice.
           </p>

           {/* Buttons moved inside the bubble */}
           <div className="flex flex-row gap-2 justify-end mt-4">
             <Button variant="secondary" size="sm" onClick={handleChooseDirectory}>
               <Folder className="mr-2 h-4 w-4" /> Choose Directory
             </Button>
             <Button variant="secondary" size="sm" onClick={handleUseDefault}>
                <WandSparkles className="mr-2 h-4 w-4" /> Use Default
             </Button>
           </div>
         </div>
       </div>
       {/* No separate "Next" button needed for this step */}
     </div>
  )
}

export default OnboardingIntroStep
