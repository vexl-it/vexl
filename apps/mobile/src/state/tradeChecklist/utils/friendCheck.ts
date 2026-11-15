import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  type Chat,
  type ChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {type FriendCheckChatMessage} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  compare,
  VersionString,
} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Array, Option, Order, pipe, Schema} from 'effect'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type FriendCheckLocalState,
} from '../../chat/domain'

export const MINIMAL_VERSION_FOR_FRIEND_CHECK =
  Schema.decodeSync(VersionString)('26.11.3')

export function otherSideSupportsFriendCheck(chat: Chat): boolean {
  if (!chat.otherSideVersion) return false
  return compare(chat.otherSideVersion)('>=', MINIMAL_VERSION_FOR_FRIEND_CHECK)
}

// The friend matches two messages by the phrase, so it is the same English
// words on both phones whatever their language. Changing these lists would
// make two app versions show different phrases for one check.
const PHRASES = Array.cartesianWith(
  [
    'pink',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
    'red',
    'white',
    'black',
    'silver',
    'golden',
    'brown',
    'tiny',
    'giant',
    'happy',
    'sleepy',
  ],
  [
    'elephant',
    'fish',
    'tiger',
    'rabbit',
    'turtle',
    'penguin',
    'dolphin',
    'giraffe',
    'monkey',
    'zebra',
    'panda',
    'koala',
    'otter',
    'parrot',
    'owl',
    'fox',
    'wolf',
    'bear',
    'lion',
    'horse',
    'whale',
    'crab',
    'frog',
    'duck',
    'goat',
    'camel',
    'eagle',
    'kiwi',
    'lobster',
    'hedgehog',
    'squirrel',
    'octopus',
  ],
  (adjective, animal) => `${adjective} ${animal}`
)

export function generateFriendCheckPhraseSeed(): number {
  return Math.floor(Math.random() * PHRASES.length)
}

export function friendCheckPhrase(phraseSeed: number): string {
  return Array.unsafeGet(PHRASES, phraseSeed % PHRASES.length)
}

export type FriendCheckStatus =
  | 'waitingForMe'
  | 'pending'
  | 'waitingForThem'
  | 'vouched'
  | 'notVouched'

export interface FriendCheck {
  readonly friend: HashedPhoneNumber
  readonly phrase: string
  // The message the check is displayed at
  readonly requestMessageId: ChatMessageId
  readonly startedBy: 'me' | 'them'
  readonly contacted: boolean
  readonly refusal: FriendCheckLocalState['refusal']
  readonly vouchedByMe: boolean
  readonly status: FriendCheckStatus
}

interface FriendCheckEvent {
  readonly direction: 'sent' | 'received'
  readonly messageId: ChatMessageId
  readonly update: FriendCheckChatMessage
}

interface FriendCheckRequest extends FriendCheckEvent {
  readonly phraseSeed: number
}

function eventFromMessage(
  message: ChatMessageWithState
): Option.Option<FriendCheckEvent> {
  if (message.state !== 'sent' && message.state !== 'received')
    return Option.none()

  const direction = message.state
  const messageId = message.message.uuid
  return pipe(
    Option.fromNullable(message.message.tradeChecklistUpdate?.friendCheck),
    Option.map((update) => ({direction, messageId, update}))
  )
}

export function isFriendCheckMessage(message: ChatMessageWithState): boolean {
  return Option.isSome(eventFromMessage(message))
}

// Both sides can ask the same friend at the same moment. They have to end up
// with one phrase, so the winner is picked by what the requests carry and not
// by the order each phone stored them in.
const byRequestContent: Order.Order<FriendCheckRequest> = Order.combine(
  Order.mapInput(Order.number, (one) => one.update.timestamp),
  Order.mapInput(Order.number, (one) => one.phraseSeed)
)

function statusOf({
  contacted,
  refusal,
  vouchedByMe,
  vouchedByThem,
}: {
  contacted: boolean
  refusal: FriendCheckLocalState['refusal']
  vouchedByMe: boolean
  vouchedByThem: boolean
}): FriendCheckStatus {
  if (vouchedByMe) return vouchedByThem ? 'vouched' : 'waitingForThem'
  if (refusal) return 'notVouched'
  if (contacted && !vouchedByThem) return 'pending'
  return 'waitingForMe'
}

export function friendChecksFromChat({
  messages,
  friendChecks: localStates = {},
}: Pick<ChatWithMessages, 'messages' | 'friendChecks'>): FriendCheck[] {
  const eventsByFriend = pipe(
    messages,
    Array.filterMap(eventFromMessage),
    Array.groupBy((event) => event.update.friend)
  )

  return pipe(
    Object.values(eventsByFriend),
    Array.filterMap((events) => {
      const requests = Array.filterMap(events, (event) =>
        event.update.status === 'REQUEST' &&
        event.update.phraseSeed !== undefined
          ? Option.some({...event, phraseSeed: event.update.phraseSeed})
          : Option.none()
      )
      if (!Array.isNonEmptyArray(requests)) return Option.none()

      const request = Array.min(requests, byRequestContent)
      const hasVouched = (direction: FriendCheckEvent['direction']): boolean =>
        Array.some(
          events,
          (event) =>
            event.update.status === 'VOUCHED' && event.direction === direction
        )
      const localState = localStates[request.update.friend]
      const phrase = friendCheckPhrase(request.phraseSeed)
      const state = {
        contacted: localState?.contactedWithPhrase === phrase,
        refusal: localState?.refusal,
        vouchedByMe: hasVouched('sent'),
      }

      return Option.some({
        ...state,
        friend: request.update.friend,
        phrase,
        requestMessageId: request.messageId,
        startedBy: request.direction === 'sent' ? 'me' : 'them',
        status: statusOf({...state, vouchedByThem: hasVouched('received')}),
      } satisfies FriendCheck)
    })
  )
}

export function hasFriendVouched(checks: readonly FriendCheck[]): boolean {
  return Array.some(checks, (check) => check.vouchedByMe)
}
