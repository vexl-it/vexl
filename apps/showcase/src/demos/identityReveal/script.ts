import {Record} from 'effect'
import {screenTimes, type PhoneScreen} from '../shared/PhoneScreens'
import {
  keystrokeTimes,
  sortedTimes,
  typingEnd,
  type Typing,
} from '../shared/playback'
import type {Side} from '../shared/side'

export interface Person {
  readonly name: string
  readonly anonymizedPhone: string
  readonly phone: string
  readonly photo: string
}

// Fictional people: the phone numbers are in a range no Czech operator assigns.
export const people: Record<Side, Person> = {
  you: {
    name: 'Martin',
    anonymizedPhone: '+420 ****** 456',
    phone: '+420 600 123 456',
    photo: '/portrait-you.svg',
  },
  them: {
    name: 'Lucie',
    anonymizedPhone: '+420 ****** 321',
    phone: '+420 600 654 321',
    photo: '/portrait-them.svg',
  },
}

/** The anonymous chat both phones start with, written from your side. */
export const conversation: ReadonlyArray<{from: Side; text: string}> = [
  {from: 'you', text: 'Hi! Is your 0.005 BTC offer still up?'},
  {from: 'them', text: 'Yes, cash only. Where are you based?'},
  {from: 'you', text: 'Prague 2. Café at Náměstí Míru tomorrow at 5?'},
  {from: 'them', text: 'Works for me. How will I recognise you?'},
]

export const youTypeName: Typing = {text: people.you.name, start: 3300}
export const themTypeName: Typing = {text: people.them.name, start: 11000}

// Ms after the demo starts, in time order.
export const cues = {
  youTapEye: 1400,
  youOpenReveal: 1700,
  youTapNickname: 2800,
  youTapPhoto: typingEnd(youTypeName) + 500,
  youTapChoosePhoto: typingEnd(youTypeName) + 1300,
  youPhotoChosen: typingEnd(youTypeName) + 1700,
  youTapSend: typingEnd(youTypeName) + 2700,
  youCloseReveal: typingEnd(youTypeName) + 3000,
  youRequestSent: typingEnd(youTypeName) + 3300,
  requestArrives: typingEnd(youTypeName) + 3800,
  themTapReview: 9600,
  themOpenReveal: 9900,
  themTapNickname: 10700,
  themTapChoosePhoto: typingEnd(themTypeName) + 700,
  themPhotoChosen: typingEnd(themTypeName) + 1100,
  themTapAccept: typingEnd(themTypeName) + 2100,
  themCloseReveal: typingEnd(themTypeName) + 2400,
  revealed: typingEnd(themTypeName) + 2800,
  end: typingEnd(themTypeName) + 9000,
}

export type Cue = keyof typeof cues

export type Screen = 'chat' | 'reveal'

export const screens: Record<Side, ReadonlyArray<PhoneScreen<Screen>>> = {
  you: [
    {key: 'chat', open: 0},
    {
      key: 'reveal',
      open: cues.youOpenReveal,
      close: cues.youCloseReveal,
      transition: 'sheet',
    },
  ],
  them: [
    {key: 'chat', open: 0},
    {
      key: 'reveal',
      open: cues.themOpenReveal,
      close: cues.themCloseReveal,
      transition: 'sheet',
    },
  ],
}

export const timelineTimes = sortedTimes(
  Record.values(cues),
  keystrokeTimes(youTypeName),
  keystrokeTimes(themTypeName),
  screenTimes(screens.you),
  screenTimes(screens.them)
)
