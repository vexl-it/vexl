import {Schema} from 'effect'

/** Everything business people can tweak in the app animation. All data is fictional. */

export const StepId = Schema.Literal(
  'welcome',
  'phone',
  'contacts',
  'browse',
  'addOffer',
  'request',
  'approved',
  'chat',
  'letsMeet',
  'meeting',
  'success'
)
export type StepId = typeof StepId.Type

export const AnimationOffer = Schema.Struct({
  id: Schema.String,
  /** How the author is related to you, e.g. "Friend of a friend". */
  name: Schema.String,
  selling: Schema.Boolean,
  commonFriends: Schema.NonNegativeInt,
  price: Schema.String,
  description: Schema.String,
  location: Schema.String,
  language: Schema.String,
})
export type AnimationOffer = typeof AnimationOffer.Type

export const Appearance = Schema.Literal('light', 'dark')
export type Appearance = typeof Appearance.Type

export const ReelStyle = Schema.Literal('static', 'animated')
export type ReelStyle = typeof ReelStyle.Type

/** What the animated reel's camera frames: `auto` follows what happens on screen. */
export const ReelCamera = Schema.Literal(
  'auto',
  'full',
  'top',
  'bottom',
  'tilt'
)
export type ReelCamera = typeof ReelCamera.Type

export const ReelColor = Schema.Literal(
  'yellow',
  'green',
  'pink',
  'black',
  'darkGreen',
  'darkPink'
)
export type ReelColor = typeof ReelColor.Type

export const ReelMotion = Schema.Struct({
  /** The Vexl app tile bouncing in before the phone. */
  logoIntro: Schema.Boolean,
  wordByWordCaptions: Schema.Boolean,
  /** Each step's color wipes in over the previous one. */
  colorWipe: Schema.Boolean,
  /** How far zoomed framings enlarge the screen. */
  zoom: Schema.Number.pipe(Schema.between(1, 2.5)),
  steps: Schema.Record({
    key: StepId,
    value: Schema.Struct({camera: ReelCamera, color: ReelColor}),
  }),
})
export type ReelMotion = typeof ReelMotion.Type

export const defaultReelMotion: ReelMotion = {
  logoIntro: true,
  wordByWordCaptions: true,
  colorWipe: true,
  zoom: 1.5,
  steps: {
    welcome: {camera: 'auto', color: 'yellow'},
    phone: {camera: 'auto', color: 'green'},
    contacts: {camera: 'auto', color: 'pink'},
    browse: {camera: 'auto', color: 'black'},
    addOffer: {camera: 'auto', color: 'darkGreen'},
    request: {camera: 'auto', color: 'yellow'},
    approved: {camera: 'auto', color: 'darkPink'},
    chat: {camera: 'auto', color: 'green'},
    letsMeet: {camera: 'auto', color: 'pink'},
    meeting: {camera: 'auto', color: 'black'},
    success: {camera: 'auto', color: 'yellow'},
  },
}

export const AppAnimationConfig = Schema.Struct({
  /** Animated reels move a camera over the screen and change colors per step. */
  reelStyle: Schema.optionalWith(ReelStyle, {default: () => 'static'}),
  reelMotion: Schema.optionalWith(ReelMotion, {
    default: () => defaultReelMotion,
  }),
  /** The app's color theme. Optional, so settings saved before it existed still load. */
  appearance: Schema.optionalWith(Appearance, {default: () => 'light'}),
  /** The reel caption above the screen, per step. */
  captions: Schema.Record({key: StepId, value: Schema.String}),
  phone: Schema.Struct({
    callingCode: Schema.String,
    /** National number, spaces split it into the groups the app shows. */
    number: Schema.String,
  }),
  /** The marketplace, top to bottom. */
  offers: Schema.Array(AnimationOffer),
  /** The offer you scroll to, open and message. */
  chosenOfferId: Schema.String,
  includeAddOffer: Schema.Boolean,
  myOffer: Schema.Struct({
    selling: Schema.Boolean,
    maxAmount: Schema.NonNegative,
    location: Schema.String,
    description: Schema.String,
  }),
  messages: Schema.Struct({
    /** Your request on the chosen offer. */
    request: Schema.String,
    /** Their first message once they accept. */
    theirFirst: Schema.String,
    yourReply: Schema.String,
    letsMeet: Schema.String,
    theirLetsMeetReply: Schema.String,
  }),
  meeting: Schema.Struct({
    weekday: Schema.String,
    dateLabel: Schema.String,
    /** One of the time slot chips, e.g. "5:30 PM". */
    time: Schema.String,
    place: Schema.String,
  }),
  includeMeetingSuccess: Schema.Boolean,
  success: Schema.Struct({
    title: Schema.String,
    text: Schema.String,
  }),
})
export type AppAnimationConfig = typeof AppAnimationConfig.Type

export const defaultConfig: AppAnimationConfig = {
  appearance: 'light',
  reelStyle: 'static',
  reelMotion: defaultReelMotion,
  captions: {
    welcome: 'Get started with Vexl',
    phone: 'Enter your phone number',
    contacts: 'Upload contacts',
    browse: 'Browse offers on the dashboard',
    addOffer: 'Add offer',
    request: 'Write “Hey, I’m interested”',
    approved: 'Message request approved',
    chat: 'Start a chat',
    letsMeet: '“Let’s meet”',
    meeting: 'Set up place and time',
    success: 'Meeting successful',
  },
  phone: {callingCode: '+420', number: '777 123 456'},
  offers: [
    {
      id: 'brno',
      name: 'Friend of a friend',
      selling: false,
      commonFriends: 2,
      price: 'Up to 20 000 Kč',
      description: 'Buying for cash in Brno, weekends only.',
      location: 'Brno',
      language: 'cs, en',
    },
    {
      id: 'vinohrady',
      name: 'Friend of a friend',
      selling: true,
      commonFriends: 3,
      price: 'Up to 10 000 Kč',
      description: 'Cash only, Prague 2. Evenings work best.',
      location: 'Prague 2',
      language: 'en',
    },
    {
      id: 'letna',
      name: 'Direct friend',
      selling: true,
      commonFriends: 5,
      price: '1 000 – 3 000 Kč',
      description: 'Small amounts over Lightning. Coffee near Letná?',
      location: 'Prague 7',
      language: 'cs',
    },
    {
      id: 'karlin',
      name: 'Friend of a friend',
      selling: false,
      commonFriends: 1,
      price: 'Up to 15 000 Kč',
      description: 'Looking to buy sats regularly, happy to meet in Karlín.',
      location: 'Prague 8',
      language: 'en',
    },
    {
      id: 'ostrava',
      name: 'Direct friend',
      selling: true,
      commonFriends: 4,
      price: 'Up to 50 000 Kč',
      description: 'Selling larger amounts on-chain, Ostrava and around.',
      location: 'Ostrava',
      language: 'cs',
    },
  ],
  chosenOfferId: 'vinohrady',
  includeAddOffer: true,
  myOffer: {
    selling: false,
    maxAmount: 5_000,
    location: 'Prague 3',
    description: 'Buying small amounts for cash, Žižkov or Vinohrady.',
  },
  messages: {
    request: 'Hey, I’m interested!',
    theirFirst: 'Hi! Happy to trade. How much are you looking for?',
    yourReply: 'About 5 000 Kč. Does this week work for you?',
    letsMeet: 'Let’s meet!',
    theirLetsMeetReply: 'Sure! Send me a time and place.',
  },
  meeting: {
    weekday: 'Thursday',
    dateLabel: 'Oct 22, 2026',
    time: '5:30 PM',
    place: 'Café Sladkovský, Prague 4',
  },
  includeMeetingSuccess: true,
  success: {
    title: 'Meeting successful!',
    text: 'You traded with a friend of a friend and stayed anonymous.',
  },
}
