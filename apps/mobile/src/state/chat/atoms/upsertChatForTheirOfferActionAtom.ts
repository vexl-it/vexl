import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  type Inbox,
} from '@vexl-next/domain/src/general/messaging'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {flow} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import * as O from 'optics-ts'
import {createEmptyTradeChecklistInState} from '../../tradeChecklist/domain'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type MessagingState,
} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import {type MyFcmTokenInfo} from './../../../../../../packages/domain/src/general/messaging'
import focusChatForTheirOfferAtom from './focusChatForTheirOfferAtom'
import {updateMyFcmTokenInfoInChat} from './generateMyFcmTokenInfoActionAtom'
import messagingStateAtom from './messagingStateAtom'

function createNewChat({
  inbox,
  initialMessage,
  sentFcmTokenInfo,
  offer,
}: {
  inbox: Inbox
  initialMessage: ChatMessageWithState
  sentFcmTokenInfo?: MyFcmTokenInfo
  offer: OneOfferInState
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

  return {
    chat: {
      id: generateChatId(),
      inbox,
      origin: {type: 'theirOffer', offerId: offer.offerInfo.offerId, offer},
      otherSide: {
        publicKey: offer.offerInfo.publicPart.offerPublicKey,
      },
      isUnread: false,
      showInfoBar: true,
      lastReportedFcmToken: sentFcmTokenInfo,
      showVexlbotInitialMessage: true,
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
      sentFcmTokenInfo,
      offer,
    }: {
      inbox: Inbox
      initialMessage: ChatMessageWithState
      sentFcmTokenInfo?: MyFcmTokenInfo
      offer: OneOfferInState
    }
  ) => {
    const existingChatAtom = focusChatForTheirOfferAtom({
      inbox,
      offerInfo: offer.offerInfo,
    })
    const existingChat = get(existingChatAtom)

    if (existingChat) {
      set(
        existingChatAtom,
        flow(
          addMessageToChat(initialMessage),
          updateMyFcmTokenInfoInChat(sentFcmTokenInfo)
        )
      )
      return existingChat.chat
    } else {
      const newChat = createNewChat({
        inbox,
        initialMessage,
        offer,
        sentFcmTokenInfo,
      })
      set(messagingStateAtom, (old) =>
        O.set(
          focusPrependChatToInbox(
            newChat.chat.inbox.privateKey.publicKeyPemBase64
          )
        )(newChat)(old)
      )
      return newChat.chat
    }
  }
)

export default upsertChatForTheirOfferActionAtom
