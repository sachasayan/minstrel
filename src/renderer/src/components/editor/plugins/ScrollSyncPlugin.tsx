import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef } from 'react'
import { $getRoot } from 'lexical'
import { HeadingNode } from '@lexical/rich-text'
import { ActiveSection } from '@/types'
import { activeSectionKey, isChapterSection, isOverviewSection, makeChapterSection, makeOverviewSection } from '@/lib/activeSection'

interface ScrollSyncPluginProps {
    activeSection: ActiveSection
    onSectionChange: (section: ActiveSection) => void
    containerRef: React.RefObject<HTMLDivElement | null>
}

export function ScrollSyncPlugin({
    activeSection,
    onSectionChange,
    containerRef
}: ScrollSyncPluginProps): null {
    const [editor] = useLexicalComposerContext()
    const isProgrammaticScroll = useRef(false)
    const lastObserverSection = useRef<ActiveSection>(null)

    // 1. Handle External Scroll Requests (Story -> Editor)
    useEffect(() => {
        if (!activeSection) return

        // If the activeSection change was triggered by the observer itself,
        // don't perform a programmatic scroll (it would fight the user's manual scroll).
        if (lastObserverSection.current && activeSectionKey(activeSection) === activeSectionKey(lastObserverSection.current)) {
            lastObserverSection.current = null
            return
        }

        // Reset the observer tracker so that a future external change back to this
        // SAME section (e.g. clicking the same sidebar item) will still scroll.
        lastObserverSection.current = null

        // Programmatic scroll for Overview or any section that doesn't have an index
        if (isOverviewSection(activeSection) || !isChapterSection(activeSection)) {
            isProgrammaticScroll.current = true
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            setTimeout(() => (isProgrammaticScroll.current = false), 800)
            return
        }

        const index = activeSection.index

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
                    // Wait for scroll to finish before allowing observer to update sidebar
                    setTimeout(() => (isProgrammaticScroll.current = false), 800)
                }
            }
        })
    }, [activeSection, editor, containerRef])

    // 2. Handle Scroll Observation (Editor -> Story)
    useEffect(() => {
        const scrollContainer = containerRef.current
        if (!scrollContainer) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (isProgrammaticScroll.current) return

                entries.forEach((entry) => {
                    // Use a slightly higher threshold or rootMargin to be more precise
                    if (entry.isIntersecting && entry.intersectionRatio > 0.1) {

                        // Handle Overview target
                        if (entry.target.id === 'overview-target') {
                            if (!isOverviewSection(activeSection)) {
                                const section = makeOverviewSection()
                                lastObserverSection.current = section
                                onSectionChange(section)
                            }
                            return
                        }

                        // Find index of this heading ONLY within the editor's editable area
                        // This avoids counting the project title H1
                        const heading = entry.target as HTMLElement
                        const editorElement = containerRef.current?.querySelector('[contenteditable="true"]')
                        if (!editorElement?.contains(heading)) return

                        const allEditorHeadings = Array.from(editorElement.querySelectorAll('h1'))
                        const idx = allEditorHeadings.indexOf(heading as HTMLHeadingElement)

                        if (idx !== -1) {
                            const section = makeChapterSection(heading.innerText.trim(), idx)
                            // Only report indexed sections if we are in a monolithic or indexed view
                            // This prevents artifacts (which might have H1s) from triggering a jump to Story monolith
                            const isAlreadyMonolithic = isOverviewSection(activeSection) || isChapterSection(activeSection)

                            const isCurrentSection =
                                isChapterSection(activeSection) &&
                                isChapterSection(section) &&
                                activeSection.index === section.index &&
                                activeSection.title === section.title

                            if (!isCurrentSection && isAlreadyMonolithic) {
                                lastObserverSection.current = section
                                onSectionChange(section)
                            }
                        }
                    }
                })
            },
            {
                root: scrollContainer,
                rootMargin: '-5% 0px -85% 0px', // Tight top margin to trigger when heading hits top
                threshold: [0, 0.1, 0.5]
            }
        )

        const updateObservation = () => {
            observer.disconnect()
            const overview = document.getElementById('overview-target')
            if (overview) observer.observe(overview)

            // Only observe headings INSIDE the editor
            const editorElement = containerRef.current?.querySelector('[contenteditable="true"]')
            const headings = editorElement?.querySelectorAll('h1')
            headings?.forEach((h) => observer.observe(h))
        }

        updateObservation()

        return editor.registerUpdateListener(() => {
            setTimeout(updateObservation, 200)
        })
    }, [editor, activeSection, onSectionChange, containerRef])

    return null
}
