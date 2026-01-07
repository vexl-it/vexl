import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  type Inbox,
} from '@vexl-next/domain/src/general/messaging'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {flow} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import * as O from 'optics-ts'
import {
  clubsWithMembersAtom,
  updateChatsPeakCountStatActionAtom,
} from '../../clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../../clubs/domain'
import {createEmptyTradeChecklistInState} from '../../tradeChecklist/domain'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type MessagingState,
} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import focusChatForTheirOfferAtom from './focusChatForTheirOfferAtom'
import {updateMyNotificationTokenInfoInChat} from './generateMyNotificationTokenInfoActionAtom'
import messagingStateAtom from './messagingStateAtom'

function createNewChat({
  inbox,
  initialMessage,
  sentVexlToken,
  offer,
  clubsWithMembers,
}: {
  inbox: Inbox
  initialMessage: ChatMessageWithState
  sentVexlToken?: VexlNotificationToken
  offer: OneOfferInState
  clubsWithMembers: ClubWithMembers[]
}): ChatWithMessages {
  const otherSideVersion =
    initialMessage.state === 'receivedButRequiresNewerVersion' ||
    initialMessage.state === 'received'
      ? initialMessage.message.myVersion
      : offer.offerInfo.publicPart.authorClientVersion

  const lastReportedVersion =
    initialMessage.state === 'sending' ||
    initialMessage.state === 'sendingError' ||
    initialMessage.state === 'sent'
      ? initialMessage.message.myVersion
      : undefined

  const clubsIds = pipe(
    clubsWithMembers,
    Array.filter((club) =>
      Array.contains(club.club.uuid)(offer.offerInfo.privatePart.clubIds)
    ),
    Array.map((club) => club.club.uuid)
  )

  return {
    chat: {
      id: generateChatId(),
      inbox,
      origin: {type: 'theirOffer', offerId: offer.offerInfo.offerId, offer},
      otherSide: {
        publicKey: offer.offerInfo.publicPart.offerPublicKey,
        clubsIds,
      },
      isUnread: false,
      showInfoBar: true,
      showVexlbotInitialMessage: true,
      otherSideVexlToken: offer.offerInfo.publicPart.vexlNotificationToken,
      otherSideFcmCypher:
        offer.offerInfo.publicPart.vexlNotificationToken ??
        offer.offerInfo.publicPart.fcmCypher,
      lastReportedVexlToken: sentVexlToken,
      showVexlbotNotifications: true,
      lastReportedVersion,
      otherSideVersion,
    },
    tradeChecklist: {
      ...createEmptyTradeChecklistInState(),
    },
    messages: [initialMessage],
  } satisfies ChatWithMessages
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function focusPrependChatToInbox(publicKey: PublicKeyPemBase64) {
  return O.optic<MessagingState>()
    .find((o) => o.inbox.privateKey.publicKeyPemBase64 === publicKey)
    .prop('chats')
    .prependTo()
}

const upsertChatForTheirOfferActionAtom = atom(
  null,
  (
    get,
    set,
    {
      inbox,
      initialMessage,
      sentVexlNotificationToken,
      offer,
    }: {
      inbox: Inbox
      initialMessage: ChatMessageWithState
      sentVexlNotificationToken?: VexlNotificationToken
      offer: OneOfferInState
    }
  ) => {
    const existingChatAtom = focusChatForTheirOfferAtom({
      inbox,
      offerInfo: offer.offerInfo,
    })
    const existingChat = get(existingChatAtom)
    const clubsWithMembers = get(clubsWithMembersAtom)

    if (existingChat) {
      set(
        existingChatAtom,
        flow(
          addMessageToChat(initialMessage),
          updateMyNotificationTokenInfoInChat(sentVexlNotificationToken)
        )
      )
      return existingChat.chat
    } else {
      const newChat = createNewChat({
        inbox,
        initialMessage,
        offer,
        sentVexlToken: sentVexlNotificationToken,
        clubsWithMembers,
      })
      set(messagingStateAtom, (old) =>
        O.set(
          focusPrependChatToInbox(
            newChat.chat.inbox.privateKey.publicKeyPemBase64
          )
        )(newChat)(old)
      )

      set(updateChatsPeakCountStatActionAtom, {chat: newChat.chat})

      return newChat.chat
    }
  }
)

export default upsertChatForTheirOfferActionAtom
