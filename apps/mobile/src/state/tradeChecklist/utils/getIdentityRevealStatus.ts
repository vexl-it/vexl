import {type RevealStatus} from '@vexl-next/domain/src/general/tradeChecklist'
import {type ChatMessageWithState} from '../../chat/domain'
import {type TradeChecklistInState} from '../domain'

export type IdentityRevealStatus =
  | 'shared'
  | 'denied'
  | 'iAsked'
  | 'theyAsked'
  | 'notStarted'

interface IdentityRevealEvent {
  status: IdentityRevealStatus
  timestamp: number
}

function statusFromRevealStatus({
  status,
  direction,
}: {
  status: RevealStatus
  direction: 'sent' | 'received'
}): IdentityRevealStatus {
  switch (status) {
    case 'APPROVE_REVEAL':
      return 'shared'
    case 'DISAPPROVE_REVEAL':
      return 'denied'
    case 'REQUEST_REVEAL':
      return direction === 'received' ? 'theyAsked' : 'iAsked'
  }
}

function newerEvent(
  current: IdentityRevealEvent | undefined,
  next: IdentityRevealEvent | undefined
): IdentityRevealEvent | undefined {
  if (!current) return next
  if (!next) return current
  return next.timestamp > current.timestamp ? next : current
}

function eventFromMessage(
  message: ChatMessageWithState
): IdentityRevealEvent | undefined {
  if (message.state !== 'sent' && message.state !== 'received') {
    return undefined
  }

  const tradeChecklistIdentity =
    message.message.messageType === 'TRADE_CHECKLIST_UPDATE'
      ? message.message.tradeChecklistUpdate?.identity
      : undefined

  if (tradeChecklistIdentity?.status) {
    return {
      status: statusFromRevealStatus({
        status: tradeChecklistIdentity.status,
        direction: message.state,
      }),
      timestamp: tradeChecklistIdentity.timestamp,
    }
  }

  switch (message.message.messageType) {
    case 'APPROVE_REVEAL':
      return {status: 'shared', timestamp: message.message.time}
    case 'DISAPPROVE_REVEAL':
      return {status: 'denied', timestamp: message.message.time}
    case 'REQUEST_REVEAL':
      return {
        status: message.state === 'received' ? 'theyAsked' : 'iAsked',
        timestamp: message.message.time,
      }
    default:
      return undefined
  }
}

function latestEventFromMessages(
  messages: ChatMessageWithState[]
): IdentityRevealEvent | undefined {
  let latestEvent: IdentityRevealEvent | undefined

  for (const message of messages) {
    latestEvent = newerEvent(latestEvent, eventFromMessage(message))
  }

  return latestEvent
}

function eventFromTradeChecklist(
  tradeChecklist: TradeChecklistInState
): IdentityRevealEvent | undefined {
  const {sent, received} = tradeChecklist.identity

  if (sent?.status && received?.status) {
    return sent.timestamp > received.timestamp
      ? {
          status: statusFromRevealStatus({
            status: sent.status,
            direction: 'sent',
          }),
          timestamp: sent.timestamp,
        }
      : {
          status: statusFromRevealStatus({
            status: received.status,
            direction: 'received',
          }),
          timestamp: received.timestamp,
        }
  }

  if (received?.status) {
    return {
      status: statusFromRevealStatus({
        status: received.status,
        direction: 'received',
      }),
      timestamp: received.timestamp,
    }
  }

  if (sent?.status) {
    return {
      status: statusFromRevealStatus({status: sent.status, direction: 'sent'}),
      timestamp: sent.timestamp,
    }
  }

  return undefined
}

export default function getIdentityRevealStatus({
  messages,
  tradeChecklist,
}: {
  messages: ChatMessageWithState[]
  tradeChecklist: TradeChecklistInState
}): IdentityRevealStatus {
  return (
    newerEvent(
      latestEventFromMessages(messages),
      eventFromTradeChecklist(tradeChecklist)
    )?.status ?? 'notStarted'
  )
}
