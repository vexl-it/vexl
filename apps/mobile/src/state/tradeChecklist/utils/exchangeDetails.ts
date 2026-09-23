import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {
  type ContactRevealChatMessage,
  type IdentityRevealChatMessage,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  compare,
  VersionString,
} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Array, Option, pipe, Schema} from 'effect/index'
import {type ChatMessageWithState} from '../../chat/domain'
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

function newer<T extends {timestamp: number}>(
  a: T | undefined,
  b: T | undefined
): T | undefined {
  if (!a) return b
  if (!b) return a
  return b.timestamp > a.timestamp ? b : a
}

export interface ChatReveals {
  readonly messages: ChatMessageWithState[]
  readonly tradeChecklist: TradeChecklistInState
}

function notAfter(
  limit: number | undefined
): <T extends {timestamp: number}>(reveal: T | undefined) => T | undefined {
  return (reveal) =>
    limit !== undefined && reveal && reveal.timestamp > limit
      ? undefined
      : reveal
}

// Latest reveal per group in one direction, across checklist state and
// legacy messages. `until` limits the search to reveals up to that time.
export function latestReveal({
  chat,
  direction,
  until,
}: {
  chat: ChatReveals
  direction: RevealDirection
  until?: number
}): RevealUpdate {
  const limit = notAfter(until)

  return pipe(
    chat.messages,
    Array.filter((message) => message.state === direction),
    Array.filterMap((message) =>
      Option.fromNullable(revealFromMessage(message))
    ),
    Array.reduce<RevealUpdate, RevealUpdate>(
      {
        identity: limit(chat.tradeChecklist.identity[direction] ?? undefined),
        contact: limit(chat.tradeChecklist.contact[direction] ?? undefined),
      },
      (acc, reveal) => ({
        identity: newer(acc.identity, limit(reveal.identity)),
        contact: newer(acc.contact, limit(reveal.contact)),
      })
    )
  )
}

function isRequest(reveal: {status?: string} | undefined): boolean {
  return reveal?.status === 'REQUEST_REVEAL'
}

function isPendingRequest(
  request: {status?: string; timestamp: number} | undefined,
  answer: {timestamp: number} | undefined
): boolean {
  return (
    isRequest(request) && (answer?.timestamp ?? 0) < (request?.timestamp ?? 0)
  )
}

// The request sent in `direction` that the other direction has not answered.
export function pendingRequest({
  chat,
  direction,
}: {
  chat: ChatReveals
  direction: RevealDirection
}): RevealUpdate {
  const asked = latestReveal({chat, direction})
  const answered = latestReveal({
    chat,
    direction: direction === 'sent' ? 'received' : 'sent',
  })

  return {
    identity: isPendingRequest(asked.identity, answered.identity)
      ? asked.identity
      : undefined,
    contact: isPendingRequest(asked.contact, answered.contact)
      ? asked.contact
      : undefined,
  }
}

export interface RevealEvent {
  readonly direction: RevealDirection
  readonly reveal: RevealUpdate
  readonly timestamp: number
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

  const siblingReveals = pipe(
    chat.messages,
    Array.filter((one) => one.state === direction && one !== message),
    Array.filterMap((one) => Option.fromNullable(revealFromMessage(one)))
  )

  if (!reveal.identity) {
    const renderedByIdentityMessage = pipe(
      siblingReveals,
      Array.some((one) => one.identity?.timestamp === timestamp)
    )
    return renderedByIdentityMessage
      ? undefined
      : {direction, reveal, timestamp}
  }

  const contact =
    reveal.contact ??
    pipe(
      siblingReveals,
      Array.findFirst((one) => one.contact?.timestamp === timestamp),
      Option.map((one) => one.contact),
      Option.getOrUndefined
    )

  return {direction, reveal: {identity: reveal.identity, contact}, timestamp}
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

export function pendingRequestFromThem(
  chat: ChatReveals
): ExchangeDetailsSelection {
  return selectionFromReveal(pendingRequest({chat, direction: 'received'}))
}

// Nothing left to exchange, or my own request is still unanswered.
export function canExchangeDetails(chat: ChatReveals & {chat: Chat}): boolean {
  const sharedByThem = detailsSharedByThem(chat.chat)
  const somethingLeft = pipe(
    EXCHANGE_DETAIL_KEYS,
    Array.some((key) => !sharedByThem[key])
  )
  const waitingForThem = isAnyDetailSelected(
    selectionFromReveal(pendingRequest({chat, direction: 'sent'}))
  )

  return somethingLeft && !waitingForThem
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
