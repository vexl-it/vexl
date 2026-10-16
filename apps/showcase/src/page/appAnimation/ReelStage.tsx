import {Typography, VexlTextGraphic} from '@vexl-next/ui'
import {Array, pipe, String} from 'effect'
import {useLayoutEffect, useRef, type ReactNode} from 'react'
import {PhoneFrame} from '../../demos/shared/PhoneFrame'
import {useScaleToWidth} from '../../demos/shared/useScaleToWidth'
import type {Framing, ReelColors} from './reelMotion'

// A third of a 1080×1920 reel, scaled to the stage's width.
const reelWidth = 360
const reelHeight = 640

/** The animated reel at one moment. */
export interface ReelMotionFrame {
  readonly framing: Framing
  readonly zoom: number
  readonly colors: ReelColors
  readonly previousColors: ReelColors
  /** Changes with every step and playback restart, replaying the wipe and the intro. */
  readonly stepKey: string
  readonly colorWipe: boolean
  readonly wordByWord: boolean
  readonly intro: boolean
  /** Set at the moment the phone pops in; a new value replays it. */
  readonly popKey: number | undefined
}

function Caption({
  caption,
  color,
  wordByWord,
}: {
  caption: string
  color: string
  wordByWord: boolean
}): React.JSX.Element {
  return (
    <div key={caption} className="reel-caption demo-arrive">
      <Typography variant="titles" color={color} textAlign="center">
        {wordByWord
          ? pipe(
              caption,
              String.split(' '),
              Array.map((word, index) => (
                <span
                  key={index}
                  className="reel-word"
                  style={{animationDelay: `${index * 90}ms`}}
                >
                  {`${word} `}
                </span>
              ))
            )
          : caption}
      </Typography>
    </div>
  )
}

function usePopIn(
  popKey: number | undefined
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  // Before paint, so the phone never flashes at full size first.
  useLayoutEffect(() => {
    if (popKey === undefined) return
    ref.current?.animate(
      [
        {scale: '0.55', opacity: 0},
        {scale: '1', opacity: 1},
      ],
      {duration: 750, easing: 'cubic-bezier(0.3, 1.45, 0.5, 1)'}
    )
  }, [popKey])
  return ref
}

const framingStyle = (framing: Framing, zoom: number): React.CSSProperties => {
  switch (framing) {
    case 'full':
      return {}
    case 'top':
      return {transformOrigin: '50% 0', transform: `scale(${zoom})`}
    case 'bottom':
      return {transformOrigin: '50% 100%', transform: `scale(${zoom})`}
    case 'tilt':
      return {
        transform:
          'perspective(1400px) rotateY(-16deg) rotateX(8deg) scale(0.94)',
      }
  }
}

/** The Vexl app tile bouncing in and away before the phone appears; black on light colors. */
function LogoIntro(): React.JSX.Element {
  return (
    <div className="reel-intro">
      <img className="reel-intro-tile" src="/vexl-app-icon.jpg" alt="" />
    </div>
  )
}

/**
 * The reel frame: logo and caption above the bare phone screen, then a logo end card. With
 * `motion`, steps change colors, captions appear word by word and a camera frames the screen.
 */
export function ReelStage({
  caption,
  ended,
  motion,
  children,
}: {
  caption: string
  ended: boolean
  motion?: ReelMotionFrame
  children: ReactNode
}): React.JSX.Element {
  const [ref, scale] = useScaleToWidth<HTMLDivElement>(reelWidth)
  const screenRef = usePopIn(motion?.popKey)
  const wipe = motion?.colorWipe === true
  return (
    <div
      ref={ref}
      className="reel"
      style={
        motion
          ? {
              background: wipe
                ? motion.previousColors.background
                : motion.colors.background,
            }
          : undefined
      }
    >
      {motion && wipe ? (
        <div
          key={motion.stepKey}
          className="reel-wipe"
          style={{background: motion.colors.background}}
        />
      ) : null}
      <div
        className={motion?.intro ? 'reel-canvas is-intro' : 'reel-canvas'}
        style={{
          width: reelWidth,
          height: reelHeight,
          transform: `scale(${scale})`,
        }}
      >
        <VexlTextGraphic
          variant={motion ? motion.colors.logo : 'dark'}
          width={68}
          height={21}
        />
        <Caption
          caption={caption}
          color={motion ? motion.colors.text : '$black100'}
          wordByWord={motion?.wordByWord ?? false}
        />
        <div className="reel-viewport">
          <div
            ref={screenRef}
            className="reel-screen"
            style={
              motion ? framingStyle(motion.framing, motion.zoom) : undefined
            }
          >
            <PhoneFrame bezel={false}>{children}</PhoneFrame>
          </div>
        </div>
        {motion?.intro ? <LogoIntro key={motion.stepKey} /> : null}
        {ended ? (
          <div className="reel-end">
            <div className={motion ? 'reel-end-logo' : undefined}>
              <VexlTextGraphic variant="dark" width={200} height={61} animate />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
