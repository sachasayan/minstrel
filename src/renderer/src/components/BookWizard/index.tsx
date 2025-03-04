import { createContext, useContext } from 'react'
import { DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface WizardContextProps {
  totalSteps: number
  currentStep: number
  setCurrentStep: (step: number) => void
  formData: { [key: string]: any }
  setFormData: (data: { [key: string]: any }) => void
}

const WizardContext = createContext<WizardContextProps>({
  totalSteps: 5,
  currentStep: 0,
  setCurrentStep: () => { },
  formData: {},
  setFormData: () => { }
})

const useWizard = () => useContext(WizardContext)

const Navigation = () => {
  const { currentStep, setCurrentStep, formData } = useWizard()

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1:
        return false
      case 2:
        return !formData.title || !formData.setting || !formData.genre
      case 3:
        return !formData.plot
      case 4:
        return false // Writing sample is now optional
      default:
        return false
    }
  }

  return (
    <DialogFooter className="flex justify-between">
      <div className="flex flex-1"></div>
      {currentStep > 0 && (
        <Button className="mx-1" onClick={handleBack}>
          Back
        </Button>
      )}
      {currentStep < 5 && currentStep > 0 && (
        <Button className="mx-1" onClick={handleNext} disabled={isNextDisabled()}>
          Next
        </Button>
      )}
    </DialogFooter>
  )
}

const sanitizeFilename = (filename: string) => { // Move sanitizeFilename to index.tsx
  return filename.replace(/[^a-z0-9_-]/gi, ' ')
}

const cheatData = {
  genre: 'science-fiction',
  length: 80000,
  title: 'The Crimson Nebula',
  setting: 'Alien Planet',
  plot: 'A team of explorers discovers a hidden artifact on a remote alien planet, unleashing an ancient power that threatens the galaxy.',
  writing_sample:
    'The red dust swirled around their boots as they trudged across the desolate landscape. The twin suns cast long, eerie shadows, painting the alien world in shades of crimson and ochre.'
}

const genres = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'science-fiction', label: 'Science Fiction' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'horror', label: 'Horror' },
  { value: 'romance', label: 'Romance' },
  { value: 'historical-fiction', label: 'Historical Fiction' },
  { value: 'literary-fiction', label: 'Literary Fiction' },
  { value: 'dystopian', label: 'Dystopian' },
  { value: 'adventure', label: 'Adventure' }
]

const novelLengths = [
  { value: 7500, label: 'Short story: 1,000–7,500 words' },
  { value: 20000, label: 'Novelette: 7,500–20,000 words' },
  { value: 50000, label: 'Novella: 20,000–50,000 words' },
  { value: 80000, label: 'Short novel: 50,000–80,000 words' },
  { value: 100000, label: 'Standard novel: 80,000–100,000 words' },
  { value: 120000, label: 'Epic novel: 100,000+ words' }
]

const genreSettings = {
  'science-fiction': ['Space', 'Alien Planet', 'Mars Colony', 'Dystopian Future', 'Other'],
  fantasy: ['Middle Earth', 'Wizard World', 'Medieval Kingdom', 'Other'],
  mystery: ['Crime Scene', 'Detective Noir', 'Small Town Secrets', 'Locked Room', 'Other'],
  thriller: ['Espionage', 'Psychological', 'Crime Thriller', 'Political', 'Other'],
  horror: ['Haunted House', 'Supernatural', 'Psychological Horror', 'Monster Horror', 'Other'],
  romance: ['Historical Romance', 'Contemporary', 'Fantasy Romance', 'Enemies to Lovers', 'Other'],
  'historical-fiction': ['Ancient Civilization', 'Medieval Europe', 'Victorian Era', 'World War Era', 'Other'],
  'literary-fiction': ['Character-Driven', 'Experimental', 'Social Commentary', 'Psychological', 'Other'],
  dystopian: ['Post-Apocalyptic', 'Totalitarian Regime', 'Cyberpunk', 'Environmental Collapse', 'Other'],
  adventure: ['Jungle Expedition', 'Treasure Hunt', 'Lost Civilization', 'Pirate Adventure', 'Other']
}


export { WizardContext, useWizard, Navigation as WizardNavigation, cheatData, genres, novelLengths, genreSettings, sanitizeFilename } // Export sanitizeFilename
