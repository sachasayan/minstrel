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
    <>
      <div className="flex items-center justify-center p-2">
        <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1"></div>
        <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-75"></div>
        <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-150"></div>
      </div>
    </>
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

  const actionSuggestions = useSelector((state: RootState) => selectChat(state).actionSuggestions)

  return (
    <>
      <div ref={ref} onFocus={handleFocus} onBlur={handleBlur}>
        {/* Activate Chat button. */}
        <div className={` fixed bottom-2 right-2 z-50  `} >
          <button
            onClick={toggleExpanded}
            className={`z-2 bg-neutral-100 shadow-lg rounded-lg border flex flex-col right-4 bottom-4 absolute overflow-hidden transition-[opacity, transform] duration-500 ${expanded ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
              } `}
          >
            <BotMessageSquare className={'text-gray-500 hover:text-gray-700 hover:rotate-15 transition-transform size-8 m-4'} />
          </button>

        </div >
        {/* Chat flow */}
        <div className={`h-screen overflow-hidden sticky top-0 right-0 transition-size duration-500 ${expanded ? 'max-w-80' : 'max-w-0'} `}>
          <div className="h-full p-4 w-80">
            <div
              className={` bg-neutral-100 shadow-lg rounded-lg border flex flex-col h-full`}
            >
              <div className="flex justify-between items-center p-2 border-b">
                <div className="font-semibold">Chat</div>
                <Button size="icon" variant="ghost" onClick={() => setExpanded(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 p-2 rounded-lg ${msg.sender === 'User' ? 'bg-gray-200 text-left ml-8' : 'bg-highlight-800 text-white text-right mr-8'}`}
                    ref={index === chatHistory.length - 1 ? lastMessageRef : null}
                  >
                    {msg.text}
                  </div>
                ))}

                {/* Suggestions */}
                {actionSuggestions.slice(0, 3).map((suggestion, index) => (
                  <Button onClick={() => handleNextStage(suggestion)} key={index} className={`  transition-all mr-2 my-2 inline-block bg-highlight-600`}>
                    {suggestion}
                  </Button>
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
                <button onClick={handleSend} className="bg-highlight-700 text-white p-2 rounded-lg" disabled={pendingChat}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
})

ChatInterface.displayName = 'ChatInterface'

export default ChatInterface
