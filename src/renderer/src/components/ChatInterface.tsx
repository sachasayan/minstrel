import { useState, useRef, useEffect, forwardRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectChat, addChatMessage } from '@/lib/store/chatSlice'
import { RootState } from '@/lib/store/store'
import { Button } from '@/components/ui/button'
import minstrelIcon from '@/assets/bot/base.png'
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
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const updateOpacities = () => {
      const containers = container.querySelectorAll('.chat-message-container')
      containers.forEach((el) => {
        const element = el as HTMLElement
        const messageTop = element.offsetTop - container.scrollTop
        const opacity = messageTop >= 100 ? 1 : Math.max(0, messageTop / 100)
        element.style.opacity = opacity.toString()
      })
    }

    updateOpacities()
    container.addEventListener('scroll', updateOpacities)
    return () => {
      container.removeEventListener('scroll', updateOpacities)
    }
  }, [])

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

  const actionSuggestions = useSelector((state: RootState) => selectChat(state).actionSuggestions)

  return (
    <>
      <div ref={ref} onFocus={handleFocus} >

        {/* Chat flow */}
        <div className={`h-screen overflow-hidden sticky top-0 right-0 transition-size duration-500 ${expanded ? 'max-w-[370px]' : 'max-w-0'} `}>

          <div className="h-full p-4 w-[370px]">
            {/* Handle */}
            <button
              onClick={toggleExpanded}
              className={`fixed top-1/2 right-0 rounded-md rounded-tr-none rounded-br-none -translate-y-1/2 z-50 h-[100px] w-[20px] bg-neutral-100 shadow-lg  border flex items-center justify-center transition-all duration-500 ${expanded ? 'opacity-50' : 'opacity-100 '}`}
            >
              <div className="grid grid-cols-2 grid-rows-8 gap-1">
                {Array.from({ length: 16 }).map((_, idx) => (
                  <div key={idx} className="w-1 h-1 bg-neutral-400 rounded-full"></div>
                ))}
              </div>
            </button>
            <div
              className={`relative rounded-lg flex flex-col h-full`}
            >
              <Button size="icon" variant="ghost" onClick={() => setExpanded(false)} className="absolute top-2 right-2 z-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
              <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
                {chatHistory.map((msg, index) => (
                  msg.sender === 'User' ? (
                    <div
                      key={index}
                      ref={index === chatHistory.length - 1 ? lastMessageRef : null}
                      className="flex items-start justify-end chat-message-container"
                    >
                      <div className="mb-2 py-2 px-4  rounded-lg text-sm chat-message outline-1 outline-neutral-600  text-neutral-600 text-left ml-14 relative">
                        {msg.text}
                      </div>

                    </div>
                  ) : (
                    <div
                      key={index}
                      ref={index === chatHistory.length - 1 ? lastMessageRef : null}
                      className="flex items-start justify-end chat-message-container"
                    >
                      <img src={minstrelIcon} className="size-10 mr-1" alt="" />
                      <div className="mb-2 py-2 px-4 rounded-lg text-sm chat-message bg-highlight-600 text-highlight-100 text-right mr-8 relative">
                        <div className="absolute left-0 top-2 -translate-x-full w-0 h-0 border-[6px] border-transparent border-r-highlight-200"></div>
                        {msg.text}
                      </div>
                    </div>
                  )
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
