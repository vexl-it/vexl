import {Record} from 'effect'
import type {MarketplaceOffer} from '../shared/MarketplaceScene'
import type {DetailedOffer} from '../shared/OfferScenes'
import {screenTimes, type PhoneScreen} from '../shared/PhoneScreens'
import {
  keystrokeTimes,
  sortedTimes,
  typingEnd,
  type Typing,
} from '../shared/playback'
import type {Side} from '../shared/side'

const location = 'Prague 9'

// Fictional offer: they aren't in your network, so they see it as "Nearby".
export const nearbyOffer: DetailedOffer = {
  id: 'nearby',
  name: 'Nearby',
  mine: false,
  selling: true,
  iconTag: 'bitcoin',
  price: 'Up to 5 000 Kč',
  description:
    'At the conference all day. Cash for sats, find me by the coffee bar.',
  details: ['Cash', location],
  language: 'en',
  location,
  paymentMethod: 'Cash • Lightning',
}

export const offerSummary = `${nearbyOffer.price} • Cash • ${location}`

export const myOffers: readonly MarketplaceOffer[] = [
  {...nearbyOffer, name: 'Me', mine: true},
  {
    id: 'bike',
    name: 'Me',
    mine: true,
    selling: true,
    iconTag: 'product',
    price: '8 000 Kč',
    description: 'Road bike, 56 cm frame. Serviced this spring.',
    details: ['Pickup', 'Prague 2'],
    language: 'en, cs',
  },
]

export const request: Typing = {
  text: 'Hey, I’m at the conference too, want to trade?',
  start: 14400,
  keystrokeMs: 45,
}

// Ms after the demo starts, in time order.
export const cues = {
  // 1. You share your offer nearby.
  youTapOffer: 800,
  youDetailOpen: 1100,
  youTapSwitch: 2600,
  confirmOpen: 2900,
  youTapConfirm: 5600,
  sharing: 5900,

  // 2. Their phone picks it up.
  themWake: 8600,
  themAwake: 9100,
  themNotified: 9200,

  // 3. They open it.
  themTapNotification: 11200,
  themDetailOpen: 11500,
  themTapSendMessage: 13600,
  themSendOpen: 13900,

  // 4. They write to you.
  themTapSend: typingEnd(request) + 400,
  themChatOpen: typingEnd(request) + 700,
  youNotified: typingEnd(request) + 1400,
  youTapNotification: typingEnd(request) + 2600,
  youChatOpen: typingEnd(request) + 2900,
  end: typingEnd(request) + 8000,
}

export type Cue = keyof typeof cues

export type YouScreen = 'myOffers' | 'myOfferDetail' | 'chat'
export type ThemScreen = 'lock' | 'offerDetail' | 'sendMessage' | 'chat'

export const youScreens: ReadonlyArray<PhoneScreen<YouScreen>> = [
  {key: 'myOffers', open: 0},
  {key: 'myOfferDetail', open: cues.youDetailOpen, transition: 'push'},
  {key: 'chat', open: cues.youChatOpen, transition: 'push'},
]

export const themScreens: ReadonlyArray<PhoneScreen<ThemScreen>> = [
  {key: 'lock', open: 0, close: cues.themDetailOpen},
  {key: 'offerDetail', open: cues.themDetailOpen, transition: 'sheet'},
  {key: 'sendMessage', open: cues.themSendOpen, transition: 'push'},
  {key: 'chat', open: cues.themChatOpen, transition: 'push'},
]

export const focus: ReadonlyArray<readonly [number, Side]> = [
  [0, 'you'],
  [cues.themWake - 600, 'them'],
  [cues.youNotified, 'you'],
]

export const timelineTimes = sortedTimes(
  Record.values(cues),
  keystrokeTimes(request),
  screenTimes(youScreens),
  screenTimes(themScreens)
)
