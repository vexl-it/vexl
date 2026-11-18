import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  type Chat,
  type ChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {Array, Option, pipe} from 'effect'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {type TFunction} from '../../../utils/localization/I18nProvider'
import {type ChatMessageWithState} from '../../chat/domain'
import {
  detailsSharedByThem,
  exchangedDetailsForEvent,
  isAnyDetailSelected,
  isResponse,
  revealEventForMessage,
  revealFromMessage,
  type ChatReveals,
} from './exchangeDetails'

export const FRIEND_CHECK_PROMPT_AFTER_MESSAGES = 7

function isTextMessage(message: ChatMessageWithState): boolean {
  return (
    (message.state === 'sent' || message.state === 'received') &&
    message.message.messageType === 'MESSAGE' &&
    !message.message.image
  )
}

// The text message after which the friend check prompt shows up.
export function friendCheckPromptAnchor(
  messages: readonly ChatMessageWithState[]
): Option.Option<ChatMessageWithState> {
  return pipe(
    messages,
    Array.filter(isTextMessage),
    Array.get(FRIEND_CHECK_PROMPT_AFTER_MESSAGES - 1)
  )
}

// What the other side revealed about themselves, as far as a friend can use it.
export interface FriendCheckSubject {
  readonly nickname?: string
  readonly fullPhoneNumber?: E164PhoneNumber
  readonly partialPhoneNumber?: string
}

export function friendCheckSubject(
  chat: Chat
): Option.Option<FriendCheckSubject> {
  const info = chat.otherSide.realLifeInfo
  if (!info || !isAnyDetailSelected(detailsSharedByThem(chat)))
    return Option.none()

  return Option.some({
    nickname: info.userName,
    fullPhoneNumber: info.fullPhoneNumber,
    partialPhoneNumber: info.userName ? info.partialPhoneNumber : undefined,
  })
}

const LAST_DIGITS = /(\d+)\s*$/

export function friendCheckMessage({
  t,
  friend,
  subject,
}: {
  t: TFunction
  friend: string
  subject: FriendCheckSubject
}): string {
  const {nickname, fullPhoneNumber, partialPhoneNumber} = subject
  const lastDigits = partialPhoneNumber?.match(LAST_DIGITS)?.[1]

  if (nickname && fullPhoneNumber)
    return t('tradeChecklist.friendCheck.message.nicknameAndPhoneNumber', {
      friend,
      name: nickname,
      phoneNumber: getInternationalPhoneNumber(fullPhoneNumber),
    })
  if (nickname && lastDigits)
    return t('tradeChecklist.friendCheck.message.nicknameAndLastDigits', {
      friend,
      name: nickname,
      digits: lastDigits,
    })
  if (nickname)
    return t('tradeChecklist.friendCheck.message.nickname', {
      friend,
      name: nickname,
    })
  if (fullPhoneNumber)
    return t('tradeChecklist.friendCheck.message.phoneNumber', {
      friend,
      phoneNumber: getInternationalPhoneNumber(fullPhoneNumber),
    })
  return t('tradeChecklist.friendCheck.message.photo', {friend})
}

// The first reveal in which the other side showed me something.
export function firstRevealOfThem(
  chat: ChatReveals
): Option.Option<ChatMessageId> {
  return pipe(
    chat.messages,
    Array.findFirst((message) => {
      if (!revealFromMessage(message)) return false
      const event = revealEventForMessage(chat, message)
      return (
        !!event &&
        isResponse(event.reveal) &&
        isAnyDetailSelected(exchangedDetailsForEvent(chat, event).theirs)
      )
    }),
    Option.map((message) => message.message.uuid)
  )
}
