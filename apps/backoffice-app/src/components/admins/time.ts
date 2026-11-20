import {Array, Option, pipe} from 'effect'
import {useEffect, useState} from 'react'

const UNITS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60_000],
  ['month', 30 * 24 * 60 * 60_000],
  ['day', 24 * 60 * 60_000],
  ['hour', 60 * 60_000],
  ['minute', 60_000],
]

const relativeFormat = new Intl.RelativeTimeFormat('en', {numeric: 'auto'})
/** "3 days ago", "last month", or "just now" within the last minute. */
export const formatRelative = (iso: string, now: number): string => {
  const elapsedMs = new Date(iso).getTime() - now
  return pipe(
    UNITS,
    Array.findFirst(([, unitMs]) => Math.abs(elapsedMs) >= unitMs),
    Option.match({
      onNone: () => 'just now',
      onSome: ([unit, unitMs]) =>
        relativeFormat.format(Math.trunc(elapsedMs / unitMs), unit),
    })
  )
}

/** `m:ss` until the given time, `0:00` once it has passed. */
export const formatCountdown = (remainingMs: number): string => {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** The current time, refreshed on the given interval. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, intervalMs)
    return () => {
      clearInterval(interval)
    }
  }, [intervalMs])

  return now
}
