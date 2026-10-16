import {
  Button,
  SegmentedPicker,
  Theme,
  Typography,
  VexlTextGraphic,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useMemo, useRef, useState, type ReactNode} from 'react'
import {AppAnimationScreens} from '../../demos/appAnimation/AppAnimationScreens'
import type {Appearance, StepId} from '../../demos/appAnimation/config'
import {
  buildScript,
  type AppAnimationStep,
} from '../../demos/appAnimation/script'
import '../../demos/shared/demo.css'
import {PhoneFrame} from '../../demos/shared/PhoneFrame'
import './appAnimation.css'
import {
  canRecordTab,
  captureCurrentTab,
  download,
  recordElement,
  type VideoFormat,
} from './recordElement'
import {ReelStage} from './ReelStage'
import {SettingsPanel} from './SettingsPanel'
import {usePlayback} from './usePlayback'
import {useStoredConfig} from './useStoredConfig'

type Variant = 'reel' | 'screen'
type View = Variant | 'phone'

const formats: Record<Variant, VideoFormat> = {
  reel: {width: 1080, height: 1920},
  screen: {width: 1080, height: 2338},
}

const downloadNames: Record<Variant, string> = {
  reel: 'vexl-app-animation-reel',
  screen: 'vexl-app-animation-screen',
}

type Recording =
  | {
      readonly variant: Variant
      readonly phase: 'ready'
      readonly error?: string
    }
  | {readonly variant: Variant; readonly phase: 'recording'}

const formatSeconds = (ms: number): string => `${Math.round(ms / 1000)} s`

function StepList({
  steps,
  end,
  active,
  onSeek,
}: {
  steps: readonly AppAnimationStep[]
  end: number
  active: AppAnimationStep | undefined
  onSeek: (start: number) => void
}): React.JSX.Element {
  return (
    <ol className="demo-steps">
      {pipe(
        steps,
        Array.map((step, index) => {
          const isActive = step === active
          const duration = (steps[index + 1]?.start ?? end) - step.start
          return (
            <li key={step.id}>
              <button
                type="button"
                className={
                  isActive
                    ? 'demo-step anim-step is-active'
                    : 'demo-step anim-step'
                }
                aria-current={isActive ? 'step' : undefined}
                onClick={() => {
                  onSeek(step.start)
                }}
              >
                <Typography variant="tabSmallBold" color="$accentYellowPrimary">
                  {String(index + 1).padStart(2, '0')}
                </Typography>
                <Typography
                  variant="paragraphSmallBold"
                  color="$foregroundPrimary"
                >
                  {step.caption || 'Vexl'}
                </Typography>
                {isActive ? (
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

/** The page stays dark; only the phone takes the app theme picked in the settings. */
function Stage({
  view,
  appearance,
  caption,
  ended,
  children,
}: {
  view: View
  appearance: Appearance
  caption: string
  ended: boolean
  children: ReactNode
}): React.JSX.Element {
  return (
    <Theme name={appearance}>
      {view === 'reel' ? (
        <ReelStage caption={caption} ended={ended}>
          {children}
        </ReelStage>
      ) : (
        <PhoneFrame bezel={view === 'phone'}>{children}</PhoneFrame>
      )}
    </Theme>
  )
}

function RecordingPanel({
  recording,
  progress,
  duration,
  onStart,
  onCancel,
}: {
  recording: Recording
  progress: string
  duration: string
  onStart: () => void
  onCancel: () => void
}): React.JSX.Element {
  return (
    <YStack gap="$4" className="anim-recording-panel">
      {recording.phase === 'ready' ? (
        <>
          <Typography variant="titlesSmall" color="$foregroundPrimary">
            Ready to record
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {`When the browser asks, share this tab. The animation plays once (${duration}) and the video downloads when it ends. Keep this tab open meanwhile.`}
          </Typography>
          {recording.error ? (
            <Typography variant="description" color="$redForeground">
              {recording.error}
            </Typography>
          ) : null}
          <Button variant="primary" size="small" onPress={onStart}>
            Start recording
          </Button>
          <Button variant="secondary" size="small" onPress={onCancel}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Typography variant="titlesSmall" color="$foregroundPrimary">
            Recording…
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {progress}
          </Typography>
        </>
      )}
    </YStack>
  )
}

export function AppAnimationPage(): React.JSX.Element {
  const [config, setConfig, resetConfig] = useStoredConfig()
  const script = useMemo(() => buildScript(config), [config])
  const [view, setView] = useState<'phone' | 'reel'>('phone')
  const [recording, setRecording] = useState<Option.Option<Recording>>(
    Option.none()
  )
  const isRecording = Option.isSome(recording)
  const [playing, setPlaying] = useState(true)
  // While a setting is focused, the animation holds at the end of its step.
  const [heldStep, setHeldStep] = useState<Option.Option<StepId>>(Option.none())
  const heldAt = Option.flatMap(heldStep, (id) =>
    pipe(
      Array.findFirst(script.steps, (step) => step.id === id),
      Option.map(({hold}) => hold)
    )
  )
  const playback = usePlayback({
    times: script.times,
    end: script.end,
    playing: playing && Option.isNone(heldAt),
    loop: !isRecording,
  })
  const {seekCount, seek} = playback
  const playhead = Option.getOrElse(heldAt, () => playback.playhead)
  const recordedRef = useRef<HTMLDivElement>(null)

  const active = Option.getOrUndefined(
    Array.findLast(script.steps, (step) => playhead >= step.start)
  )
  const releaseHeldStep = (): void => {
    if (Option.isSome(heldAt)) seek(heldAt.value)
    setHeldStep(Option.none())
  }

  const screens = (
    <AppAnimationScreens
      key={seekCount}
      config={config}
      script={script}
      playhead={playhead}
    />
  )
  const stage = (stageView: View): React.JSX.Element => (
    <Stage
      view={stageView}
      appearance={config.appearance}
      caption={active?.caption ?? ''}
      ended={active?.id === 'end'}
    >
      {screens}
    </Stage>
  )

  const prepareRecording = (variant: Variant): void => {
    void document.documentElement.requestFullscreen().catch(() => undefined)
    setPlaying(false)
    seek(0)
    setRecording(Option.some({variant, phase: 'ready'}))
  }

  const finishRecording = (): void => {
    if (document.fullscreenElement) void document.exitFullscreen()
    setRecording(Option.none())
    setPlaying(true)
    seek(0)
  }

  const startRecording = async (variant: Variant): Promise<void> => {
    const element = recordedRef.current
    if (!element) return
    try {
      const tab = await captureCurrentTab()
      setRecording(Option.some({variant, phase: 'recording'}))
      const video = await recordElement({
        tab,
        element,
        format: formats[variant],
        play: () =>
          new Promise((resolve) => {
            seek(0)
            setPlaying(true)
            setTimeout(resolve, script.end)
          }),
      })
      download(video, downloadNames[variant])
      finishRecording()
    } catch (error) {
      setRecording(
        Option.some({
          variant,
          phase: 'ready',
          error:
            error instanceof Error && error.name === 'NotAllowedError'
              ? 'Sharing the tab was cancelled.'
              : 'Recording failed. Use a recent Chrome or Edge.',
        })
      )
    }
  }

  return (
    <YStack backgroundColor="$backgroundPrimary" minHeight="100vh">
      <header className="page-header page-width">
        <VexlTextGraphic variant="light" />
        <Typography
          variant="micro"
          color="$accentYellowPrimary"
          textTransform="uppercase"
        >
          App animation
        </Typography>
      </header>
      <main className="page-width anim-page">
        <section className="anim-intro">
          <h1 className="page-title">
            <Typography variant="heading2" color="$foregroundPrimary">
              From sign-up to a meetup
            </Typography>
          </h1>
          <Typography variant="paragraph" color="$foregroundSecondary">
            One phone going through the whole Vexl flow, built from the real app
            components. Edit what it shows below: the animation updates as you
            type. Download it as a ready reel or as a bare screen recording.
          </Typography>
        </section>
        <section className="anim-player" aria-label="Animation">
          <div className="anim-stage" data-view={view}>
            {isRecording ? null : stage(view)}
          </div>
          <YStack gap="$6" className="anim-side">
            <SegmentedPicker
              tabs={[
                {label: 'Phone', value: 'phone'},
                {label: 'Reel', value: 'reel'},
              ]}
              activeTab={view}
              onTabPress={setView}
            />
            <SegmentedPicker<Appearance>
              tabs={[
                {label: 'Light', value: 'light'},
                {label: 'Dark', value: 'dark'},
              ]}
              activeTab={config.appearance}
              onTabPress={(appearance) => {
                setConfig({...config, appearance})
              }}
            />
            <StepList
              steps={script.steps}
              end={script.end}
              active={active}
              onSeek={seek}
            />
            <XStack gap="$3" flexWrap="wrap">
              <Button
                variant="secondary"
                size="small"
                onPress={() => {
                  seek(0)
                }}
              >
                Replay
              </Button>
            </XStack>
            <YStack gap="$3" className="anim-downloads">
              <Typography
                variant="paragraphSmallBold"
                color="$foregroundPrimary"
              >
                Download mp4
              </Typography>
              <XStack gap="$3" flexWrap="wrap">
                <Button
                  variant="primary"
                  size="small"
                  disabled={!canRecordTab}
                  onPress={() => {
                    prepareRecording('reel')
                  }}
                >
                  Reel 1080×1920
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  disabled={!canRecordTab}
                  onPress={() => {
                    prepareRecording('screen')
                  }}
                >
                  Screen only
                </Button>
              </XStack>
              <Typography variant="description" color="$foregroundSecondary">
                {canRecordTab
                  ? `Records the animation in real time (${formatSeconds(script.end)}) by sharing this tab. Works in Chrome and Edge.`
                  : 'Recording needs a recent Chrome or Edge on a computer.'}
              </Typography>
            </YStack>
          </YStack>
        </section>
        <div
          onBlur={(event) => {
            if (
              !(event.relatedTarget instanceof Node) ||
              !event.currentTarget.contains(event.relatedTarget)
            ) {
              releaseHeldStep()
            }
          }}
        >
          <SettingsPanel
            config={config}
            onChange={setConfig}
            onFocusStep={(id) => {
              setHeldStep(Option.some(id))
            }}
            onReset={resetConfig}
          />
        </div>
      </main>
      {Option.isSome(recording) ? (
        <div className="anim-recording" data-variant={recording.value.variant}>
          <RecordingPanel
            recording={recording.value}
            progress={`${formatSeconds(playhead)} / ${formatSeconds(script.end)}`}
            duration={formatSeconds(script.end)}
            onStart={() => {
              void startRecording(recording.value.variant)
            }}
            onCancel={finishRecording}
          />
          <div ref={recordedRef} className="anim-recording-stage">
            {stage(recording.value.variant)}
          </div>
        </div>
      ) : null}
    </YStack>
  )
}
