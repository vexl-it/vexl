import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {
  type FriendLevel,
  type OfferInfo,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe} from 'effect'
import {type ChatWithMessages} from '../../state/chat/domain'
import {type TFunction} from '../localization/I18nProvider'

interface GetOtherSideFriendLevelParams {
  friendLevel?: readonly FriendLevel[]
  offerInfo?: OfferInfo
  note?: OneNoteInState
  chat?: Chat | ChatWithMessages
  t: TFunction
}

function getFriendLevelFromRequestMessage(
  chat?: Chat | ChatWithMessages
): readonly FriendLevel[] | undefined {
  if (!chat || !('messages' in chat)) return undefined
  if (
    chat?.chat.origin.type !== 'myOffer' &&
    chat?.chat.origin.type !== 'myNote'
  )
    return undefined

  return pipe(
    chat.messages,
    // Find the last message since we can get multiple requests in the same chat and we want to use the most recent one to determine the friend level
    Array.findLast(
      (message) =>
        message.state === 'received' &&
        message.message.messageType === 'REQUEST_MESSAGING'
    ),
    Option.map((message) => message.message.friendLevel),
    Option.getOrUndefined
  )
}

export function getOtherSideFriendLevel({
  friendLevel,
  offerInfo,
  note,
  chat,
  t,
}: GetOtherSideFriendLevelParams): string | undefined {
  const friendLevelToUse =
    friendLevel ??
    getFriendLevelFromRequestMessage(chat) ??
    offerInfo?.privatePart.friendLevel ??
    note?.noteInfo.privatePart.friendLevel

  if (!friendLevelToUse) return undefined

  if (friendLevelToUse.includes('FIRST_DEGREE')) return t('offer.directFriend')
  if (friendLevelToUse.includes('SECOND_DEGREE'))
    return t('offer.friendOfFriend')
  if (friendLevelToUse.includes('CLUB')) return t('offer.clubMember')

  // NOT_SPECIFIED (e.g. reposted notes) - let callers fall back to a name.
  return undefined
}

function getChat(chat: Chat | ChatWithMessages): Chat {
  return 'chat' in chat ? chat.chat : chat
}

export function getOtherSideRealNameOrFriendLevel(
  params: GetOtherSideFriendLevelParams
): string | undefined {
  return (
    (params.chat
      ? getChat(params.chat).otherSide.realLifeInfo?.userName
      : undefined) ?? getOtherSideFriendLevel(params)
  )
}
