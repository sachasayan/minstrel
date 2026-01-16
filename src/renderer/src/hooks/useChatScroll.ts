import { useEffect, RefObject } from 'react'

const useChatScroll = (lastMessageRef: RefObject<HTMLDivElement | null>, dependencies: any[]) => {
  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, dependencies)
}

export default useChatScroll
