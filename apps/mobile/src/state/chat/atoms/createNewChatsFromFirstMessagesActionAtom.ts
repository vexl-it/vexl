import {
  generateChatId,
  type Inbox,
} from '@vexl-next/domain/src/general/messaging'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {Array, pipe} from 'effect'
import {group} from 'group-items'
import {atom} from 'jotai'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import notEmpty from '../../../utils/notEmpty'
import {
  clubsWithMembersAtom,
  updateChatsPeakCountStatActionAtom,
} from '../../clubs/atom/clubsWithMembersAtom'
import {createEmptyTradeChecklistInState} from '../../tradeChecklist/domain'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function createNewChatsFromFirstMessagesActionAtom({
  inbox,
  inboxOffer,
}: {
  inbox: Inbox
  inboxOffer?: OneOfferInState
}): (
  messages: ChatMessageWithState[]
) => ActionAtomType<[], ChatWithMessages[]> {
  return (messages) =>
    atom(null, (get, set) => {
      const messagesBySender = group(messages)
        .by((oneMessage) => oneMessage.message.senderPublicKey)
        .asObject()

      const clubsWithMembers = get(clubsWithMembersAtom)

      return pipe(
        keys(messagesBySender),
        Array.map((senderPublicKey): ChatWithMessages | undefined => {
          const messages = messagesBySender[senderPublicKey]
          if (!messages) return undefined

          const lastMessage = messages.at(-1)
          if (!lastMessage) return undefined

          const goldenAvatarType =
            lastMessage.state === 'received' &&
            lastMessage.message.goldenAvatarType
              ? lastMessage.message.goldenAvatarType
              : undefined

          const otherSideVersion =
            lastMessage.state === 'receivedButRequiresNewerVersion' ||
            lastMessage.state === 'received'
              ? lastMessage.message.myVersion
              : undefined
          const lastReportedVersion =
            lastMessage.state === 'sending' ||
            lastMessage.state === 'sendingError' ||
            lastMessage.state === 'sent'
              ? lastMessage.message.myVersion
              : undefined

          const otherSideFcmCypher =
            // If i received the message
            lastMessage.state === 'received' ||
            lastMessage.state === 'receivedButRequiresNewerVersion'
              ? lastMessage.message.myFcmCypher
              : // If the offer is theirs
                !inboxOffer?.ownershipInfo?.adminId
                ? inboxOffer?.offerInfo.publicPart.fcmCypher
                : undefined

          const otherSideClubsids =
            lastMessage.state === 'received' &&
            lastMessage.message.messageType === 'REQUEST_MESSAGING'
              ? pipe(
                  Array.filter(clubsWithMembers, (club) =>
                    Array.contains(club.club.uuid)(
                      lastMessage.message.senderClubsUuids ?? []
                    )
                  ),
                  Array.map((club) => club.club.uuid)
                )
              : []

          const newChat = {
            chat: {
              inbox,
              origin: inbox.offerId
                ? {type: 'myOffer', offerId: inbox.offerId, offer: inboxOffer}
                : {type: 'unknown'},
              otherSide: {
                publicKey: senderPublicKey,
                goldenAvatarType,
                clubsIds: otherSideClubsids,
              },
              id: generateChatId(),
              isUnread: true,
              showInfoBar: true,
              showVexlbotInitialMessage: true,
              showVexlbotNotifications: true,
              otherSideVersion,
              lastReportedVersion,
              otherSideFcmCypher,
            },
            tradeChecklist: {
              ...createEmptyTradeChecklistInState(),
            },
            messages: [...messages],
          } satisfies ChatWithMessages

          set(updateChatsPeakCountStatActionAtom, {chat: newChat.chat})

          return newChat
        }),
        Array.filter(notEmpty)
      )
    })
}
