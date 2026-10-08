import {Array, Record} from 'effect'
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

const btcPriceCzk = 2_400_000
const fiatAmount = 5_000

// Fictional offer and price.
export const offer = {
  description: 'Cash only, Prague 2. Evenings work best.',
  location: 'Prague 2',
  maxAmount: 10_000,
  btcPriceCzk,
  btcPrice: '2 400 000',
  fiatAmount: '5 000',
  btcAmount: (fiatAmount / btcPriceCzk).toFixed(8).replace('.', ','),
}

// The offer as they see it.
export const tradeOffer: DetailedOffer = {
  id: 'trade',
  name: 'Friend of a friend',
  mine: false,
  selling: true,
  iconTag: 'bitcoin',
  commonFriends: 3,
  price: 'Up to 10 000 Kč',
  description: offer.description,
  details: ['Cash', offer.location],
  language: 'en',
  location: offer.location,
  paymentMethod: 'Cash • Lightning',
}

export const myTradeOffer: MarketplaceOffer = {
  ...tradeOffer,
  id: 'mine',
  name: 'Me',
  mine: true,
  commonFriends: undefined,
}

export const otherOffers: readonly MarketplaceOffer[] = [
  {
    id: 'brno',
    name: 'Friend of a friend',
    mine: false,
    selling: false,
    iconTag: 'bitcoin',
    commonFriends: 2,
    price: 'Up to 20 000 Kč',
    description: 'Buying for cash in Brno, weekends only.',
    details: ['Cash', 'Brno'],
    language: 'cs, en',
  },
  {
    id: 'prague7',
    name: 'Direct friend',
    mine: false,
    selling: true,
    iconTag: 'bitcoin',
    commonFriends: 5,
    price: '1 000 – 3 000 Kč',
    description: 'Small amounts over Lightning. Coffee near Letná?',
    details: ['Cash', 'Prague 7'],
    language: 'cs',
  },
]

export const myOldOffer: MarketplaceOffer = {
  id: 'bike',
  name: 'Me',
  mine: true,
  selling: true,
  iconTag: 'product',
  price: '8 000 Kč',
  description: 'Road bike, 56 cm frame. Serviced this spring.',
  details: ['Pickup', 'Prague 2'],
  language: 'en, cs',
}

// Fictional meeting, shown as the app formats it in English.
export const meeting = {
  weekday: 'Thursday',
  dateLabel: 'Oct 8, 2026',
  slots: ['5:00 PM', '5:30 PM'],
  suggestions: ['Thu, 10/8, 5:00 PM', 'Thu, 10/8, 5:30 PM'],
  pick: 'Thu, 10/8, 5:30 PM',
}

const fastTyping = 40

export const typing = {
  description: {text: offer.description, start: 8300, keystrokeMs: fastTyping},
  request: {
    text: 'Hi! Could I buy 5 000 CZK worth of sats this week?',
    start: 19100,
    keystrokeMs: fastTyping,
  },
  youReply: {
    text: "Sure! Let's sort out the details in the checklist.",
    start: 27800,
    keystrokeMs: fastTyping,
  },
  themReply: {
    text: 'Great, sending you times now.',
    start: 31400,
    keystrokeMs: fastTyping,
  },
  fiat: {text: '5000', start: 40300},
} satisfies Record<string, Typing>

// Ms after the demo starts, in time order.
export const cues = {
  // 1. You create an offer.
  youTapNewOffer: 400,
  formOpen: 700,
  tapBitcoin: 1500,
  listingDone: 1800,
  tapSell: 2500,
  sellDone: 2800,
  amountMax: 3300,
  tapAmountNext: 4100,
  amountDone: 4400,
  tapAddLocation: 5000,
  locationAdded: 5400,
  tapLocationNext: 6000,
  locationDone: 6300,
  tapLightning: 6900,
  tapNetworkNext: 7500,
  networkDone: 7800,
  tapDescribeNext: typingEnd(typing.description) + 400,
  describeDone: typingEnd(typing.description) + 700,
  tapSecondDegree: 11200,
  tapFriendNext: 11800,
  friendDone: 12100,
  tapPublish: 12800,
  publishing: 13000,
  published: 14300,
  formClose: 15500,

  // 2. They find it and send a request.
  offerArrives: 15600,
  themTapOffer: 16600,
  themDetailOpen: 16900,
  themTapSendMessage: 18200,
  themSendOpen: 18500,
  themTapSendRequest: typingEnd(typing.request) + 400,
  themChatOpen: typingEnd(typing.request) + 700,

  // 3. You accept.
  youNotified: 22800,
  youTapNotification: 23900,
  youChatOpen: 24200,
  youTapAccept: 25900,
  accepted: 26200,

  // 4. You chat.
  youSendReply: typingEnd(typing.youReply) + 300,
  themTapInput: 31000,
  themSendReply: typingEnd(typing.themReply) + 300,

  // 5. You agree on the time and the amount.
  themTapChecklist: 33900,
  hubOpen: 34200,
  themTapDateAndTime: 35200,
  timesOpen: 35500,
  themTapSlot1: 36400,
  themTapSlot2: 36900,
  themTapSlotsSave: 37600,
  themTapTimesContinue: 38400,
  dateQueued: 38700,
  themTapAmount: 39500,
  amountOpen: 39800,
  themTapAmountSave: 41300,
  amountQueued: 41600,
  themTapChecklistSend: 42400,
  checklistSent: 42700,
  youCardsArrive: 43200,
  youTapRespond: 44200,
  pickDateOpen: 44500,
  youTapDate: 45400,
  pickTimeOpen: 45700,
  youTapTime: 46500,
  youTapTimeAccept: 47200,
  meetingSet: 47500,
  youTapConfirmAmount: 48600,
  confirmAmountOpen: 48900,
  youTapAmountAccept: 50100,
  amountAccepted: 50400,
  nextStep: 51400,
  end: 56500,
}

export type Cue = keyof typeof cues

export type YouScreen =
  | 'myOffers'
  | 'form'
  | 'chat'
  | 'pickDate'
  | 'pickTime'
  | 'confirmAmount'

export type ThemScreen =
  | 'marketplace'
  | 'offerDetail'
  | 'sendMessage'
  | 'chat'
  | 'hub'
  | 'times'
  | 'amount'

export const youScreens: ReadonlyArray<PhoneScreen<YouScreen>> = [
  {key: 'myOffers', open: 0},
  {
    key: 'form',
    open: cues.formOpen,
    close: cues.formClose,
    transition: 'sheet',
  },
  {key: 'chat', open: cues.youChatOpen, transition: 'push'},
  {
    key: 'pickDate',
    open: cues.pickDateOpen,
    close: cues.meetingSet,
    transition: 'push',
  },
  {
    key: 'pickTime',
    open: cues.pickTimeOpen,
    close: cues.meetingSet,
    transition: 'push',
  },
  {
    key: 'confirmAmount',
    open: cues.confirmAmountOpen,
    close: cues.amountAccepted,
    transition: 'push',
  },
]

export const themScreens: ReadonlyArray<PhoneScreen<ThemScreen>> = [
  {key: 'marketplace', open: 0},
  {key: 'offerDetail', open: cues.themDetailOpen, transition: 'push'},
  {key: 'sendMessage', open: cues.themSendOpen, transition: 'push'},
  {key: 'chat', open: cues.themChatOpen, transition: 'push'},
  {
    key: 'hub',
    open: cues.hubOpen,
    close: cues.checklistSent,
    transition: 'sheet',
  },
  {
    key: 'times',
    open: cues.timesOpen,
    close: cues.dateQueued,
    transition: 'push',
  },
  {
    key: 'amount',
    open: cues.amountOpen,
    close: cues.amountQueued,
    transition: 'push',
  },
]

export const focus: ReadonlyArray<readonly [number, Side]> = [
  [0, 'you'],
  [cues.offerArrives, 'them'],
  [cues.youNotified, 'you'],
  [cues.themTapInput, 'them'],
  [cues.youCardsArrive, 'you'],
]

export const timelineTimes = sortedTimes(
  Record.values(cues),
  ...Array.map(Record.values(typing), keystrokeTimes),
  screenTimes(youScreens),
  screenTimes(themScreens)
)
