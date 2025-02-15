'use client'

import type React from 'react'
import { useState, createContext, useContext, useEffect } from 'react'
// import Torrent from '@/components/visuals/torrent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setActiveView } from '@/lib/utils/appStateSlice'
import { useDispatch } from 'react-redux'
import { generateSkeleton } from '@/lib/chatManager' // Import generateSkeleton
import { setActiveProject } from '@/lib/utils/projectsSlice'

// Context for managing wizard state
interface WizardContextProps {
  currentStep: number
  setCurrentStep: (step: number) => void
  formData: { [key: string]: any }
  setFormData: (data: { [key: string]: any }) => void
}

const WizardContext = createContext<WizardContextProps>({
  currentStep: 0,
  setCurrentStep: () => { },
  formData: {},
  setFormData: () => { }
})

// Custom hook for using wizard context
const useWizard = () => useContext(WizardContext)

// Utility function to sanitize filename
const sanitizeFilename = (filename: string) => {
  return filename.replace(/[^a-z0-9_-]/gi, ' ')
}

const cheatData = {
  genre: 'science_fiction',
  length: 80000,
  title: 'The Crimson Nebula',
  setting: 'Alien Planet',
  plot: 'A team of explorers discovers a hidden artifact on a remote alien planet, unleashing an ancient power that threatens the galaxy.',
  writing_sample:
    'The red dust swirled around their boots as they trudged across the desolate landscape. The twin suns cast long, eerie shadows, painting the alien world in shades of crimson and ochre.'
}

// Navigation component
const Navigation = () => {
  const dispatch = useDispatch()
  const { currentStep, setCurrentStep, formData, setFormData } = useWizard()

  const handleExit = () => {
    dispatch(setActiveView('intro')) // Exit the wizard
    setCurrentStep(0)
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCheat = async () => {
    setFormData(cheatData)
    console.log('Cheating...')
    if (currentStep < 4) {
      setCurrentStep(4)
    }
  }

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1:
        return !formData.title || !formData.length || !formData.genre
      case 2:
        return !formData.setting || !formData.plot || (formData.plot && formData.plot.length < 200)
      case 3:
        return !formData.writing_sample
      default:
        return false
    }
  }

  return (
    <CardFooter className="flex justify-between">
      {
        <Button className="mx-1" onClick={handleExit}>
          Exit
        </Button>
      }
      {
        <Button className="mx-1" onClick={handleCheat}>
          Cheat
        </Button>
      }
      <div className="flex flex-1"></div>
      {currentStep > 0 && (
        <Button className="mx-1" onClick={handleBack}>
          Back
        </Button>
      )}
      {currentStep < 4 && currentStep > 0 && (
        <Button className="mx-1" onClick={handleNext} disabled={isNextDisabled()}>
          Next
        </Button>
      )}
    </CardFooter>
  )
}

// Start Page
const StartPage = () => {
  const { setCurrentStep } = useWizard()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Welcome to the Book Outline Wizard</h2>
      <p className="text-center">
        Would you like to start from an existing file or create a new story?
      </p>
      <div className="space-x-4  flex flex-row justify-center">
        <Button disabled>Start from existing file (Coming soon)</Button>
        <Button onClick={() => setCurrentStep(1)}>Create a new story</Button>
      </div>
    </div>
  )
}

// Page One
const PageOne = () => {
  const { formData, setFormData } = useWizard()
  const [open, setOpen] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const genres = [
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'science_fiction', label: 'Science Fiction' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'thriller', label: 'Thriller' },
    { value: 'horror', label: 'Horror' },
    { value: 'romance', label: 'Romance' },
    { value: 'historical_fiction', label: 'Historical Fiction' },
    { value: 'literary_fiction', label: 'Literary Fiction' },
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

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Preliminary Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title || ''}
          onChange={handleInputChange}
          placeholder="Enter your book title"
        />
        <p className="text-sm text-gray-500">
          {formData.title?.length > 0
            ? `We'll use "${sanitizeFilename(formData.title || '')}" as the name for your folder.`
            : ' '}
        </p>
      </div>

      <div>
        <Label>Novel Length</Label>
        <Slider
          defaultValue={[50000]}
          max={120000}
          step={1}
          onValueChange={(value) => setFormData({ ...formData, length: value[0] })}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          {novelLengths.map((length) => (
            <span key={length.value}>{length.value}</span>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {novelLengths.find((length) => length.value >= (formData.length || 0))?.label}
        </p>
        <p className="text-sm text-gray-500">{`Don't worry, we can change this later!`}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">Genre</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {formData.genre
                ? genres.find((genre) => genre.value === formData.genre)?.label
                : 'Select genre...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search genre..." />
              <CommandList>
                <CommandEmpty>No genre found.</CommandEmpty>
                <CommandGroup>
                  {genres.map((genre) => (
                    <CommandItem
                      key={genre.value}
                      onSelect={() => {
                        setFormData({ ...formData, genre: genre.value })
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          formData.genre === genre.value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {genre.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

// Page Two
const PageTwo = () => {
  const { formData, setFormData } = useWizard()
  const [characterCount, setCharacterCount] = useState(0)

  const genreSettings = {
    science_fiction: ['Space', 'Alien Planet', 'Mars Colony', 'Dystopian Future', 'Other'],
    fantasy: ['Middle Earth', 'Wizard World', 'Medieval Kingdom', 'Other']
    // Add more genres and their settings here
  }

  const settings = genreSettings[formData.genre as keyof typeof genreSettings] || ['Other']

  useEffect(() => {
    setCharacterCount(formData.plot?.length || 0)
  }, [formData.plot])

  const handlePlotChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, plot: e.target.value })
    setCharacterCount(e.target.value.length)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="setting">Initial Setting</Label>
        <Select
          value={formData.setting || ''}
          onValueChange={(value) => setFormData({ ...formData, setting: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a setting" />
          </SelectTrigger>
          <SelectContent>
            {settings.map((setting) => (
              <SelectItem key={setting} value={setting.toLowerCase()}>
                {setting}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="plot">Basic Plot</Label>
        <Textarea
          id="plot"
          placeholder="Describe main characters, environments, what the story is about, and what the climax might be."
          value={formData.plot || ''}
          onChange={handlePlotChange}
          className="mb-2"
        />
        <div className="text-sm text-gray-500 flex justify-between items-center">
          <span>Minimum 200 characters required</span>
          <span className={characterCount >= 200 ? 'text-black' : 'text-gray-500'}>
            {characterCount}/200
          </span>
        </div>
      </div>
    </div>
  )
}

// Page Three
const PageThree = () => {
  const { formData, setFormData } = useWizard()

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="writing_sample">Writing Sample</Label>
        <Textarea
          id="writing_sample"
          placeholder="Provide a writing sample. The tool will mirror your writing style."
          value={formData.writing_sample || ''}
          onChange={(e) => setFormData({ ...formData, writing_sample: e.target.value })}
        />
      </div>
    </div>
  )
}

// Summary Page
const SummaryPage = () => {
  const { formData } = useWizard()
  const dispatch = useDispatch()

  const handleDream = async () => {
    const projectTitle = sanitizeFilename(formData.title || 'Untitled Project')
    const projectId = Date.now().toString()

    dispatch(
      setActiveProject({
        id: projectId,
        title: projectTitle,
        fullPath: `/Users/sacha/Documents/Minstrel/${projectTitle}`,
        files: [],
        genre: formData.genre,
        summary: '',
        year: new Date().getFullYear(),
        totalWordCount: 0,
        criticSuggestions: []
      })
    )
    generateSkeleton(formData)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        Great. We&apos;re ready to create your {formData.genre} story.
      </h2>
      <Button onClick={handleDream}>Dream</Button>
    </div>
  )
}

// Wizard component
export const BookOutlineWizard = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})

  const totalSteps = 4 // Including summary page

  return (
    <div className="w-full h-full flex items-center justify-center ">
      <WizardContext.Provider value={{ currentStep, setCurrentStep, formData, setFormData }}>
        <Card className="w-[800px] grid grid-cols-2 gap-4">
          <div>{/* <Torrent /> */}</div>
          <div>
            <CardHeader>
              <CardTitle>Dreaming... {currentStep}/4🪄</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(currentStep / (totalSteps - 1)) * 100} className="mb-4" />
              {currentStep === 0 && <StartPage />}
              {currentStep === 1 && <PageOne />}
              {currentStep === 2 && <PageTwo />}
              {currentStep === 3 && <PageThree />}
              {currentStep === 4 && <SummaryPage />}
            </CardContent>
            <Navigation />
          </div>
        </Card>
      </WizardContext.Provider>
    </div>
  )
}
