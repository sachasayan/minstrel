import { useState, useRef, useEffect, useLayoutEffect, memo, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectChat, addChatMessage } from '@/lib/store/chatSlice'
import { RootState } from '@/lib/store/store'
import { Button } from '@/components/ui/button'
import minstrelIcon from '@/assets/bot/base.png'
import { ChatMessage } from '@/types'
import { streamingService } from '@/lib/services/streamingService'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const MAX_INPUT_LINES = 10
const DOCK_WIDTH = 390
const EMPTY_WIDTH = 480
const VIEWPORT_PADDING = 24
const DOCK_TARGET_SELECTOR = '[data-chat-dock-target="true"]'

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

const HEIGHT_TRANSITION = {
  duration: 0.2,
  ease: 'easeOut' as const,
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

const SmoothHeight = memo(({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const element = contentRef.current
    if (!element) return

    const updateHeight = () => {
      setHeight(element.getBoundingClientRect().height)
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [children])

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={HEIGHT_TRANSITION}
      className={cn('overflow-hidden', className)}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </motion.div>
  )
})

SmoothHeight.displayName = 'SmoothHeight'

const StreamingBubbleBody = memo(({ text }: { text: string }) => (
  <SmoothHeight>
    <StreamedMessageText text={text} />
  </SmoothHeight>
))

StreamingBubbleBody.displayName = 'StreamingBubbleBody'

const ChatMessageItem = memo(({ msg }: ChatMessageItemProps) => {
  return msg.sender === 'User' ? (
    <motion.div
      layout="position"
      transition={BUBBLE_LAYOUT_TRANSITION}
      className="flex items-start justify-end"
    >
      <motion.div
        className="chat-message mb-2 ml-16 max-w-[85%] rounded-[28px] border border-border/50 bg-card px-5 py-3 text-left text-sm font-medium text-card-foreground shadow-none"
      >
        {msg.text}
      </motion.div>
    </motion.div>
  ) : (
    <motion.div
      layout="position"
      transition={BUBBLE_LAYOUT_TRANSITION}
      className="flex items-start gap-2"
    >
      <img src={minstrelIcon} className="mt-1 size-10 shrink-0" alt="" />
      <motion.div
        className={`chat-message mb-2 mr-6 max-w-[85%] rounded-[28px] border border-highlight-200/70 bg-highlight-100 px-5 py-3 text-left text-sm text-highlight-900 shadow-none ${(msg as any).isStreaming ? 'opacity-90' : ''}`}
      >
        {(msg as any).isStreaming ? <StreamingBubbleBody text={msg.text} /> : msg.text}
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
  const [dockRect, setDockRect] = useState<DOMRect | null>(null)

  const isProjectEmpty = useMemo(() => {
    const hasStoryContent = !!activeProject?.storyContent && activeProject.storyContent.trim() !== ''
    const hasAncillaryFiles = !!activeProject?.files && activeProject.files.some(f => f.content && f.content.trim() !== '')
    return !hasStoryContent && !hasAncillaryFiles
  }, [activeProject?.storyContent, activeProject?.files])

  useEffect(() => {
    const unsubText = streamingService.subscribeToText(setStreamingText)
    const unsubStatus = streamingService.subscribeToStatus(setStreamingStatus)
    return () => {
      unsubText()
      unsubStatus()
    }
  }, [])

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

  useLayoutEffect(() => {
    let frameId = 0
    let observer: ResizeObserver | null = null

    const updateDockRect = () => {
      const target = document.querySelector(DOCK_TARGET_SELECTOR)
      if (!(target instanceof HTMLElement)) {
        setDockRect(null)
        return
      }

      setDockRect(target.getBoundingClientRect())
    }

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(updateDockRect)
    }

    scheduleUpdate()

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleUpdate)
      observer.observe(document.body)
    }

    const target = document.querySelector(DOCK_TARGET_SELECTOR)
    if (observer && target instanceof HTMLElement) {
      observer.observe(target)
    }

    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true)

    return () => {
      cancelAnimationFrame(frameId)
      observer?.disconnect()
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate, true)
    }
  }, [activeProject?.projectPath, isProjectEmpty])

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
  const visibleMessages = useMemo(() => {
    if (chatHistory.length === 0) return []

    const lastUserIndex = [...chatHistory].map((msg) => msg.sender).lastIndexOf('User')
    if (lastUserIndex === -1) return [chatHistory[chatHistory.length - 1]]

    const nextAgentMessage = [...chatHistory]
      .slice(lastUserIndex + 1)
      .reverse()
      .find((msg) => msg.sender !== 'User')

    if (nextAgentMessage) {
      return [chatHistory[lastUserIndex], nextAgentMessage]
    }

    const previousAgentIndex = chatHistory
      .slice(0, lastUserIndex)
      .map((msg) => msg.sender)
      .lastIndexOf('Gemini')

    if (previousAgentIndex !== -1) {
      return [chatHistory[previousAgentIndex], chatHistory[lastUserIndex]]
    }

    return [chatHistory[lastUserIndex]]
  }, [chatHistory])

  const viewportWidth = typeof window === 'undefined' ? DOCK_WIDTH + VIEWPORT_PADDING * 2 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 220 + VIEWPORT_PADDING * 2 : window.innerHeight
  const dockLeft = dockRect
    ? Math.min(dockRect.left, viewportWidth - DOCK_WIDTH - VIEWPORT_PADDING)
    : viewportWidth - DOCK_WIDTH - VIEWPORT_PADDING
  const dockTop = dockRect
    ? Math.max(dockRect.top, VIEWPORT_PADDING)
    : viewportHeight - 220 - VIEWPORT_PADDING

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <motion.div
        initial={false}
        animate={{
          width: isProjectEmpty ? EMPTY_WIDTH : DOCK_WIDTH,
          left: isProjectEmpty ? '50%' : dockLeft,
          top: isProjectEmpty ? '50%' : dockTop,
          x: isProjectEmpty ? '-50%' : 0,
          y: isProjectEmpty ? '-50%' : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 25,
          mass: 1
        }}
        className="pointer-events-auto fixed flex min-h-[220px] flex-col"
      >
        <motion.div className="flex-1 p-5">
          {visibleMessages.map((msg, index) => (
            <ChatMessageItem
              key={index}
              msg={msg}
            />
          ))}

          {streamingText && (
            <ChatMessageItem
              msg={{ sender: 'Gemini', text: streamingText, isStreaming: true }}
            />
          )}

          <AnimatePresence initial={false}>
            {actionSuggestions.length > 0 && (
              <motion.div
                key="suggestions"
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={HEIGHT_TRANSITION}
              >
                <SmoothHeight>
                  <div className="flex flex-wrap items-center">
                    {actionSuggestions.slice(0, 3).map((suggestion, index) => (
                      <motion.div
                        key={suggestion}
                        layout="position"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={HEIGHT_TRANSITION}
                        className="mr-2 my-2"
                      >
                        <Button
                          onClick={() => handleNextStage(suggestion)}
                          className="inline-block h-auto whitespace-normal bg-highlight-600 py-2 text-left text-highlight-100 transition-all hover:bg-highlight-500"
                        >
                          {suggestion}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </SmoothHeight>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {pendingChat && (
              <motion.div
                key="loading"
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={HEIGHT_TRANSITION}
              >
                <SmoothHeight>
                  <ChatLoadingIndicator status={streamingStatus} />
                </SmoothHeight>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <div className="flex items-end gap-2 px-3 py-3">
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
            className="min-h-11 max-h-none flex-1 resize-none rounded-[24px] border border-input bg-card px-4 py-3 text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
            disabled={pendingChat}
          />
          <button
            onClick={handleSend}
            className="shrink-0 rounded-full bg-highlight-700 px-4 py-3 text-sm text-primary-foreground transition-colors hover:bg-highlight-600 disabled:cursor-not-allowed disabled:opacity-60"
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
