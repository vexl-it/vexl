import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array} from 'effect'
import {
  type ChatMessageWithState,
  type InboxInState,
} from '../../state/chat/domain'
import {analyticsActionAtom} from './analyticsActionAtom'
import {messageTimes} from './chatMessages'
import {reportOfferRequestsReceivedActionAtom} from './offer'
import {reportRequestChatUpdatedActionAtom} from './request'

/** `offer` is the offer of the inbox when the inbox is one of my offers. */
export const reportInboxMessagesActionAtom = analyticsActionAtom(
  (
    get,
    set,
    {
      inbox,
      newMessages,
      offer,
    }: {
      inbox: InboxInState
      newMessages: readonly ChatMessageWithState[]
      offer: OneOfferInState | undefined
    }
  ) => {
    if (offer)
      set(reportOfferRequestsReceivedActionAtom, {
        offerId: offer.offerInfo.offerId,
        chats: inbox.chats,
        newRequestTimes: messageTimes(
          newMessages,
          'received',
          'REQUEST_MESSAGING'
        ),
      })

    Array.forEach(inbox.chats, (chat) => {
      if (chat.chat.origin.type !== 'theirOffer') return
      const chatMessages = Array.filter(
        newMessages,
        (one) => one.message.senderPublicKey === chat.chat.otherSide.publicKey
      )
      if (Array.isNonEmptyArray(chatMessages))
        set(reportRequestChatUpdatedActionAtom, {
          chat,
          newMessages: chatMessages,
        })
    })
  }
)
