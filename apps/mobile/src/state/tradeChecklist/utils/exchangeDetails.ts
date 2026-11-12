import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {
  type ContactRevealChatMessage,
  type IdentityRevealChatMessage,
  type RevealStatus,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  compare,
  VersionString,
} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Array, Option, pipe, Schema} from 'effect/index'
import {type ChatMessageWithState} from '../../chat/domain'
import anonymizePhoneNumber from '../../chat/utils/anonymizePhoneNumber'
import {type TradeChecklistInState} from '../domain'

export const EXCHANGE_DETAIL_KEYS = [
  'nickname',
  'phoneNumber',
  'photo',
] as const
export type ExchangeDetailKey = (typeof EXCHANGE_DETAIL_KEYS)[number]

export type ExchangeDetailsSelection = Readonly<
  Record<ExchangeDetailKey, boolean>
>

export const NO_DETAILS_SELECTED: ExchangeDetailsSelection = {
  nickname: false,
  phoneNumber: false,
  photo: false,
}

export interface RevealUpdate {
  readonly identity?: IdentityRevealChatMessage
  readonly contact?: ContactRevealChatMessage
}

export type RevealDirection = 'sent' | 'received'

// Photo without a nickname needs a client that can display it.
const MINIMAL_VERSION_FOR_PHOTO_ONLY_EXCHANGE =
  Schema.decodeSync(VersionString)('26.9.5')

export function otherSideSupportsPhotoOnlyExchange(chat: Chat): boolean {
  if (!chat.otherSideVersion) return false
  return compare(chat.otherSideVersion)(
    '>=',
    MINIMAL_VERSION_FOR_PHOTO_ONLY_EXCHANGE
  )
}

export function selectedKeys(
  selection: ExchangeDetailsSelection
): ExchangeDetailKey[] {
  return pipe(
    EXCHANGE_DETAIL_KEYS,
    Array.filter((key) => selection[key])
  )
}

export function isAnyDetailSelected(
  selection: ExchangeDetailsSelection
): boolean {
  return Array.isNonEmptyArray(selectedKeys(selection))
}

export function selectionsEqual(
  a: ExchangeDetailsSelection,
  b: ExchangeDetailsSelection
): boolean {
  return pipe(
    EXCHANGE_DETAIL_KEYS,
    Array.every((key) => a[key] === b[key])
  )
}

// Details a reveal offers to the other side. A decline offers nothing.
export function selectionFromReveal({
  identity,
  contact,
}: RevealUpdate): ExchangeDetailsSelection {
  const identityOffered = !!identity && identity.status !== 'DISAPPROVE_REVEAL'

  return {
    nickname:
      identityOffered && !!(identity.deanonymizedUser?.name ?? identity.name),
    photo: identityOffered && !!identity.image,
    phoneNumber:
      !!contact &&
      contact.status !== 'DISAPPROVE_REVEAL' &&
      !!contact.fullPhoneNumber,
  }
}

function answerStatus(requested: boolean): RevealStatus {
  return requested ? 'APPROVE_REVEAL' : 'REQUEST_REVEAL'
}

// The nickname carries the partial form of the same number the contact
// reveal carries in full.
export function revealFromSelection({
  selection,
  requested,
  name,
  photo,
  phoneNumber,
  timestamp,
}: {
  selection: ExchangeDetailsSelection
  requested: ExchangeDetailsSelection
  name: UserName | undefined
  photo: UriString | undefined
  phoneNumber: E164PhoneNumber
  timestamp: UnixMilliseconds
}): RevealUpdate {
  const identityRequested = requested.nickname || requested.photo
  const identity: IdentityRevealChatMessage | undefined =
    selection.nickname || selection.photo
      ? {
          status: answerStatus(identityRequested),
          deanonymizedUser: name
            ? {name, partialPhoneNumber: anonymizePhoneNumber(phoneNumber)}
            : undefined,
          image: photo,
          timestamp,
        }
      : identityRequested
        ? {status: 'DISAPPROVE_REVEAL', timestamp}
        : undefined
  const contact: ContactRevealChatMessage | undefined = selection.phoneNumber
    ? {
        status: answerStatus(requested.phoneNumber),
        fullPhoneNumber: phoneNumber,
        timestamp,
      }
    : requested.phoneNumber
      ? {status: 'DISAPPROVE_REVEAL', timestamp}
      : undefined

  return {identity, contact}
}

// Details the other side has revealed to me so far.
export function detailsSharedByThem(chat: Chat): ExchangeDetailsSelection {
  const info = chat.otherSide.realLifeInfo

  return {
    nickname: !!info?.userName,
    photo: info?.image.type === 'imageUri',
    phoneNumber: !!info?.fullPhoneNumber,
  }
}

// Maps both the trade checklist format and the legacy reveal message types
// onto one shape.
export function revealFromMessage(
  message: ChatMessageWithState
): RevealUpdate | undefined {
  if (message.state !== 'sent' && message.state !== 'received') return undefined

  const {messageType, tradeChecklistUpdate, deanonymizedUser, image, time} =
    message.message

  switch (messageType) {
    case 'TRADE_CHECKLIST_UPDATE':
      return tradeChecklistUpdate?.identity || tradeChecklistUpdate?.contact
        ? {
            identity: tradeChecklistUpdate.identity,
            contact: tradeChecklistUpdate.contact,
          }
        : undefined
    case 'REQUEST_REVEAL':
    case 'APPROVE_REVEAL':
    case 'DISAPPROVE_REVEAL':
      return {
        identity: {
          status: messageType,
          deanonymizedUser,
          image,
          timestamp: time,
        },
      }
    case 'REQUEST_CONTACT_REVEAL':
      return {
        contact: {
          status: 'REQUEST_REVEAL',
          fullPhoneNumber: deanonymizedUser?.fullPhoneNumber,
          timestamp: time,
        },
      }
    case 'APPROVE_CONTACT_REVEAL':
      return {
        contact: {
          status: 'APPROVE_REVEAL',
          fullPhoneNumber: deanonymizedUser?.fullPhoneNumber,
          timestamp: time,
        },
      }
    case 'DISAPPROVE_CONTACT_REVEAL':
      return {contact: {status: 'DISAPPROVE_REVEAL', timestamp: time}}
    default:
      return undefined
  }
}

export interface ChatReveals {
  readonly messages: ChatMessageWithState[]
  readonly tradeChecklist: TradeChecklistInState
}

// Messages are ordered by server receipt time, so their position is a clock
// both sides agree on. Reveals known only from checklist state get no position
// and fall back to the sender's timestamp.
interface Located<T> {
  readonly reveal: T
  readonly order: number
}

interface LocatedReveals {
  readonly identity?: Located<IdentityRevealChatMessage>
  readonly contact?: Located<ContactRevealChatMessage>
}

const NO_ORDER = -1

function isAfter<A extends {timestamp: number}, B extends {timestamp: number}>(
  a: Located<A>,
  b: Located<B>
): boolean {
  if (a.order !== NO_ORDER && b.order !== NO_ORDER) return a.order > b.order
  return a.reveal.timestamp > b.reveal.timestamp
}

function opposite(direction: RevealDirection): RevealDirection {
  return direction === 'sent' ? 'received' : 'sent'
}

function locate<T>(
  reveal: T | undefined,
  order: number
): Located<T> | undefined {
  return reveal ? {reveal, order} : undefined
}

// Latest reveal per group in one direction, up to and including message
// position `until`.
function latestLocatedReveals({
  chat,
  direction,
  until,
}: {
  chat: ChatReveals
  direction: RevealDirection
  until?: number
}): LocatedReveals {
  const fromMessages = pipe(
    chat.messages,
    Array.filterMap((message, order) =>
      message.state === direction && (until === undefined || order <= until)
        ? Option.fromNullable(revealFromMessage(message)).pipe(
            Option.map((reveal) => ({reveal, order}))
          )
        : Option.none()
    ),
    Array.reduce<LocatedReveals, {reveal: RevealUpdate; order: number}>(
      {},
      (acc, {reveal, order}) => ({
        identity: locate(reveal.identity, order) ?? acc.identity,
        contact: locate(reveal.contact, order) ?? acc.contact,
      })
    )
  )

  if (until !== undefined) return fromMessages

  return {
    identity:
      fromMessages.identity ??
      locate(chat.tradeChecklist.identity[direction] ?? undefined, NO_ORDER),
    contact:
      fromMessages.contact ??
      locate(chat.tradeChecklist.contact[direction] ?? undefined, NO_ORDER),
  }
}

export function latestReveal(args: {
  chat: ChatReveals
  direction: RevealDirection
  until?: number
}): RevealUpdate {
  const located = latestLocatedReveals(args)
  return {
    identity: located.identity?.reveal,
    contact: located.contact?.reveal,
  }
}

function isRequest(reveal: {status?: string} | undefined): boolean {
  return reveal?.status === 'REQUEST_REVEAL'
}

function isPendingRequest<
  A extends {status?: string; timestamp: number},
  B extends {timestamp: number},
>(request: Located<A> | undefined, answer: Located<B> | undefined): boolean {
  if (!request || !isRequest(request.reveal)) return false
  return !answer || !isAfter(answer, request)
}

// The request sent in `direction` that the other direction has not answered.
export function pendingRequest({
  chat,
  direction,
}: {
  chat: ChatReveals
  direction: RevealDirection
}): RevealUpdate {
  const asked = latestLocatedReveals({chat, direction})
  const answered = latestLocatedReveals({chat, direction: opposite(direction)})

  return {
    identity: isPendingRequest(asked.identity, answered.identity)
      ? asked.identity?.reveal
      : undefined,
    contact: isPendingRequest(asked.contact, answered.contact)
      ? asked.contact?.reveal
      : undefined,
  }
}

export interface RevealEvent {
  readonly direction: RevealDirection
  readonly reveal: RevealUpdate
  readonly timestamp: number
  readonly order: number
}

// Identity and contact updates sent together share a timestamp and are shown
// as one event, rendered by the identity message.
export function revealEventForMessage(
  chat: ChatReveals,
  message: ChatMessageWithState
): RevealEvent | undefined {
  const reveal = revealFromMessage(message)
  if (!reveal || (message.state !== 'sent' && message.state !== 'received'))
    return undefined

  const direction = message.state
  const timestamp = (reveal.identity ?? reveal.contact)?.timestamp
  if (timestamp === undefined) return undefined

  const siblings = pipe(
    chat.messages,
    Array.filterMap((one, order) =>
      one.state === direction && one !== message
        ? Option.fromNullable(revealFromMessage(one)).pipe(
            Option.map((sibling) => ({reveal: sibling, order}))
          )
        : Option.none()
    )
  )
  const order = pipe(
    chat.messages,
    Array.findFirstIndex((one) => one === message),
    Option.getOrElse(() => chat.messages.length)
  )

  if (!reveal.identity) {
    const renderedByIdentityMessage = pipe(
      siblings,
      Array.some((one) => one.reveal.identity?.timestamp === timestamp)
    )
    return renderedByIdentityMessage
      ? undefined
      : {direction, reveal, timestamp, order}
  }

  const contactSibling = pipe(
    siblings,
    Array.findFirst((one) => one.reveal.contact?.timestamp === timestamp)
  )
  const contact =
    reveal.contact ??
    Option.getOrUndefined(
      Option.map(contactSibling, (one) => one.reveal.contact)
    )
  const eventOrder = pipe(
    contactSibling,
    Option.map((one) => Math.max(one.order, order)),
    Option.getOrElse(() => order)
  )

  return {
    direction,
    reveal: {identity: reveal.identity, contact},
    timestamp,
    order: eventOrder,
  }
}

// Details asked for in this event that the other direction has not answered.
export function stillPendingDetails(
  chat: ChatReveals,
  event: RevealEvent
): ExchangeDetailsSelection {
  const pending = pendingRequest({chat, direction: event.direction})
  const fromThisEvent = <T extends {timestamp: number}>(
    reveal: T | undefined
  ): T | undefined =>
    reveal?.timestamp === event.timestamp ? reveal : undefined

  return selectionFromReveal({
    identity: fromThisEvent(pending.identity),
    contact: fromThisEvent(pending.contact),
  })
}

export function isResponse(reveal: RevealUpdate): boolean {
  return (
    (!!reveal.identity && !isRequest(reveal.identity)) ||
    (!!reveal.contact && !isRequest(reveal.contact))
  )
}

// Answered requests and phone updates merged into their identity card show nothing.
export function isRevealMessageWithoutCard(
  chat: ChatReveals,
  message: ChatMessageWithState
): boolean {
  if (!revealFromMessage(message)) return false

  const event = revealEventForMessage(chat, message)
  if (!event) return true

  return (
    !isResponse(event.reveal) &&
    !isAnyDetailSelected(stillPendingDetails(chat, event))
  )
}

export function pendingRequestFromThem(
  chat: ChatReveals
): ExchangeDetailsSelection {
  return selectionFromReveal(pendingRequest({chat, direction: 'received'}))
}

function groupExchanged(
  a: {status?: string} | undefined,
  b: {status?: string} | undefined
): boolean {
  return (
    !!a &&
    !!b &&
    a.status !== 'DISAPPROVE_REVEAL' &&
    b.status !== 'DISAPPROVE_REVEAL'
  )
}

// Details that actually changed hands: a group counts only once both sides
// offered it, and within the group each side shares what it selected.
// Only the groups this event touches, paired with what the other direction
// had offered by then.
export function exchangedDetailsForEvent(
  chat: ChatReveals,
  event: RevealEvent
): {mine: ExchangeDetailsSelection; theirs: ExchangeDetailsSelection} {
  const other = latestReveal({
    chat,
    direction: opposite(event.direction),
    until: event.order,
  })
  const inEvent = (reveal: RevealUpdate): RevealUpdate => ({
    identity: event.reveal.identity ? reveal.identity : undefined,
    contact: event.reveal.contact ? reveal.contact : undefined,
  })

  return exchangedDetails({
    sent: event.direction === 'sent' ? event.reveal : inEvent(other),
    received: event.direction === 'received' ? event.reveal : inEvent(other),
  })
}

export function exchangedDetails({
  sent,
  received,
}: {
  sent: RevealUpdate
  received: RevealUpdate
}): {mine: ExchangeDetailsSelection; theirs: ExchangeDetailsSelection} {
  const identityExchanged = groupExchanged(sent.identity, received.identity)
  const contactExchanged = groupExchanged(sent.contact, received.contact)

  const onlyExchanged = (
    selection: ExchangeDetailsSelection
  ): ExchangeDetailsSelection => ({
    nickname: identityExchanged && selection.nickname,
    photo: identityExchanged && selection.photo,
    phoneNumber: contactExchanged && selection.phoneNumber,
  })

  return {
    mine: onlyExchanged(selectionFromReveal(sent)),
    theirs: onlyExchanged(selectionFromReveal(received)),
  }
}

function partialPhoneNumberOf(
  identity: IdentityRevealChatMessage | undefined
): string | undefined {
  return (
    identity?.deanonymizedUser?.partialPhoneNumber ??
    identity?.partialPhoneNumber
  )
}

// Reveals I sent in this chat, the latest first. Checklist state stands in
// for messages that are gone, but only when not looking at a point in time.
function sentRevealsLatestFirst(
  chat: ChatReveals,
  until?: number
): RevealUpdate[] {
  const fromMessages = pipe(
    chat.messages,
    Array.filterMap((message, order) =>
      message.state === 'sent' && (until === undefined || order <= until)
        ? Option.fromNullable(revealFromMessage(message))
        : Option.none()
    ),
    Array.reverse
  )
  if (until !== undefined) return fromMessages

  return Array.append(fromMessages, {
    identity: chat.tradeChecklist.identity.sent ?? undefined,
    contact: chat.tradeChecklist.contact.sent ?? undefined,
  })
}

// The account number the draft or an earlier reveal in this chat carries, so
// one chat keeps getting the same number. The main number otherwise. Two
// numbers can share the nickname mask, so a full number wins over a mask.
export function defaultPhoneNumberToReveal({
  accountPhoneNumbers,
  chat,
  draft,
}: {
  accountPhoneNumbers: Array.NonEmptyReadonlyArray<E164PhoneNumber>
  chat: ChatReveals
  draft: RevealUpdate
}): E164PhoneNumber {
  const reveals = [draft, ...sentRevealsLatestFirst(chat)]
  const firstRevealedAccountNumber = (
    revealsNumber: (
      reveal: RevealUpdate,
      phoneNumber: E164PhoneNumber
    ) => boolean
  ): Option.Option<E164PhoneNumber> =>
    Array.findFirst(reveals, (reveal) =>
      Array.findFirst(accountPhoneNumbers, (phoneNumber) =>
        revealsNumber(reveal, phoneNumber)
      )
    )

  return pipe(
    firstRevealedAccountNumber(
      (reveal, phoneNumber) => reveal.contact?.fullPhoneNumber === phoneNumber
    ),
    Option.orElse(() =>
      firstRevealedAccountNumber(
        (reveal, phoneNumber) =>
          partialPhoneNumberOf(reveal.identity) ===
          anonymizePhoneNumber(phoneNumber)
      )
    ),
    Option.getOrElse(() => Array.headNonEmpty(accountPhoneNumbers))
  )
}

export interface RevealedPhoneNumber {
  readonly full?: E164PhoneNumber
  readonly partial?: string
}

// The number I had revealed by the time of this event, read from the sent
// messages, so it stays right after the number leaves the account.
export function myRevealedPhoneNumberForEvent(
  chat: ChatReveals,
  event: RevealEvent
): RevealedPhoneNumber {
  const reveals = sentRevealsLatestFirst(chat, event.order)
  const full = pipe(
    reveals,
    Array.findFirst((reveal) =>
      Option.fromNullable(reveal.contact?.fullPhoneNumber)
    ),
    Option.getOrUndefined
  )
  const partial = pipe(
    reveals,
    Array.findFirst((reveal) =>
      Option.fromNullable(partialPhoneNumberOf(reveal.identity))
    ),
    Option.getOrUndefined
  )

  return {full, partial: partial ?? (full && anonymizePhoneNumber(full))}
}
