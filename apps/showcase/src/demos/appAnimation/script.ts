import {Array, Option, pipe, Record} from 'effect'
import {offerFormTimeline, type OfferFormCue} from '../shared/OfferFormScene'
import {screenTimes, type PhoneScreen} from '../shared/PhoneScreens'
import {
  keystrokeTimes,
  sortedTimes,
  typingEnd,
  type Typing,
} from '../shared/playback'
import type {AnimationOffer, AppAnimationConfig, StepId} from './config'

export type AppScreen =
  | 'welcome'
  | 'phoneNumber'
  | 'contactsImport'
  | 'marketplace'
  | 'offerForm'
  | 'offerDetail'
  | 'sendMessage'
  | 'chat'
  | 'checklist'
  | 'dateTime'
  | 'location'
  | 'success'
  | 'end'

export type MarketplaceScroll = 'top' | 'down' | 'chosen'

export interface AppAnimationStep {
  readonly id: StepId | 'end'
  readonly caption: string
  readonly start: number
  /** Where to stop while its settings are edited: a moment showing everything they change. */
  readonly hold: number
}

// Shown when no offers are configured, so the story still has an offer to message.
const fallbackOffer: AnimationOffer = {
  id: 'fallback',
  name: 'Friend of a friend',
  selling: true,
  commonFriends: 3,
  price: 'Up to 10 000 Kč',
  description: 'Cash only, evenings work best.',
  location: 'Prague',
  language: 'en',
}

export type AppCue =
  | 'tapGetStarted'
  | 'phoneOpen'
  | 'tapPhoneContinue'
  | 'contactsOpen'
  | 'tapImportContacts'
  | 'importingContacts'
  | 'addingContacts'
  | 'contactsMostlyAdded'
  | 'contactsImported'
  | 'marketplaceOpen'
  | 'scrollDown'
  | 'scrollToChosen'
  | 'tapNewOffer'
  | 'formClose'
  | 'tapChosenOffer'
  | 'detailOpen'
  | 'tapSendMessage'
  | 'sendMessageOpen'
  | 'tapSendRequest'
  | 'chatOpen'
  | 'approvedNotification'
  | 'tapApprovedNotification'
  | 'approved'
  | 'theirFirstMessage'
  | 'sendYourReply'
  | 'sendLetsMeet'
  | 'theirLetsMeetReply'
  | 'tapChecklist'
  | 'checklistOpen'
  | 'tapDateAndTime'
  | 'dateTimeOpen'
  | 'tapTimeSlot'
  | 'tapSlotsSave'
  | 'tapDateTimeContinue'
  | 'dateQueued'
  | 'tapMeetingLocation'
  | 'locationOpen'
  | 'tapPlace'
  | 'placePicked'
  | 'tapLocationSave'
  | 'locationQueued'
  | 'tapChecklistSend'
  | 'checklistSent'
  | 'meetingAccepted'
  | 'successOpen'
  | 'endOpen'
  | OfferFormCue

type TypingKey =
  | 'phoneDigits'
  | 'request'
  | 'yourReply'
  | 'letsMeet'
  | 'offerDescription'

export interface AppAnimationScript {
  readonly cues: Record<AppCue, number>
  readonly typing: Record<TypingKey, Typing>
  readonly screens: ReadonlyArray<PhoneScreen<AppScreen>>
  readonly steps: readonly AppAnimationStep[]
  readonly scroll: (playhead: number) => MarketplaceScroll
  readonly offers: Array.NonEmptyReadonlyArray<AnimationOffer>
  readonly chosenOffer: AnimationOffer
  readonly end: number
  /** Every moment the screen changes. */
  readonly times: readonly number[]
}

const never = Number.POSITIVE_INFINITY
const messageKeystrokeMs = 55

/** Ms after the start of every moment, in time order; skipped sections never happen. */
export function buildScript(config: AppAnimationConfig): AppAnimationScript {
  let t = 0
  const wait = (ms: number): number => (t += ms)
  const type = (text: string, keystrokeMs = messageKeystrokeMs): Typing => {
    const typing = {text, start: t, keystrokeMs}
    t = typingEnd(typing)
    return typing
  }

  // 0. The app's first screen.
  const tapGetStarted = wait(2800)
  const phoneOpen = wait(300)

  // 1. Phone number.
  wait(600)
  const phoneDigits = type(config.phone.number.replace(/\D/g, ''), 150)
  const tapPhoneContinue = wait(500)
  const contactsOpen = wait(300)

  // 2. Contacts.
  const tapImportContacts = wait(1800)
  const importingContacts = wait(300)
  const addingContacts = wait(500)
  const contactsMostlyAdded = wait(500)
  const contactsImported = wait(500)
  const marketplaceOpen = wait(900)

  // 3. Browse offers.
  const scrollDown = wait(1000)
  const scrollToChosen = wait(2200)
  wait(1600)

  // 4. Add your own offer.
  const addOfferStart = t
  const tapNewOffer = config.includeAddOffer ? wait(0) : never
  const form = offerFormTimeline(
    config.includeAddOffer ? wait(300) : never,
    config.myOffer.description
  )
  if (config.includeAddOffer) t = form.cues.published
  const formClose = config.includeAddOffer ? wait(1200) : never
  if (config.includeAddOffer) wait(800)

  // 5. Message the chosen offer.
  const tapChosenOffer = wait(0)
  const detailOpen = wait(300)
  const tapSendMessage = wait(1800)
  const sendMessageOpen = wait(300)
  wait(500)
  const request = type(config.messages.request)
  const tapSendRequest = wait(400)
  const chatOpen = wait(300)

  // 6. They accept.
  const approvedNotification = wait(1800)
  const tapApprovedNotification = wait(1500)
  const approved = wait(300)

  // 7. Chat.
  const theirFirstMessage = wait(1200)
  wait(900)
  const yourReply = type(config.messages.yourReply)
  const sendYourReply = wait(300)

  // 8. Let's meet.
  wait(900)
  const letsMeet = type(config.messages.letsMeet)
  const sendLetsMeet = wait(300)
  const theirLetsMeetReply = wait(1300)

  // 9. Place and time.
  const tapChecklist = wait(1200)
  const checklistOpen = wait(300)
  const tapDateAndTime = wait(1000)
  const dateTimeOpen = wait(300)
  const tapTimeSlot = wait(900)
  const tapSlotsSave = wait(700)
  const tapDateTimeContinue = wait(800)
  const dateQueued = wait(300)
  const tapMeetingLocation = wait(800)
  const locationOpen = wait(300)
  const tapPlace = wait(1000)
  const placePicked = wait(300)
  const tapLocationSave = wait(800)
  const locationQueued = wait(300)
  const tapChecklistSend = wait(800)
  const checklistSent = wait(300)
  const meetingAccepted = wait(1800)
  wait(2200)

  // 10. Meeting successful.
  const successOpen = config.includeMeetingSuccess ? wait(0) : never
  if (config.includeMeetingSuccess) wait(3500)

  // 11. Vexl.
  const endOpen = wait(0)
  const end = wait(3500)

  const cues = {
    tapGetStarted,
    phoneOpen,
    tapPhoneContinue,
    contactsOpen,
    tapImportContacts,
    importingContacts,
    addingContacts,
    contactsMostlyAdded,
    contactsImported,
    marketplaceOpen,
    scrollDown,
    scrollToChosen,
    tapNewOffer,
    formClose,
    tapChosenOffer,
    detailOpen,
    tapSendMessage,
    sendMessageOpen,
    tapSendRequest,
    chatOpen,
    approvedNotification,
    tapApprovedNotification,
    approved,
    theirFirstMessage,
    sendYourReply,
    sendLetsMeet,
    theirLetsMeetReply,
    tapChecklist,
    checklistOpen,
    tapDateAndTime,
    dateTimeOpen,
    tapTimeSlot,
    tapSlotsSave,
    tapDateTimeContinue,
    dateQueued,
    tapMeetingLocation,
    locationOpen,
    tapPlace,
    placePicked,
    tapLocationSave,
    locationQueued,
    tapChecklistSend,
    checklistSent,
    meetingAccepted,
    successOpen,
    endOpen,
    ...form.cues,
  } satisfies Record<AppCue, number>

  const typing = {
    phoneDigits,
    request,
    yourReply,
    letsMeet,
    offerDescription: form.description,
  } satisfies Record<TypingKey, Typing>

  const screens: ReadonlyArray<PhoneScreen<AppScreen>> = [
    {key: 'welcome', open: 0},
    {key: 'phoneNumber', open: phoneOpen, transition: 'push'},
    {key: 'contactsImport', open: contactsOpen, transition: 'push'},
    {key: 'marketplace', open: marketplaceOpen, transition: 'fade'},
    {
      key: 'offerForm',
      open: form.cues.formOpen,
      close: formClose,
      transition: 'sheet',
    },
    {key: 'offerDetail', open: detailOpen, transition: 'push'},
    {key: 'sendMessage', open: sendMessageOpen, transition: 'push'},
    {key: 'chat', open: chatOpen, transition: 'push'},
    {
      key: 'checklist',
      open: checklistOpen,
      close: checklistSent,
      transition: 'sheet',
    },
    {
      key: 'dateTime',
      open: dateTimeOpen,
      close: dateQueued,
      transition: 'push',
    },
    {
      key: 'location',
      open: locationOpen,
      close: locationQueued,
      transition: 'push',
    },
    {key: 'success', open: successOpen, transition: 'fade'},
    {key: 'end', open: endOpen, transition: 'fade'},
  ]

  const stepMoments: ReadonlyArray<{
    readonly id: StepId | 'end'
    readonly start: number
    readonly hold?: number
  }> = [
    {id: 'welcome', start: 0},
    {id: 'phone', start: phoneOpen},
    {id: 'contacts', start: contactsOpen},
    {id: 'browse', start: marketplaceOpen, hold: scrollToChosen + 1500},
    {
      id: 'addOffer',
      start: config.includeAddOffer ? addOfferStart : never,
      hold: form.cues.tapPublish - 1,
    },
    {id: 'request', start: tapChosenOffer, hold: tapSendRequest - 1},
    {id: 'approved', start: approvedNotification},
    {id: 'chat', start: theirFirstMessage},
    {id: 'letsMeet', start: letsMeet.start},
    {id: 'meeting', start: tapChecklist},
    {id: 'success', start: successOpen},
    {id: 'end', start: endOpen},
  ]
  const included = Array.filter(stepMoments, ({start}) => start !== never)
  const steps: readonly AppAnimationStep[] = Array.map(
    included,
    ({id, start, hold}, index) => ({
      id,
      start,
      hold: hold ?? (included[index + 1]?.start ?? end) - 1,
      caption: id === 'end' ? '' : config.captions[id],
    })
  )

  const scroll = (playhead: number): MarketplaceScroll =>
    playhead >= scrollToChosen
      ? 'chosen'
      : playhead >= scrollDown
        ? 'down'
        : 'top'

  const offers = Array.isNonEmptyReadonlyArray(config.offers)
    ? config.offers
    : Array.of(fallbackOffer)
  const chosenOffer = pipe(
    offers,
    Array.findFirst(({id}) => id === config.chosenOfferId),
    Option.getOrElse(() => Array.headNonEmpty(offers))
  )

  return {
    cues,
    typing,
    screens,
    steps,
    scroll,
    offers,
    chosenOffer,
    end,
    times: pipe(
      sortedTimes(
        Record.values(cues),
        ...Array.map(Record.values(typing), keystrokeTimes),
        screenTimes(screens),
        [end]
      ),
      Array.filter((time) => time !== never)
    ),
  }
}

/** Whether the playhead reached `cue`. */
export type At = (cue: AppCue) => boolean

/** What every app animation scene gets. */
export interface SceneProps {
  readonly config: AppAnimationConfig
  readonly script: AppAnimationScript
  readonly at: At
  readonly playhead: number
}
