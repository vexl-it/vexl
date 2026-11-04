'use client'

import {Typography} from '@vexl-next/ui'
import React, {useEffect, useRef, useState} from 'react'

const DIMMED_OPACITY = 0.35

/**
 * Headline whose words light up one after another while it scrolls past the
 * middle of the viewport.
 */
export function ScrollRevealText({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const words = children.split(' ')
  const [revealedWords, setRevealedWords] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealedWords(words.length)
      return
    }

    let frame: number | undefined
    const update = (): void => {
      frame = undefined
      const rect = element.getBoundingClientRect()
      const progress = (window.innerHeight / 2 - rect.top) / rect.height
      setRevealedWords(
        Math.round(Math.min(1, Math.max(0, progress)) * words.length)
      )
    }
    const onScroll = (): void => {
      frame ??= requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [words.length])

  return (
    <div ref={ref}>
      <Typography tag="h2" variant="display" color="$foregroundPrimary">
        {words.map((word, index) => (
          <span
            key={`${index}-${word}`}
            style={{
              opacity: index < revealedWords ? 1 : DIMMED_OPACITY,
              transition: 'opacity 0.3s',
            }}
          >
            {`${word} `}
          </span>
        ))}
      </Typography>
    </div>
  )
}
