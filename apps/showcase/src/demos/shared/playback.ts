import {Array, Order, pipe} from 'effect'
import {useEffect, useRef, useState} from 'react'

export const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

/**
 * Ms since the demo start, starting at `startAt` and advancing through the later `times`.
 * With reduced motion it stays at `startAt`.
 */
export function usePlayhead(times: readonly number[], startAt: number): number {
  const [playhead, setPlayhead] = useState(startAt)
  useEffect(() => {
    if (reducedMotion) return
    const timers = pipe(
      times,
      Array.filter((time) => time > startAt),
      Array.map((time) =>
        setTimeout(() => {
          setPlayhead(time)
        }, time - startAt)
      )
    )
    return () => {
      Array.forEach(timers, clearTimeout)
    }
  }, [times, startAt])
  return playhead
}

export const sortedTimes = (
  ...groups: ReadonlyArray<readonly number[]>
): readonly number[] =>
  pipe(groups, Array.flatten, Array.dedupe, Array.sort(Order.number))

const defaultKeystrokeMs = 110

export interface Typing {
  readonly text: string
  readonly start: number
  readonly keystrokeMs?: number
}

const keystrokeMsOf = (typing: Typing): number =>
  typing.keystrokeMs ?? defaultKeystrokeMs

export const typingEnd = (typing: Typing): number =>
  typing.start + typing.text.length * keystrokeMsOf(typing)

export const keystrokeTimes = (typing: Typing): number[] =>
  Array.makeBy(
    typing.text.length,
    (index) => typing.start + (index + 1) * keystrokeMsOf(typing)
  )

export const typedAt = (typing: Typing, playhead: number): string =>
  typing.text.slice(
    0,
    Math.max(0, Math.floor((playhead - typing.start) / keystrokeMsOf(typing)))
  )

/** Whether the element reaches into the middle half of the viewport. */
export function useInView<T extends Element>(): {
  ref: React.RefObject<T | null>
  inView: boolean
} {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry?.isIntersecting ?? false)
      },
      {rootMargin: '-25% 0px'}
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])
  return {ref, inView}
}
