import { createContext, useContext } from 'react'



interface WizardContextProps {
  totalSteps: number
  currentStep: number
  setCurrentStep: (step: number) => void
  formData: { [key: string]: any }
  setFormData: (data: { [key: string]: any }) => void
  selectedCoverPath: string | null
  setSelectedCoverPath: (path: string | null) => void
  requestScrollToBottom: () => void
}

const WizardContext = createContext<WizardContextProps>({
  totalSteps: 9, // Default value, will be overridden by Provider
  currentStep: 0,
  setCurrentStep: () => { },
  formData: {},
  setFormData: () => { },
  selectedCoverPath: null,
  setSelectedCoverPath: () => { },
  requestScrollToBottom: () => { }
})

const useWizard = () => useContext(WizardContext)


const sanitizeFilename = (filename: string) => { // Move sanitizeFilename to index.tsx
  return filename.replace(/[^a-z0-9_-]/gi, ' ')
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
  { value: 'adventure', label: 'Adventure' },
  { value: 'humor', label: 'Humor' }
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
  adventure: ['Jungle Expedition', 'Treasure Hunt', 'Lost Civilization', 'Pirate Adventure', 'Other'],
  humor: ['Satirical World', 'Everyday Life', 'Workplace Comedy', 'Absurdist Setting', 'Other']
}


export { WizardContext, useWizard, genres, genreSettings, sanitizeFilename }
