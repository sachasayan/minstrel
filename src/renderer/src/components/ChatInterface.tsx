import { useState, useRef, useEffect, forwardRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BotMessageSquare } from 'lucide-react'
import { selectChat, addChatMessage } from '@/lib/store/chatSlice'
import { RootState } from '@/lib/store/store'
import { Button } from '@/components/ui/button'
import { selectActiveProject } from '@/lib/store/projectsSlice'

interface ChatInterfaceProps {
  expanded: boolean
  setExpanded: (expanded: boolean) => void
}

const ChatLoadingIndicator = () => {
  return (
    <div className="flex items-center justify-center p-2">
      <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1"></div>
      <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-75"></div>
      <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-150"></div>
    </div>
  )
}

const ChatInterface = forwardRef<HTMLDivElement, ChatInterfaceProps>(({ expanded, setExpanded }, ref) => {
  const { chatHistory, pendingChat } = useSelector((state: RootState) => selectChat(state))
  const project = useSelector((state: RootState) => selectActiveProject(state))
  const [message, setMessage] = useState('')
  const dispatch = useDispatch()
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null) // Ref for the chat container
  let collapseTimeout: NodeJS.Timeout | null = null
  const lastMessageRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (pendingChat) {
      setExpanded(true)
    }
  }, [pendingChat])

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [expanded])

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const handleSend = () => {
    if (message.trim() !== '') {
      dispatch(addChatMessage({ sender: 'User', text: message }))
      setMessage('')
    }
  }

  const toggleExpanded = () => {
    if (collapseTimeout) {
      clearTimeout(collapseTimeout)
      collapseTimeout = null
    }
    setExpanded(!expanded)
  }

  const handleNextStage = (action: string) => {
    setExpanded(true)
    dispatch(addChatMessage({ sender: 'User', text: action }))
  }

  const handleFocus = () => {
    if (collapseTimeout) {
      clearTimeout(collapseTimeout)
      collapseTimeout = null
    }
  }

  const handleBlur = () => {
    if (!collapseTimeout) {
      collapseTimeout = setTimeout(() => {
        // setExpanded(true);
      }, 5000)
    }
  }

  const quickActions: (string | null)[] = [null, null, null]
  if (chatHistory.length === 0) {
    if (!project) {
      quickActions[0] = 'Create the Skeleton'
    } else if (!project.files.find((file) => file.title === 'Skeleton.md')) {
      quickActions[0] = 'Create the Skeleton'
    } else if (!project.files.find((file) => file.title === 'Outline.md')) {
      quickActions[0] = 'Create the Outline'
    } else {
      const chapterRegex = /Chapter-(\d+)\.md/
      const chapters = project.files.map((file) => chapterRegex.exec(file.title)).filter((match) => match !== null) as RegExpExecArray[]

      const chapterNumbers = chapters.map((match) => parseInt(match[1], 10))
      const nextChapter = chapterNumbers.length > 0 ? Math.max(...chapterNumbers) + 1 : 1
      quickActions[0] = `Write Chapter ${nextChapter}`
    }
  }

  return (
    <div ref={ref} className={`fixed bottom-4 right-4 z-50 ${expanded ? 'w-80' : 'w-0'}`} onFocus={handleFocus} onBlur={handleBlur}>
      {quickActions[0] && (
        <div className={`absolute transition-all bottom-0 py-4 pl-1 duration-200 ${expanded ? 'right-0' : 'right-20'} `}>
          <Button onClick={() => handleNextStage(quickActions[0] || '')} className="right-0 transition-all">
            {quickActions[0]}
          </Button>

          {quickActions[1] && (
            <div className={`absolute transition-all bottom-0 py-4 pl-1 duration-400  ${expanded ? '-left-0' : '-left-full'}`}>
              <Button onClick={() => handleNextStage(quickActions[1] || '')} className=" transition-all">
                {quickActions[1]}
              </Button>

              {quickActions[2] && (
                <div className={`absolute transition-all bottom-0 py-4 pl-1 duration-600  ${expanded ? '-left-0' : '-left-full'}`}>
                  <Button onClick={() => handleNextStage(quickActions[2] || '')} className=" transition-all">
                    {quickActions[2]}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={toggleExpanded}
        className={`z-2 bg-white shadow-lg rounded-lg border flex flex-col right-0 bottom-0 absolute overflow-hidden transition-[opacity, transform] duration-500 ${
          expanded ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
        } `}
      >
        <BotMessageSquare className={'text-gray-500 hover:text-gray-700 hover:rotate-15 transition-transform size-8 m-4'} />
      </button>
      <div
        className={`z-1 bg-white shadow-lg rounded-lg border flex flex-col transition-[max-height,max-width, width, height] duration-500 ease-in-out right-0 bottom-0 absolute overflow-hidden ${
          expanded ? 'max-h-[500px] max-w-[320px] h-96 w-80' : 'max-h-10 max-w-10 h-10 w-10'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded-lg ${msg.sender === 'User' ? 'bg-gray-200 text-left ml-8' : 'bg-black text-white text-right mr-8'}`}
              ref={index === chatHistory.length - 1 ? lastMessageRef : null}
            >
              {msg.text}
            </div>
          ))}
          {pendingChat && <ChatLoadingIndicator />}
        </div>
        <div className="border-t p-2 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 border rounded-md px-4 p-2 mr-2 outline-hidden"
            disabled={pendingChat}
          />
          <button onClick={handleSend} className="bg-black text-white p-2 rounded-lg" disabled={pendingChat}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
})

ChatInterface.displayName = 'ChatInterface'

export default ChatInterface
