import { useState, useRef, useEffect, forwardRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BotMessageSquare, ChevronDown } from 'lucide-react'
import { selectChat, addChatMessage } from '@/lib/utils/chatSlice'
import { RootState } from '@/lib/utils/store'
import { Button } from '@/components/ui/button'

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

const ChatInterface = forwardRef<HTMLDivElement, ChatInterfaceProps>(
  ({ expanded, setExpanded }, ref) => {
    const { chatHistory, pendingChat } = useSelector((state: RootState) => selectChat(state))
    const [message, setMessage] = useState('')
    const dispatch = useDispatch()
    const inputRef = useRef<HTMLInputElement>(null)
    let collapseTimeout: NodeJS.Timeout | null = null


    useEffect(() => {
      if (pendingChat) {
        setExpanded(true);
      }
    }, [pendingChat])

    useEffect(() => {
      if (expanded && inputRef.current) {
        inputRef.current.focus()
      }
    }, [expanded])

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

    const handleNextStage = () => {
      setExpanded(true)
      console.log('handleNextStage called') // Add this line
      dispatch(addChatMessage({ sender: 'User', text: `Let's build the outline based on our story skeleton.` }))
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

    const quickActions = ['Proceed to Outline', null, null]


    return (
      <div
        ref={ref}
        className={`fixed bottom-4 right-4 z-50 ${expanded ? 'w-80' : 'w-0'}`}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {quickActions[0] && (<div className={`absolute transition-all bottom-0 py-4 pl-1 duration-200 ${expanded ? 'right-0' : 'right-20'} `}>
          <Button onClick={handleNextStage} className="right-0 transition-all">Proceed to Outline</Button>

          {quickActions[1] && (<div className={`absolute transition-all bottom-0 py-4 pl-1 duration-400  ${expanded ? '-left-0' : '-left-full'}`}>
            <Button onClick={handleNextStage} className=" transition-all">Proceed to Outline</Button>

            {quickActions[2] && (<div className={`absolute transition-all bottom-0 py-4 pl-1 duration-600  ${expanded ? '-left-0' : '-left-full'}`}>
              <Button onClick={handleNextStage} className=" transition-all">Proceed to Outline</Button>
            </div>)}
          </div>)}
        </div>)}

        <button
          onClick={toggleExpanded}
          className={`z-2 bg-white shadow-lg rounded-lg border flex flex-col right-0 bottom-0 absolute overflow-hidden transition-[opacity, transform] duration-500 ${expanded ? 'opacity-0 scale-0' : 'opacity-100 scale-100'} `}
        >
          <BotMessageSquare
            className={
              'text-gray-500 hover:text-gray-700 hover:rotate-15 transition-transform size-8 m-4'
            }
          />
        </button>
        <div
          className={`z-1 bg-white shadow-lg rounded-lg border flex flex-col transition-[max-height,max-width, width, height] duration-500 ease-in-out right-0 bottom-0 absolute overflow-hidden ${expanded ? 'max-h-[500px] max-w-[320px] h-96 w-80' : 'max-h-10 max-w-10 h-10 w-10'
            }`}
        >
          <button
            onClick={toggleExpanded}
            className={
              'text-gray-500 hover:text-gray-700 transition-transform absolute top-2 right-2 m-4'
            }
          >
            <ChevronDown />
          </button>

          <div className="flex-1 overflow-y-auto p-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded-lg ${msg.sender === 'User' ? 'bg-black text-white text-right' : 'bg-gray-200 text-left'
                  }`}
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
            <button
              onClick={handleSend}
              className="bg-black text-white p-2 rounded-lg"
              disabled={pendingChat}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }
)

ChatInterface.displayName = 'ChatInterface'

export default ChatInterface
