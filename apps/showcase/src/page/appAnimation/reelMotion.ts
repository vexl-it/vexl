import {tokens} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import type {
  ReelCamera,
  ReelColor,
  ReelMotion,
  StepId,
} from '../../demos/appAnimation/config'
import type {
  AppAnimationScript,
  AppAnimationStep,
} from '../../demos/appAnimation/script'
import {typingEnd} from '../../demos/shared/playback'

/** Which part of the screen the camera frames; zoomed framings push the rest out of view. */
export type Framing = Exclude<ReelCamera, 'auto'>

export interface ReelColors {
  readonly background: string
  readonly text: string
  readonly logo: 'dark' | 'light'
}

const {color} = tokens
const onLight = (background: string): ReelColors => ({
  background,
  text: color.black100.val,
  logo: 'dark',
})
const onDark = (background: string): ReelColors => ({
  background,
  text: color.white100.val,
  logo: 'light',
})

// Brand colors on purpose: the reel doesn't follow the app theme.
const palette: Record<ReelColor, ReelColors> = {
  yellow: onLight(color.yellow100.val),
  green: onLight(color.greenLight.val),
  pink: onLight(color.pinkLight.val),
  black: onDark(color.black100.val),
  darkGreen: onDark(color.greenDark.val),
  darkPink: onDark(color.pinkDark.val),
}

const stepIdOf = (step: AppAnimationStep | undefined): Option.Option<StepId> =>
  step === undefined || step.id === 'intro' || step.id === 'end'
    ? Option.none()
    : Option.some(step.id)

/** The intro shares the first screen's color, the end card is yellow, every other step has its own. */
export const reelColors = (
  motion: ReelMotion,
  step: AppAnimationStep | undefined
): ReelColors =>
  step?.id === 'intro'
    ? palette[motion.steps.welcome.color]
    : pipe(
        stepIdOf(step),
        Option.match({
          onNone: () => palette.yellow,
          onSome: (id) => palette[motion.steps[id].color],
        })
      )

/** Where the camera moves by itself: zoomed on what the viewer should read, back to full before screens change. */
function autoFraming(
  {cues, typing}: AppAnimationScript,
  playhead: number
): Framing {
  const keyframes: ReadonlyArray<readonly [number, Framing]> = [
    // The contacts import counting up in the bottom sheet.
    [cues.tapImportContacts, 'bottom'],
    [cues.marketplaceOpen, 'full'],
    // The typed offer description, who will see it and the encryption.
    [cues.networkDone, 'bottom'],
    [cues.published, 'full'],
    // The chosen offer and the typed request; the sent request and the approval read in full.
    [cues.detailOpen, 'top'],
    [typingEnd(typing.request), 'full'],
    // The conversation growing above the input.
    [cues.approved, 'bottom'],
    [cues.theirLetsMeetReply, 'full'],
    // The agreed time and place.
    [cues.checklistSent, 'bottom'],
    [cues.successOpen, 'tilt'],
    [cues.endOpen, 'full'],
  ]
  return pipe(
    keyframes,
    Array.findLast(([time]) => playhead >= time),
    Option.map(([, framing]) => framing),
    Option.getOrElse((): Framing => 'full')
  )
}

/** A step's picked framing holds for the whole step; `auto` follows the script. */
export const reelFraming = (
  script: AppAnimationScript,
  motion: ReelMotion,
  step: AppAnimationStep | undefined,
  playhead: number
): Framing =>
  pipe(
    stepIdOf(step),
    Option.map((id) => motion.steps[id].camera),
    Option.filter((camera): camera is Framing => camera !== 'auto'),
    Option.getOrElse(() => autoFraming(script, playhead))
  )
