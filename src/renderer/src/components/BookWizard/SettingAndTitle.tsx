import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { CommandList, CommandEmpty, CommandGroup, CommandItem, CommandInput, Command } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
// Removed DialogHeader, DialogTitle import
// Removed Progress import
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWizard, genres, genreSettings, sanitizeFilename, WizardNavigation } from '@/components/BookWizard/index' // Updated imports from BookWizard/index.tsx


const SettingAndTitle = () => {
  const { currentStep, formData, setFormData, totalSteps } = useWizard()

  const [open, setOpen] = useState(false)

  const settings = genreSettings[formData.genre as keyof typeof genreSettings] || ['Other']

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Removed DialogHeader */}
      <div className="flex flex-row w-full justify-between mt-6 gap-4 items-center"> {/* Added items-center */}
        {/* Replaced DialogTitle with a span */}
        <span className="leading-2 font-semibold">{currentStep}/5 </span>
        {/* Removed Progress component */}
      </div>
      {/* End of removed DialogHeader section */}
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
      <WizardNavigation />
    </div>
  )
}

export default SettingAndTitle
