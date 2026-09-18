import {
  type RevealStatus,
  type TradeChecklistUpdate,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {type TradeChecklistInState} from '../../tradeChecklist/domain'
import {type ChatWithMessages} from '../domain'
import processTradeChecklistIdentityRevealMessageIfAny from './processTradeChecklistIdentityRevealMessageIfAny'

function approvedReceivedReveal<T extends {status?: RevealStatus}>({
  received,
  requested,
  sent,
}: {
  received?: T
  requested?: T
  sent?: {status?: RevealStatus}
}): T | undefined {
  if (received?.status === 'APPROVE_REVEAL') return received

  return requested?.status === 'REQUEST_REVEAL' &&
    sent?.status === 'APPROVE_REVEAL'
    ? requested
    : undefined
}

export default function addRealLifeInfoToChat(
  chat: ChatWithMessages,
  currentSend?: {
    update: TradeChecklistUpdate
    requested: TradeChecklistInState
  }
): ChatWithMessages {
  const identity = approvedReceivedReveal({
    received: chat.tradeChecklist.identity.received,
    requested: currentSend?.requested.identity.received,
    sent: currentSend?.update.identity,
  })
  const contact = approvedReceivedReveal({
    received: chat.tradeChecklist.contact.received,
    requested: currentSend?.requested.contact.received,
    sent: currentSend?.update.contact,
  })
  const revealedIdentity = processTradeChecklistIdentityRevealMessageIfAny(
    identity,
    chat.chat
  )
  const existingInfo = chat.chat.otherSide.realLifeInfo

  const realLifeInfo = revealedIdentity
    ? {...existingInfo, ...revealedIdentity}
    : existingInfo

  if (!realLifeInfo) return chat

  return {
    ...chat,
    chat: {
      ...chat.chat,
      otherSide: {
        ...chat.chat.otherSide,
        realLifeInfo: {
          ...realLifeInfo,
          ...(contact?.fullPhoneNumber
            ? {fullPhoneNumber: contact.fullPhoneNumber}
            : {}),
        },
      },
    },
  }
}
