import {Button, Typography, YStack} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useEffect, useState, type ReactNode} from 'react'
import './demo.css'
import {PhoneFrame} from './PhoneFrame'
import {reducedMotion, useInView, usePlayhead} from './playback'
import type {Side} from './side'

export interface DemoStep {
  readonly title: string
  readonly text: string
  readonly start: number
}

export interface Demo {
  readonly steps: Array.NonEmptyReadonlyArray<DemoStep>
  /** Every moment the screens change, in ms after the start. */
  readonly times: readonly number[]
  readonly end: number
  /** From which moment which phone is shown on narrow screens. */
  readonly focus: ReadonlyArray<readonly [number, Side]>
  readonly phones: (playhead: number) => Record<Side, ReactNode>
  /** Drawn around and behind each phone, outside its screen. */
  readonly halos?: (playhead: number) => Partial<Record<Side, ReactNode>>
}

const lastStarted = <T,>(
  items: readonly T[],
  start: (item: T) => number,
  playhead: number
): Option.Option<T> => Array.findLast(items, (item) => playhead >= start(item))

function Phone({
  side,
  halo,
  children,
}: {
  side: Side
  halo: ReactNode
  children: ReactNode
}): React.JSX.Element {
  return (
    <figure className="demo-phone" data-side={side}>
      <Typography variant="paragraphDemibold" color="$foregroundSecondary">
        {side === 'you' ? 'You' : 'Them'}
      </Typography>
      <div className="demo-phone-device">
        {halo}
        <PhoneFrame>{children}</PhoneFrame>
      </div>
    </figure>
  )
}

function StepList({
  demo: {steps, end},
  active,
  onSeek,
}: {
  demo: Demo
  active: DemoStep
  onSeek: (startAt: number) => void
}): React.JSX.Element {
  return (
    <ol className="demo-steps">
      {pipe(
        steps,
        Array.map((step, index) => {
          const isActive = step === active
          const duration = (steps[index + 1]?.start ?? end) - step.start
          return (
            <li key={step.title}>
              <button
                type="button"
                className={isActive ? 'demo-step is-active' : 'demo-step'}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => {
                  onSeek(step.start)
                }}
              >
                <Typography variant="tabSmallBold" color="$accentYellowPrimary">
                  {String(index + 1).padStart(2, '0')}
                </Typography>
                <YStack gap="$2" flex={1}>
                  <Typography variant="titlesSmall" color="$foregroundPrimary">
                    {step.title}
                  </Typography>
                  <Typography
                    variant="paragraphSmall"
                    color="$foregroundSecondary"
                    className="demo-step-text"
                  >
                    {step.text}
                  </Typography>
                </YStack>
                {isActive && !reducedMotion ? (
                  <span
                    className="demo-step-progress"
                    style={{animationDuration: `${duration}ms`}}
                  />
                ) : null}
              </button>
            </li>
          )
        })
      )}
    </ol>
  )
}

function Timeline({
  demo,
  startAt,
  onSeek,
}: {
  demo: Demo
  startAt: number
  onSeek: (startAt: number) => void
}): React.JSX.Element {
  const playhead = usePlayhead(demo.times, startAt)
  const active = pipe(
    lastStarted(demo.steps, (step) => step.start, playhead),
    Option.getOrElse(() => demo.steps[0])
  )
  const focus = pipe(
    lastStarted(demo.focus, ([start]) => start, playhead),
    Option.map(([, side]) => side),
    Option.getOrElse((): Side => 'you')
  )
  const phones = demo.phones(playhead)
  const halos = demo.halos?.(playhead)
  return (
    <div className="demo-body" data-focus={focus}>
      <div className="demo-phones">
        <Phone side="you" halo={halos?.you}>
          {phones.you}
        </Phone>
        <Phone side="them" halo={halos?.them}>
          {phones.them}
        </Phone>
      </div>
      <YStack gap="$6" className="demo-captions">
        <StepList demo={demo} active={active} onSeek={onSeek} />
        {reducedMotion ? null : (
          <Button
            variant="secondary"
            size="small"
            alignSelf="flex-start"
            onPress={() => {
              onSeek(0)
            }}
          >
            Replay
          </Button>
        )}
      </YStack>
    </div>
  )
}

// With reduced motion the demo shows still frames: the end, or the step picked.
const firstFrame = (demo: Demo): number => (reducedMotion ? demo.end : 0)

/** Both phones of a scripted demo, replayed whenever it scrolls into view. Steps are seekable. */
export function DemoPlayer({demo}: {demo: Demo}): React.JSX.Element {
  const {ref, inView} = useInView<HTMLDivElement>()
  const [run, setRun] = useState({inView, count: 0, startAt: firstFrame(demo)})
  if (run.inView !== inView) {
    setRun(
      inView
        ? {inView, count: run.count + 1, startAt: firstFrame(demo)}
        : {...run, inView}
    )
  }
  const playFrom = (startAt: number): void => {
    setRun((current) => ({...current, count: current.count + 1, startAt}))
  }
  useEffect(() => {
    if (!inView || reducedMotion) return
    const timer = setTimeout(() => {
      playFrom(0)
    }, demo.end - run.startAt)
    return () => {
      clearTimeout(timer)
    }
  }, [demo.end, inView, run])
  return (
    <div ref={ref} className="demo">
      <Timeline
        key={run.count}
        demo={demo}
        startAt={run.startAt}
        onSeek={playFrom}
      />
    </div>
  )
}
