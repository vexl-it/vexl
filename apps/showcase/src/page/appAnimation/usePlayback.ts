import {Array, Option, pipe} from 'effect'
import {useCallback, useEffect, useRef, useState} from 'react'

/** `?at=<ms>` freezes the animation at that moment, for checking a single frame. */
const frozenAt = pipe(
  Option.fromNullable(new URLSearchParams(window.location.search).get('at')),
  Option.map(Number),
  Option.filter(Number.isFinite)
)

interface Run {
  readonly startAt: number
  readonly startedAt: number
  readonly count: number
}

const now = (): number => performance.now()

/**
 * Advances a playhead through `times` while `playing`, looping at `end` if asked. A retimed script
 * keeps playing from the current moment; `seek` restarts from `startAt` and bumps `seekCount`.
 */
export function usePlayback({
  times,
  end,
  playing,
  loop,
}: {
  times: readonly number[]
  end: number
  playing: boolean
  loop: boolean
}): {playhead: number; seekCount: number; seek: (startAt: number) => void} {
  const [run, setRun] = useState<Run>(() => ({
    startAt: Option.getOrElse(frozenAt, () => 0),
    startedAt: now(),
    count: 0,
  }))
  const [playhead, setPlayhead] = useState(run.startAt)
  const pausedMs = useRef(0)
  const pausedSince = useRef<number | undefined>(undefined)
  const seek = useCallback((startAt: number): void => {
    pausedMs.current = 0
    if (pausedSince.current !== undefined) pausedSince.current = now()
    setPlayhead(startAt)
    setRun((current) => ({startAt, startedAt: now(), count: current.count + 1}))
  }, [])

  useEffect(() => {
    if (Option.isSome(frozenAt)) return
    if (!playing) {
      pausedSince.current ??= now()
      return
    }
    if (pausedSince.current !== undefined) {
      pausedMs.current += now() - pausedSince.current
      pausedSince.current = undefined
    }
    const elapsed = run.startAt + now() - run.startedAt - pausedMs.current
    const timers = pipe(
      times,
      Array.filter((time) => time > elapsed && time < end),
      Array.map((time) =>
        setTimeout(() => {
          setPlayhead(time)
        }, time - elapsed)
      ),
      Array.appendAll(
        loop
          ? [
              setTimeout(() => {
                seek(0)
              }, end - elapsed),
            ]
          : []
      )
    )
    return () => {
      Array.forEach(timers, clearTimeout)
    }
  }, [times, end, run, playing, loop, seek])

  return {playhead, seekCount: run.count, seek}
}
