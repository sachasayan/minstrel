import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { addChatMessage } from '@/lib/store/chatSlice'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
} from '@/components/ui/command'

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === '/') {
        event.preventDefault()
        setOpen(!open)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandItem onSelect={() => {
          setOpen(false)
          dispatch(addChatMessage({ sender: 'User', text: 'Update the outline' }))
        }}>
          Update the outline
        </CommandItem>
        <CommandItem onSelect={() => {
          setOpen(false)
          dispatch(addChatMessage({ sender: 'User', text: 'Write the next chapter' }))
        }}>
          Write the next chapter
        </CommandItem>
        <CommandItem onSelect={() => {
          setOpen(false)
          dispatch(addChatMessage({ sender: 'User', text: 'Write a review' }))
        }}>
          Write a review
        </CommandItem>
      </CommandList>
    </CommandDialog>
  )
}

export default CommandPalette
