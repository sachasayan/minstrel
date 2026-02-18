import { useState, useRef, useEffect, memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectChat, addChatMessage } from '@/lib/store/chatSlice'
import { RootState } from '@/lib/store/store'
import { Button } from '@/components/ui/button'
import minstrelIcon from '@/assets/bot/base.png'
import { ChatMessage } from '@/types'

const ChatLoadingIndicator = () => {
  return (
    <div className="flex items-center justify-center p-2">
      <div className="animate-ping h-2 w-2 bg-neutral-400 rounded-full mx-1"></div>
      <div className="animate-ping h-2 w-2 bg-neutral-400 rounded-full mx-1 delay-75"></div>
      <div className="animate-ping h-2 w-2 bg-neutral-400 rounded-full mx-1 delay-150"></div>
    </div>
  )
}

interface ChatMessageItemProps {
  msg: ChatMessage
  isLast: boolean
  lastMessageRef: React.RefObject<HTMLDivElement | null>
}

const ChatMessageItem = memo(({ msg, isLast, lastMessageRef }: ChatMessageItemProps) => {
  return msg.sender === 'User' ? (
    <div
      ref={isLast ? lastMessageRef : null}
      className="flex items-start justify-end"
    >
      <div className="mb-2 py-2 px-4 rounded-lg text-sm chat-message outline-1 outline-neutral-600 text-neutral-600 text-left ml-14 relative">
        {msg.text}
      </div>
    </div>
  ) : (
    <div
      ref={isLast ? lastMessageRef : null}
      className="flex items-start justify-end"
    >
      <img src={minstrelIcon} className="size-10 mr-1" alt="" />
      <div className="mb-2 py-2 px-4 rounded-lg text-sm chat-message bg-highlight-600 text-highlight-100 text-right mr-8 relative">
        <div className="absolute left-0 top-2 -translate-x-full w-0 h-0 border-[6px] border-transparent border-r-highlight-200"></div>
        {msg.text}
      </div>
    </div>
  )
})

ChatMessageItem.displayName = 'ChatMessageItem'

const ChatInterface = () => {
  const { chatHistory, pendingChat } = useSelector((state: RootState) => selectChat(state))
  const [message, setMessage] = useState('')
  const dispatch = useDispatch()
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const handleSend = () => {
    if (message.trim() !== '') {
      dispatch(addChatMessage({ sender: 'User', text: message }))
      setMessage('')
    }
  }

  const handleNextStage = (action: string) => {
    dispatch(addChatMessage({ sender: 'User', text: action }))
  }

  const actionSuggestions = useSelector((state: RootState) => selectChat(state).actionSuggestions)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <div className="w-[370px] h-[600px] max-h-[80vh] bg-background border rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
          {chatHistory.map((msg, index) => (
            <ChatMessageItem
              key={index}
              msg={msg}
              isLast={index === chatHistory.length - 1}
              lastMessageRef={lastMessageRef}
            />
          ))}

          {/* Suggestions */}
          {actionSuggestions.slice(0, 3).map((suggestion, index) => (
            <Button onClick={() => handleNextStage(suggestion)} key={index} className="transition-all mr-2 my-2 inline-block bg-highlight-600">
              {suggestion}
            </Button>
          ))}

          {pendingChat && <ChatLoadingIndicator />}
        </div>
        <div className="border-t p-2 flex items-center bg-background">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 border rounded-md px-4 p-2 mr-2 outline-hidden text-sm"
            disabled={pendingChat}
          />
          <button onClick={handleSend} className="bg-highlight-700 text-white p-2 rounded-lg shrink-0 text-sm" disabled={pendingChat}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
