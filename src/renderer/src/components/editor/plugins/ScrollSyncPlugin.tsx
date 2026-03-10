import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef } from 'react'
import { $getRoot } from 'lexical'
import { HeadingNode } from '@lexical/rich-text'
import { ActiveSection } from '@/types'
import { activeSectionKey, isArtifactSection, isOverviewSection, makeArtifactSection, makeChapterSection, makeOverviewSection } from '@/lib/activeSection'
import { $isChapterHeadingNode, ChapterHeadingNode } from '../nodes/ChapterHeadingNode'

interface ScrollSyncPluginProps {
    activeSection: ActiveSection
    onSectionChange: (section: ActiveSection) => void
    containerRef: React.RefObject<HTMLDivElement | null>
    instantInitialScroll?: boolean
}

export function ScrollSyncPlugin({
    activeSection,
    onSectionChange,
    containerRef,
    instantInitialScroll = false
}: ScrollSyncPluginProps): null {
    const [editor] = useLexicalComposerContext()
    const isProgrammaticScroll = useRef(false)
    const activeSectionRef = useRef(activeSection)
    const onSectionChangeRef = useRef(onSectionChange)
    const lastObserverSection = useRef<ActiveSection>(null)
    const observedSections = useRef(new Map<Element, ActiveSection>())
    const lastDispatchedSectionKey = useRef<string>('none')
    const lastDispatchAt = useRef(0)
    const hasHandledInitialScroll = useRef(false)

    const getScrollBehavior = () =>
        !hasHandledInitialScroll.current && instantInitialScroll ? 'auto' : 'smooth'

    const markInitialScrollHandled = () => {
        if (!hasHandledInitialScroll.current) {
            hasHandledInitialScroll.current = true
        }
    }

    useEffect(() => {
        activeSectionRef.current = activeSection
    }, [activeSection])

    useEffect(() => {
        onSectionChangeRef.current = onSectionChange
    }, [onSectionChange])

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

        if (isOverviewSection(activeSection)) {
            isProgrammaticScroll.current = true
            containerRef.current?.scrollTo({ top: 0, behavior: getScrollBehavior() })
            markInitialScrollHandled()
            setTimeout(() => (isProgrammaticScroll.current = false), 800)
            return
        }

        if (isArtifactSection(activeSection)) {
            const outlineElement = containerRef.current?.querySelector('[data-outline-target="true"]')
            if (outlineElement instanceof HTMLElement) {
                isProgrammaticScroll.current = true
                outlineElement.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' })
                markInitialScrollHandled()
                setTimeout(() => (isProgrammaticScroll.current = false), 800)
            }
            return
        }

        editor.getEditorState().read(() => {
            const root = $getRoot()
            const headingNodes = root
                .getChildren()
                .filter(
                    (node): node is ChapterHeadingNode =>
                        node instanceof HeadingNode &&
                        node.getTag() === 'h1' &&
                        $isChapterHeadingNode(node) &&
                        !!node.getChapterId()
                )

            const targetNode = headingNodes.find((node, index) =>
                node.getChapterId() === activeSection.chapterId || index === activeSection.index
            )

            if (targetNode) {
                const domElement = editor.getElementByKey(targetNode.getKey())
                if (domElement) {
                    isProgrammaticScroll.current = true
                    domElement.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' })
                    markInitialScrollHandled()
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

                const candidate = entries
                    .filter((entry) => entry.isIntersecting && entry.intersectionRatio > 0.1)
                    .map((entry) => {
                        const section = observedSections.current.get(entry.target)
                        if (!section || !entry.rootBounds) return null

                        return {
                            section,
                            sectionKey: activeSectionKey(section),
                            distanceFromTop: Math.abs(entry.boundingClientRect.top - entry.rootBounds.top)
                        }
                    })
                    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
                    .sort((a, b) => a.distanceFromTop - b.distanceFromTop)[0]

                if (!candidate) return

                const currentKey = activeSectionKey(activeSectionRef.current)
                if (candidate.sectionKey === currentKey) return

                const now = Date.now()
                if (
                    candidate.sectionKey === lastDispatchedSectionKey.current &&
                    now - lastDispatchAt.current < 150
                ) {
                    return
                }

                lastObserverSection.current = candidate.section
                lastDispatchedSectionKey.current = candidate.sectionKey
                lastDispatchAt.current = now
                onSectionChangeRef.current(candidate.section)
            },
            {
                root: scrollContainer,
                rootMargin: '-5% 0px -85% 0px', // Tight top margin to trigger when heading hits top
                threshold: [0, 0.1, 0.5]
            }
        )

        const updateObservation = () => {
            observer.disconnect()
            observedSections.current = new Map<Element, ActiveSection>()
            const overview = document.getElementById('overview-target')
            if (overview) {
                observedSections.current.set(overview, makeOverviewSection())
                observer.observe(overview)
            }

            const outline = containerRef.current?.querySelector('[data-outline-target="true"]')
            if (outline instanceof HTMLElement) {
                const section = makeArtifactSection('Outline')
                observedSections.current.set(outline, section)
                observer.observe(outline)
            }

            // Only observe headings INSIDE the editor
            editor.getEditorState().read(() => {
                const root = $getRoot()
                let chapterIndex = 0

                root.getChildren().forEach((node) => {
                    if (!(node instanceof HeadingNode) || node.getTag() !== 'h1' || !$isChapterHeadingNode(node)) {
                        return
                    }

                    const chapterId = node.getChapterId()
                    if (!chapterId) return

                    const domElement = editor.getElementByKey(node.getKey())
                    if (!domElement) return

                    const section = makeChapterSection(node.getTextContent().trim(), chapterIndex, chapterId)
                    observedSections.current.set(domElement, section)
                    observer.observe(domElement)
                    chapterIndex++
                })
            })
        }

        updateObservation()

        return editor.registerUpdateListener(() => {
            setTimeout(updateObservation, 200)
        })
    }, [editor, containerRef])

    return null
}
