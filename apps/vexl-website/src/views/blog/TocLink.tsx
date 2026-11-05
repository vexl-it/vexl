'use client'

import React from 'react'

// The live table-of-contents script: scroll so the heading sits 80px below
// the top, over 900ms with an ease-out-quart curve, without touching the URL.
const OFFSET = 80
const DURATION = 900
const easeOutQuart = (t: number): number => 1 - (1 - t) ** 4

function scrollToHeading(id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  const start = window.scrollY
  const distance = target.getBoundingClientRect().top - OFFSET
  const restoreScrollBehavior = [document.documentElement, document.body].map(
    (root) => {
      const previous = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      return () => {
        root.style.scrollBehavior = previous
      }
    }
  )
  let startTime: number | undefined
  const step = (now: number): void => {
    startTime ??= now
    const elapsed = now - startTime
    window.scrollTo(
      0,
      start + distance * easeOutQuart(Math.min(elapsed / DURATION, 1))
    )
    if (elapsed < DURATION) requestAnimationFrame(step)
    else
      restoreScrollBehavior.forEach((restore) => {
        restore()
      })
  }
  requestAnimationFrame(step)
}

export function TocLink({
  id,
  indent,
  children,
}: {
  readonly id: string
  readonly indent: string
  readonly children: string
}): React.JSX.Element {
  return (
    <a
      href={`#${id}`}
      className="blog-toc-link"
      style={{display: 'block', paddingLeft: indent, marginTop: '4px'}}
      onClick={(event) => {
        event.preventDefault()
        scrollToHeading(id)
      }}
    >
      {children}
    </a>
  )
}
