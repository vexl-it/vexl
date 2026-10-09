import {Array, Option, pipe} from 'effect'
import type {Demo} from '../shared/DemoPlayer'
import {PhoneScreens} from '../shared/PhoneScreens'
import {typedAt} from '../shared/playback'
import type {Side} from '../shared/side'
import {ChatScene, type ChatSceneState} from './ChatScene'
import {RevealScene, type RevealSceneState} from './RevealScene'
import {
  cues,
  screens,
  themTypeName,
  timelineTimes,
  youTypeName,
  type Cue,
} from './script'

type At = (cue: Cue) => boolean

function lastTap<Tap>(
  at: At,
  taps: ReadonlyArray<readonly [Cue, Tap]>
): Tap | undefined {
  return pipe(
    taps,
    Array.findLast(([cue]) => at(cue)),
    Option.map(([, tap]) => tap),
    Option.getOrUndefined
  )
}

interface PhoneState {
  readonly chat: ChatSceneState
  readonly reveal: RevealSceneState
}

function phoneStates(at: At, playhead: number): Record<Side, PhoneState> {
  const revealed = at('revealed')
  return {
    you: {
      chat: {
        revealed,
        request: at('youRequestSent') ? 'sent' : undefined,
        tap: at('youTapEye') ? 'eye' : undefined,
      },
      reveal: {
        mode: 'request',
        nicknameSelected: at('youTapNickname'),
        nickname: typedAt(youTypeName, playhead),
        photoSelected: at('youTapPhoto'),
        photoChosen: at('youPhotoChosen'),
        tap: lastTap(at, [
          ['youTapNickname', 'nickname'],
          ['youTapPhoto', 'photo'],
          ['youTapChoosePhoto', 'choosePhoto'],
          ['youTapSend', 'submit'],
        ]),
      },
    },
    them: {
      chat: {
        revealed,
        request: at('requestArrives') ? 'received' : undefined,
        tap: at('themTapReview') ? 'review' : undefined,
      },
      reveal: {
        mode: 'respond',
        nicknameSelected: true,
        nickname: typedAt(themTypeName, playhead),
        photoSelected: true,
        photoChosen: at('themPhotoChosen'),
        tap: lastTap(at, [
          ['themTapNickname', 'nicknameField'],
          ['themTapChoosePhoto', 'choosePhoto'],
          ['themTapAccept', 'submit'],
        ]),
      },
    },
  }
}

function phone(
  side: Side,
  state: PhoneState,
  playhead: number
): React.ReactNode {
  return (
    <PhoneScreens
      playhead={playhead}
      screens={screens[side]}
      render={(screen) =>
        screen === 'chat' ? (
          <ChatScene side={side} state={state.chat} />
        ) : (
          <RevealScene side={side} state={state.reveal} />
        )
      }
    />
  )
}

/** Both sides of an identity reveal. */
export const identityRevealDemo: Demo = {
  steps: [
    {
      title: 'Ask',
      text: 'Pick what to reveal: nickname, photo or phone number. Nothing is shared yet.',
      start: 0,
    },
    {
      title: 'Review',
      text: 'They see what you asked for and reveal the same details back, or say no, thanks.',
      start: cues.requestArrives,
    },
    {
      title: 'Revealed',
      text: 'Names and photos show up on both phones only once you both agree.',
      start: cues.revealed,
    },
  ],
  times: timelineTimes,
  end: cues.end,
  focus: [
    [0, 'you'],
    [cues.requestArrives, 'them'],
    [cues.revealed, 'you'],
  ],
  phones: (playhead) => {
    const states = phoneStates((cue) => playhead >= cues[cue], playhead)
    return {
      you: phone('you', states.you, playhead),
      them: phone('them', states.them, playhead),
    }
  },
}
