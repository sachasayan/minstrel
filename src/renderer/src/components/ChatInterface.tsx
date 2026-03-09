import { useState, useRef, useEffect, memo, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectChat, addChatMessage } from '@/lib/store/chatSlice'
import { RootState } from '@/lib/store/store'
import { Button } from '@/components/ui/button'
import minstrelIcon from '@/assets/bot/base.png'
import { ChatMessage } from '@/types'
import { streamingService } from '@/lib/services/streamingService'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const MAX_INPUT_LINES = 10

const ChatLoadingIndicator = ({ status }: { status: string }) => {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center p-2 text-xs italic text-muted-foreground">
      {status || 'Minstrel is thinking'}{dots}
    </div>
  )
}

interface ChatMessageItemProps {
  msg: ChatMessage | { sender: 'Gemini'; text: string; isStreaming?: boolean }
  isLast: boolean
  lastMessageRef: React.RefObject<HTMLDivElement | null>
}

const STREAM_WORD_TRANSITION = {
  duration: 0.14,
  ease: 'easeOut' as const,
}

const BUBBLE_LAYOUT_TRANSITION = {
  layout: {
    duration: 0.2,
    ease: 'easeOut' as const,
  },
}

const StreamedMessageText = memo(({ text }: { text: string }) => {
  const tokens = useMemo(() => text.split(/(\s+)/), [text])

  return (
    <>
      {tokens.map((token, index) =>
        /\s+/.test(token) ? (
          <span key={`space-${index}`}>{token}</span>
        ) : (
          <motion.span
            key={`${index}-${token}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={STREAM_WORD_TRANSITION}
          >
            {token}
          </motion.span>
        )
      )}
    </>
  )
})

StreamedMessageText.displayName = 'StreamedMessageText'

const ChatMessageItem = memo(({ msg, isLast, lastMessageRef }: ChatMessageItemProps) => {
  return msg.sender === 'User' ? (
    <motion.div
      layout
      transition={BUBBLE_LAYOUT_TRANSITION}
      ref={isLast ? lastMessageRef : null}
      className="flex items-start justify-end"
    >
      <motion.div
        layout
        transition={BUBBLE_LAYOUT_TRANSITION}
        className="chat-message relative mb-2 ml-14 rounded-lg border border-border bg-card px-4 py-2 text-left text-sm font-medium text-card-foreground shadow-sm"
      >
        {msg.text}
      </motion.div>
    </motion.div>
  ) : (
    <motion.div
      layout
      transition={BUBBLE_LAYOUT_TRANSITION}
      ref={isLast ? lastMessageRef : null}
      className="flex items-start"
    >
      <img src={minstrelIcon} className="size-10 mr-1" alt="" />
      <motion.div
        layout
        transition={BUBBLE_LAYOUT_TRANSITION}
        className={`chat-message relative mb-2 mr-8 rounded-lg bg-highlight-600 px-4 py-2 text-left text-sm text-highlight-100 shadow-sm ${(msg as any).isStreaming ? 'opacity-90' : ''}`}
      >
        <div className="absolute left-0 top-2 -translate-x-full w-0 h-0 border-[6px] border-transparent border-r-highlight-600"></div>
        {(msg as any).isStreaming ? <StreamedMessageText text={msg.text} /> : msg.text}
      </motion.div>
    </motion.div>
  )
})

ChatMessageItem.displayName = 'ChatMessageItem'

const ChatInterface = () => {
  const { chatHistory, pendingChat } = useSelector((state: RootState) => selectChat(state))
  const activeProject = useSelector(selectActiveProject)
  const [message, setMessage] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [streamingStatus, setStreamingStatus] = useState('')
  const dispatch = useDispatch()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement | null>(null)

  const isProjectEmpty = useMemo(() => {
    const hasStoryContent = !!activeProject?.storyContent && activeProject.storyContent.trim() !== ''
    const hasAncillaryFiles = !!activeProject?.files && activeProject.files.some(f => f.content && f.content.trim() !== '')
    return !hasStoryContent && !hasAncillaryFiles
  }, [activeProject?.storyContent, activeProject?.files])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    const unsubText = streamingService.subscribeToText(setStreamingText)
    const unsubStatus = streamingService.subscribeToStatus(setStreamingStatus)
    return () => {
      unsubText()
      unsubStatus()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, streamingText, streamingStatus])

  useEffect(() => {
    const textarea = inputRef.current
    if (!textarea) return

    textarea.style.height = 'auto'

    const computedStyle = window.getComputedStyle(textarea)
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 20
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0
    const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0
    const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0
    const maxHeight =
      lineHeight * MAX_INPUT_LINES + paddingTop + paddingBottom + borderTop + borderBottom

    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [message])

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
    <div className={cn(
      "fixed inset-0 pointer-events-none z-50 flex transition-all duration-500",
      isProjectEmpty ? "items-center justify-center" : "items-end justify-end p-6"
    )}>
      <motion.div
        layout
        initial={false}
        animate={{
          width: isProjectEmpty ? '450px' : '370px',
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 25,
          mass: 1
        }}
        className="pointer-events-auto flex h-[600px] flex-col overflow-hidden rounded-lg border border-border bg-background/95 shadow-2xl backdrop-blur-sm"
      >
        <motion.div layoutScroll className="flex-1 overflow-y-auto bg-muted/10 p-4" ref={chatContainerRef}>
          {chatHistory.map((msg, index) => (
            <ChatMessageItem
              key={index}
              msg={msg}
              isLast={index === chatHistory.length - 1 && !streamingText && !pendingChat}
              lastMessageRef={lastMessageRef as any}
            />
          ))}

          {streamingText && (
            <ChatMessageItem
              msg={{ sender: 'Gemini', text: streamingText, isStreaming: true }}
              isLast={!pendingChat || (pendingChat && !streamingStatus)}
              lastMessageRef={lastMessageRef as any}
            />
          )}

          {/* Suggestions */}
          <div className="flex flex-wrap items-center">
            {actionSuggestions.slice(0, 3).map((suggestion, index) => (
              <Button
                onClick={() => handleNextStage(suggestion)}
                key={index}
                className="mr-2 my-2 inline-block h-auto whitespace-normal bg-highlight-600 py-2 text-left text-highlight-100 transition-all hover:bg-highlight-500"
              >
                {suggestion}
              </Button>
            ))}
          </div>

          {pendingChat && (
            <motion.div
              layout
              transition={BUBBLE_LAYOUT_TRANSITION}
              ref={lastMessageRef as any}
            >
              <ChatLoadingIndicator status={streamingStatus} />
            </motion.div>
          )}
        </motion.div>
        <div className="flex items-end border-t border-border bg-background/90 p-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your message..."
            rows={1}
            className="mr-2 min-h-10 max-h-none flex-1 resize-none rounded-md border border-input bg-card px-4 py-2 text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
            disabled={pendingChat}
          />
          <button
            onClick={handleSend}
            className="shrink-0 rounded-lg bg-highlight-700 p-2 text-sm text-primary-foreground transition-colors hover:bg-highlight-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingChat}
          >
            Send
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ChatInterface
