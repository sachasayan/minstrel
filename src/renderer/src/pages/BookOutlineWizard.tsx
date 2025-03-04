'use client'

import type React from 'react'
import { useState, createContext, useContext, useEffect } from 'react'
import Torrent from '@/components/visuals/torrent'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { selectSettingsState } from '@/lib/store/settingsSlice'
import { useDispatch, useSelector } from 'react-redux'
import { generateSkeleton } from '@/lib/services/chatService'
import { setActiveProject } from '@/lib/store/projectsSlice'

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

const sanitizeFilename = (filename: string) => {
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
        return !formData.writing_sample
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

const Intro = () => {
  const { setCurrentStep, setFormData, currentStep } = useWizard()
  const handleCheat = async () => {
    setFormData(cheatData)
    console.log('Cheating...')
    if (currentStep < 5) {
      setCurrentStep(5)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow space-y-4 flex flex-col items-center justify-center p-16 ">
        <h2 className="text-2xl font-bold text-center">Hello, Dreamer</h2>
        <p className="text-center text-sm text-gray-500">{`It's nice to meet you! Do you have an idea for a story, or should I come up with something? `}</p>
        <div className="flex flex-row w-full gap-4 justify-between">
          <Button className="mx-1" onClick={handleCheat}>
            Help me!
          </Button>
          <Button onClick={() => setCurrentStep(1)}>{`I've got a story idea already.`} </Button>
        </div>
      </div>
      <Navigation />
    </div>
  )
}

const StoryLength = () => {
  const { currentStep, formData, setFormData, totalSteps } = useWizard()

  useEffect(() => {
    setFormData(formData.length || 50000)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <div className="flex flex-row w-full justify-between mt-6 gap-4 align-center">
          <DialogTitle className="leading-2 ">{currentStep}/5 </DialogTitle>
          <Progress value={(currentStep / (totalSteps - 1)) * 100} className="mb-4" />
        </div>
      </DialogHeader>
      <div className="flex-grow flex flex-col justify-center gap-4">
        <div>
          <p className="text-sm text-gray-500">{`Okay, let me walk you through the steps. First let's get an idea of where we should go with this. Don't worry, we can change everything later.`}</p>
        </div>
        <div>
          <Label>How long of a story are we writing?</Label>
          <Slider defaultValue={[50000]} max={120000} step={1} onValueChange={(value) => setFormData({ ...formData, length: value[0] })} className="mt-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {novelLengths.map((length) => (
              <span key={length.value}>{length.value}</span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">{novelLengths.find((length) => length.value >= (formData.length || 0))?.label}</p>
        </div>
      </div>
      <Navigation />
    </div>
  )
}

const SettingAndTitle = () => {
  const { currentStep, formData, setFormData, totalSteps } = useWizard()

  const [open, setOpen] = useState(false)

  const settings = genreSettings[formData.genre as keyof typeof genreSettings] || ['Other']

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <div className="flex flex-row w-full justify-between mt-6 gap-4 align-center">
          <DialogTitle className="leading-2 ">{currentStep}/5 </DialogTitle>
          <Progress value={(currentStep / (totalSteps - 1)) * 100} className="mb-4" />
        </div>
      </DialogHeader>
      <div className="flex-grow flex flex-col justify-center gap-4">
        <div>
          <Label htmlFor="genre">Genre</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                {formData.genre ? genres.find((genre) => genre.value === formData.genre)?.label : 'Select genre...'}
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
                        <Check className={cn('mr-2 h-4 w-4', formData.genre === genre.value ? 'opacity-100' : 'opacity-0')} />
                        {genre.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="setting">Initial Setting</Label>
          <Select value={formData.setting || ''} onValueChange={(value) => setFormData({ ...formData, setting: value })}>
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
        <div className="space-y-4">
          <Label htmlFor="title">What should we call your story for now?</Label>
          <Input id="title" name="title" value={formData.title || ''} onChange={handleInputChange} placeholder="Enter your book title" />
          <p className="text-sm text-gray-500">{formData.title?.length > 0 ? `We'll use "${sanitizeFilename(formData.title || '')}" as the name for your folder.` : ' '}</p>
        </div>
      </div>
      <Navigation />
    </div>
  )
}

const PlotPage = () => {
  const { currentStep, formData, setFormData, totalSteps } = useWizard()

  const handlePlotChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, plot: e.target.value })
  }

  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <DialogTitle className="leading-2 ">{currentStep}/5 </DialogTitle>
        <Progress value={(currentStep / (totalSteps - 1)) * 100} className="mb-4" />
      </DialogHeader>
      <div className="flex-grow flex flex-col items-center justify-center gap-4">
        <div>
          <Label htmlFor="plot">Basic Plot</Label>

          <p className="text-sm text-gray-500"></p>
          <Textarea
            id="plot"
            placeholder="Describe main characters, environments, what the story is about, and what the climax might be. We recommend at least 200 characters."
            value={formData.plot || ''}
            onChange={handlePlotChange}
            className="mb-2"
          />
          <div className="text-sm text-gray-500 flex justify-between gap-4 items-top">
            <span>{`i.e "A team of explorers discovers a hidden artifact on a remote alien planet, unleashing an ancient power that threatens the galaxy."`}</span>

          </div>
        </div>
      </div>
      <Navigation />
    </div>
  )
}


const WritingSamplePage = () => {
  const { currentStep, formData, setFormData, totalSteps } = useWizard()

  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <div className="flex flex-row w-full justify-between mt-6 gap-4 align-center">
          <DialogTitle className="leading-2 ">{currentStep}/5 </DialogTitle>
          <Progress value={(currentStep / (totalSteps - 1)) * 100} className="mb-4" />
        </div>
      </DialogHeader>
      <div className="flex-grow flex flex-col items-center justify-center gap-4">
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
      <Navigation />
    </div>
  )
}


const SummaryPage = () => {
  const dispatch = useDispatch()
  const { currentStep, formData, totalSteps } = useWizard()
  const [requestPending, setRequestPending] = useState(false)
  const settingsState = useSelector(selectSettingsState)

  const handleDream = async () => {
    const projectTitle = sanitizeFilename(formData.title || 'Untitled Project')

    dispatch(
      setActiveProject({
        title: projectTitle,
        projectPath: `${settingsState?.workingRootDirectory}/${projectTitle}`,
        files: [],
        genre: formData.genre,
        summary: '',
        writingSample: formData.writing_sample,
        year: new Date().getFullYear(),
        totalWordCount: 0,
        expertSuggestions: [],
        knowledgeGraph: null
      })
    )
    generateSkeleton(formData)
    setRequestPending(true)
  }

  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <div className="flex flex-row w-full justify-between mt-6 gap-4 align-center">
          <DialogTitle className="leading-2 ">{currentStep}/5 </DialogTitle>
          <Progress value={(currentStep / (totalSteps - 1)) * 100} className="mb-4" />
        </div>
      </DialogHeader>
      <div className="flex-grow flex flex-col items-center justify-center p-8 gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Great. We&apos;re ready to create your {genres?.find((item) => item.value === formData.genre)?.label} story.</h2>
          <p className="text-sm text-gray-500">This&apos;ll take a few seconds. Just hang tight.</p>
        </div>
        <div className="flex flex-row items-center justify-center">
          {!requestPending && <Button onClick={handleDream}>I&apos;m ready!</Button>}
          {!!requestPending && (
            <Button disabled>
              Creating your story...
              <div className="flex items-center justify-center p-2">
                <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1"></div>
                <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-75"></div>
                <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-150"></div>
              </div>
            </Button>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  )
}

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
              <Torrent />
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
