import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Edit } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface EditableHeadingProps {
  heading: string
  onHeadlineHasChanged: (newHeadline: string) => void
}

const EditableHeading: React.FC<EditableHeadingProps> = ({ heading, onHeadlineHasChanged }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogInputValue, setDialogInputValue] = useState(heading)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    setDialogInputValue(heading)
  }, [heading])

  const handleSaveClick = useCallback(() => {
    if (!dialogInputValue.trim()) {
      setDialogError("You must provide a title.")
      return // Prevent dialog close if invalid
    }
    onHeadlineHasChanged(dialogInputValue)
    setIsDialogOpen(false) // Only close dialog if valid
    setDialogError(null)
  }, [dialogInputValue, onHeadlineHasChanged, setIsDialogOpen, setDialogError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDialogInputValue(e.target.value)
    setDialogError(null) // Clear error on input change
  }


  return (
    <div className="relative group">
      <h1 className="text-3xl font-bold mb-6 text-highlight-700 truncate group-hover:cursor-pointer group-hover:underline">{heading}</h1>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div className="absolute right-0 top-0 mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
            <Edit size={20} className="text-gray-500 hover:text-gray-700" />
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Title</DialogTitle>
            <DialogDescription>
              Enter a new title for your document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input id="title" value={dialogInputValue} onChange={handleInputChange} className="col-span-4" />
            </div>
            {dialogError && <p className="text-red-500 text-sm">{dialogError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => { setIsDialogOpen(false); setDialogError(null); setDialogInputValue(heading) }} asChild>
              <DialogClose>Cancel</DialogClose>
            </Button>
            <Button type="button" onClick={handleSaveClick} > {/* REMOVE DialogClose HERE */}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EditableHeading
