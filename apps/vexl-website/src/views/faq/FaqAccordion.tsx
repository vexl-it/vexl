'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

// The live site's custom FAQ script: one card open at a time, a 0.3s height
// transition and the arrow turning 180deg.
const TRANSITION = 'all 0.3s ease'
const DURATION_MS = 300
// Lets the browser commit the start height before the transition target is set
const START_DELAY_MS = 10

const OpenCard = createContext<{
  readonly openId: string | null
  readonly toggle: (id: string) => void
}>({openId: null, toggle: () => {}})

export function FaqAccordion({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  const [openId, setOpenId] = useState<string | null>(null)
  const toggle = (id: string): void => {
    setOpenId((current) => (current === id ? null : id))
  }
  return (
    <OpenCard.Provider value={{openId, toggle}}>{children}</OpenCard.Provider>
  )
}

function useHeightTransition(
  isOpen: boolean
): React.RefObject<HTMLDivElement | null> {
  const answerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const answer = answerRef.current
    if (!answer) return
    if (isOpen) {
      const start = setTimeout(() => {
        answer.style.height = `${answer.scrollHeight}px`
      }, START_DELAY_MS)
      const end = setTimeout(() => {
        answer.style.height = 'auto'
        answer.style.overflow = 'visible'
      }, DURATION_MS)
      return () => {
        clearTimeout(start)
        clearTimeout(end)
      }
    }
    if (answer.style.height === '0px') return
    answer.style.height = `${answer.scrollHeight}px`
    const start = setTimeout(() => {
      answer.style.height = '0'
      answer.style.overflow = 'hidden'
    }, START_DELAY_MS)
    return () => {
      clearTimeout(start)
    }
  }, [isOpen])
  return answerRef
}

export function FaqCard({
  id,
  question,
  children,
}: {
  readonly id: string
  readonly question: React.ReactNode
  readonly children: React.ReactNode
}): React.JSX.Element {
  const {openId, toggle} = useContext(OpenCard)
  const isOpen = openId === id
  const answerRef = useHeightTransition(isOpen)
  return (
    <div className="faq-card w-variant-4d662988-9b32-76dc-2e51-d86a6e33126a">
      <div
        className="faq-question-wrapper"
        style={{cursor: 'pointer'}}
        onClick={() => {
          toggle(id)
        }}
      >
        <h3 className="faq-title w-variant-4d662988-9b32-76dc-2e51-d86a6e33126a">
          {question}
        </h3>
        <img
          loading="lazy"
          src="/wf/6a0bf3d22a73f552b0b26de3_chevron-2.svg"
          alt=""
          className="faq-arrow"
          style={{
            transition: TRANSITION,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>
      <div
        ref={answerRef}
        className="faq-answer-wrapper"
        style={{height: 0, overflow: 'hidden', transition: TRANSITION}}
      >
        {children}
      </div>
    </div>
  )
}
