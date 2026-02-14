import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef } from 'react'
import { $getRoot, LexicalNode } from 'lexical'
import { HeadingNode } from '@lexical/rich-text'

interface ScrollSyncPluginProps {
    activeSection: string | null
    onSectionChange: (section: string) => void
    containerRef: React.RefObject<HTMLDivElement | null>
}

export function ScrollSyncPlugin({
    activeSection,
    onSectionChange,
    containerRef
}: ScrollSyncPluginProps): null {
    const [editor] = useLexicalComposerContext()
    const isProgrammaticScroll = useRef(false)

    // 1. Handle External Scroll Requests (Story -> Editor)
    useEffect(() => {
        if (!activeSection) return

        if (activeSection === 'Overview') {
            isProgrammaticScroll.current = true
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            setTimeout(() => (isProgrammaticScroll.current = false), 1000)
            return
        }

        if (activeSection.includes('|||')) {
            const [_, indexStr] = activeSection.split('|||')
            const index = parseInt(indexStr)

            editor.getEditorState().read(() => {
                const root = $getRoot()
                const headingNodes = root
                    .getChildren()
                    .filter((node): node is HeadingNode => node instanceof HeadingNode && node.getTag() === 'h1')

                if (headingNodes[index]) {
                    const domElement = editor.getElementByKey(headingNodes[index].getKey())
                    if (domElement) {
                        isProgrammaticScroll.current = true
                        domElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        setTimeout(() => (isProgrammaticScroll.current = false), 1000)
                    }
                }
            })
        }
    }, [activeSection, editor, containerRef])

    // 2. Handle Scroll Observation (Editor -> Story)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (isProgrammaticScroll.current) return

                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        // Handle Overview target specifically if it's passed in or found
                        if (entry.target.id === 'overview-target') {
                            if (activeSection !== 'Overview') {
                                onSectionChange('Overview')
                            }
                            return
                        }

                        // Find index of this heading
                        const heading = entry.target as HTMLElement
                        const allHeadings = Array.from(containerRef.current?.querySelectorAll('h1') || [])
                        const idx = allHeadings.indexOf(heading)
                        if (idx !== -1) {
                            const section = `${heading.innerText.trim()}|||${idx}`
                            if (activeSection !== section) {
                                onSectionChange(section)
                            }
                        }
                    }
                })
            },
            {
                root: null,
                rootMargin: '-10% 0px -70% 0px',
                threshold: [0, 0.5, 1]
            }
        )

        const updateObservation = () => {
            observer.disconnect()
            const overview = document.getElementById('overview-target')
            if (overview) observer.observe(overview)

            const headings = containerRef.current?.querySelectorAll('h1')
            headings?.forEach((h) => observer.observe(h))
        }

        // Initial and on update
        updateObservation()

        // Lexical update listener to re-observe if headings change
        return editor.registerUpdateListener(() => {
            // Debounce slightly if needed, but headlines don't change THAT often
            setTimeout(updateObservation, 100)
        })
    }, [editor, activeSection, onSectionChange, containerRef])

    return null
}
