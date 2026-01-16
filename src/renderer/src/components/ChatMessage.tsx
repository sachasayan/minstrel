import * as React from 'react'
import { ChatMessage as ChatMessageType } from '@/types' // Alias to avoid name collision

interface ChatMessageProps {
  msg: ChatMessageType
  isLastMessage: boolean
  lastMessageRef: React.RefObject<HTMLDivElement | null>
}

const ChatMessage: React.FC<ChatMessageProps> = ({ msg, isLastMessage, lastMessageRef }) => {
  return msg.sender === 'User' ? (
    <div
      key={msg.text} // Using text as key, assuming messages are unique enough for this context
      ref={isLastMessage ? lastMessageRef : null}
      className="flex items-start justify-end chat-message-container"
    >
      <div className="mb-2 py-2 px-4 rounded-lg text-sm chat-message outline-1 outline-neutral-600 text-neutral-600 text-left relative">
        {msg.text}
      </div>
    </div>
  ) : (
    <div
      key={msg.text} // Using text as key
      ref={isLastMessage ? lastMessageRef : null}
      className="flex items-start justify-end chat-message-container"
    >
      <div className="mb-2 py-2 px-4 rounded-lg text-sm chat-message bg-highlight-600 text-highlight-100 text-right relative">
        {msg.text}
      </div>
    </div>
  )
}

export default ChatMessage
