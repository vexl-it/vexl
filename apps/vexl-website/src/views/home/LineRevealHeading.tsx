'use client'

import {Array, pipe} from 'effect'
import {gsap} from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import React, {useEffect, useRef} from 'react'
import SplitType from 'split-type'

/** Splits the heading into lines and uncovers each one as it scrolls past the viewport center. */
function splitAndAnimate(heading: HTMLElement): () => void {
  const split = new SplitType(heading, {types: 'lines,words'})
  const timelines = pipe(
    split.lines ?? [],
    Array.map((line) => {
      const mask = document.createElement('div')
      mask.className = 'line-mask'
      line.append(mask)
      return gsap
        .timeline({
          scrollTrigger: {
            trigger: line,
            start: 'top center',
            end: 'bottom center',
            scrub: 1,
          },
        })
        .to(mask, {width: '0%', duration: 1})
    })
  )
  return () => {
    Array.forEach(timelines, (timeline) => {
      timeline.scrollTrigger?.kill()
      timeline.kill()
    })
    split.revert()
  }
}

export function LineRevealHeading({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const heading = headingRef.current
    if (!heading) return
    gsap.registerPlugin(ScrollTrigger)

    let revert: (() => void) | undefined
    let width = document.documentElement.clientWidth
    let isMounted = true

    // Lines depend on the web font's metrics
    void document.fonts.ready.then(() => {
      if (isMounted) revert = splitAndAnimate(heading)
    })

    const onResize = (): void => {
      if (!revert || width === document.documentElement.clientWidth) return
      width = document.documentElement.clientWidth
      revert()
      revert = splitAndAnimate(heading)
    }
    window.addEventListener('resize', onResize)

    return () => {
      isMounted = false
      window.removeEventListener('resize', onResize)
      revert?.()
    }
  }, [])

  return (
    <h2 ref={headingRef} className="h2 split-type">
      {children}
    </h2>
  )
}
