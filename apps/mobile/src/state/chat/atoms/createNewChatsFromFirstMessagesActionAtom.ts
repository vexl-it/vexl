import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  type ChatOrigin,
  type Inbox,
} from '@vexl-next/domain/src/general/messaging'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {Array, HashSet, Option} from 'effect'
import {pipe} from 'fp-ts/function'
import {group} from 'group-items'
import {atom, type Getter} from 'jotai'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import notEmpty from '../../../utils/notEmpty'
import {
  clubsWithMembersAtom,
  updateChatsPeakCountStatActionAtom,
} from '../../clubs/atom/clubsWithMembersAtom'
import {focusOfferByPublicKeyAtom} from '../../marketplace/atoms/offersState'
import {notesAtom, singleNoteAtom} from '../../notes/atoms/notesState'
import {createEmptyTradeChecklistInState} from '../../tradeChecklist/domain'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {startsChatRecovery} from '../utils/chatRecovery'
import compareMessages from '../utils/compareMessages'
import {isHiddenMetadataMessage} from '../utils/isMetadataMessage'

function getChatOrigin(
  get: Getter,
  {
    inbox,
    inboxOffer,
    otherSidePublicKey,
  }: {
    inbox: Inbox
    inboxOffer?: OneOfferInState
    otherSidePublicKey: PublicKeyPemBase64
  }
): ChatOrigin {
  if (inbox.offerId)
    return {type: 'myOffer', offerId: inbox.offerId, offer: inboxOffer}
  if (inbox.noteId)
    return {
      type: 'myNote',
      noteId: inbox.noteId,
      note: get(singleNoteAtom(inbox.noteId)),
    }

  // Chats recovered after a backup restore may come from requesting the other
  // side's offer or note. Their inbox key is the offer's or note's public key.
  const theirOffer = get(focusOfferByPublicKeyAtom(otherSidePublicKey))
  if (theirOffer)
    return {
      type: 'theirOffer',
      offerId: theirOffer.offerInfo.offerId,
      offer: theirOffer,
    }

  return pipe(
    get(notesAtom),
    Array.findFirst(
      (note) => note.noteInfo.publicPart.notePublicKey === otherSidePublicKey
    ),
    Option.match({
      onNone: (): ChatOrigin => ({type: 'unknown'}),
      onSome: (note): ChatOrigin => ({
        type: 'theirNote',
        noteId: note.noteInfo.noteId,
        note,
      }),
    })
  )
}

function getOriginNotificationToken(
  origin: ChatOrigin
): ChatWithMessages['chat']['otherSideFcmCypher'] {
  if (origin.type === 'theirOffer')
    return origin.offer?.offerInfo.publicPart.vexlNotificationToken
  if (origin.type === 'theirNote')
    return origin.note?.noteInfo.publicPart.vexlNotificationToken
  return undefined
}

export default function createNewChatsFromFirstMessagesActionAtom({
  inbox,
  inboxOffer,
  inboxRestoredFromBackup,
}: {
  inbox: Inbox
  inboxOffer?: OneOfferInState
  inboxRestoredFromBackup?: boolean
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
          const sortedMessages = Array.sort(messages, compareMessages)

          const firstMessage = sortedMessages.at(0)
          const lastMessage = sortedMessages.at(-1)
          if (!firstMessage || !lastMessage) return undefined

          const restoredFromBackup =
            !!inboxRestoredFromBackup && startsChatRecovery(firstMessage)
          const origin = getChatOrigin(get, {
            inbox,
            inboxOffer,
            otherSidePublicKey: senderPublicKey,
          })

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
            (lastMessage.state === 'received' ||
            lastMessage.state === 'receivedButRequiresNewerVersion'
              ? (lastMessage.message.myVexlToken ??
                lastMessage.message.myFcmCypher)
              : // If the offer is theirs
                !inboxOffer?.ownershipInfo?.adminId
                ? (inboxOffer?.offerInfo.publicPart.vexlNotificationToken ??
                  inboxOffer?.offerInfo.publicPart.fcmCypher)
                : undefined) ?? getOriginNotificationToken(origin)

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
              origin,
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
            feedbackSubmitted: false,
            hiddenMessagesIds: HashSet.empty(),
            messages: Array.filter(
              sortedMessages,
              (one) => !isHiddenMetadataMessage(one)
            ),
            restoredFromBackup,
          } satisfies ChatWithMessages

          set(updateChatsPeakCountStatActionAtom, {chat: newChat.chat})

          return newChat
        }),
        Array.filter(notEmpty)
      )
    })
}
