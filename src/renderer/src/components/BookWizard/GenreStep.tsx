import { useState } from 'react' // Removed unused useMemo
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWizard, genres } from '@/components/BookWizard/index'
import minstrelIcon from '@/assets/bot/base.png'

interface GenreStepProps {
  handleProceed: (nextStep: number) => void
  currentStep: number
  isActive: boolean
}

const GenreStep = ({ handleProceed, currentStep, isActive }: GenreStepProps) => {
  const { formData, setFormData } = useWizard()
  const [open, setOpen] = useState(false)

  const onNextClick = () => {
    if (formData.genre) handleProceed(currentStep + 1)
  }

  return (
    <div className="space-y-4">
      {/* Assistant Message */}
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow"> {/* Applied chat colors */}
          <p className="text-sm font-semibold">What genre are we writing in?</p>
        </div>
      </div>

      {/* Conditional Rendering */}
      {/* Removed duplicate message bubble */}

      {isActive ? (
        <>
          <div className="p-4 border rounded-lg space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                  {formData.genre ? genres.find((g) => g.value === formData.genre)?.label : 'Select genre...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search genre..." />
                  <CommandList>
                    <CommandEmpty>No genre found.</CommandEmpty>
                    <CommandGroup>
                      {genres.map((genre) => (
                        <CommandItem
                          key={genre.value}
                          onSelect={() => {
                            setFormData({ ...formData, genre: genre.value, setting: '' })
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

          <div className="flex justify-end">
            <Button onClick={onNextClick} disabled={!formData.genre}>
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm font-medium text-muted-foreground"></p>
          <p className="text-sm">Let&apos;s write a {genres.find((g) => g.value === formData.genre)?.label || 'Not set'}</p>
        </div>
      )}
    </div>
  )
}

export default GenreStep
