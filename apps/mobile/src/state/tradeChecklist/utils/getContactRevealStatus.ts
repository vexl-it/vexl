import {type RevealStatus} from '@vexl-next/domain/src/general/tradeChecklist'
import {type ChatMessageWithState} from '../../chat/domain'
import {type TradeChecklistInState} from '../domain'

export type ContactRevealStatus =
  | 'shared'
  | 'denied'
  | 'iAsked'
  | 'theyAsked'
  | 'notStarted'

interface ContactRevealEvent {
  status: RevealStatus
  direction: 'sent' | 'received'
  timestamp: number
}

function newerEvent(
  current: ContactRevealEvent | undefined,
  next: ContactRevealEvent | undefined
): ContactRevealEvent | undefined {
  if (!current) return next
  if (!next) return current
  return next.timestamp > current.timestamp ? next : current
}

function statusFromEvent({
  event,
  bothSharedPhones,
}: {
  event: ContactRevealEvent
  bothSharedPhones: boolean
}): ContactRevealStatus {
  switch (event.status) {
    case 'APPROVE_REVEAL':
      return bothSharedPhones
        ? 'shared'
        : event.direction === 'received'
          ? 'theyAsked'
          : 'iAsked'
    case 'DISAPPROVE_REVEAL':
      return 'denied'
    case 'REQUEST_REVEAL':
      return event.direction === 'received' ? 'theyAsked' : 'iAsked'
  }
}

function eventFromMessage(
  message: ChatMessageWithState
): ContactRevealEvent | undefined {
  if (message.state !== 'sent' && message.state !== 'received') {
    return undefined
  }

  const tradeChecklistContact =
    message.message.messageType === 'TRADE_CHECKLIST_UPDATE'
      ? message.message.tradeChecklistUpdate?.contact
      : undefined

  if (tradeChecklistContact?.status) {
    return {
      status: tradeChecklistContact.status,
      direction: message.state,
      timestamp: tradeChecklistContact.timestamp,
    }
  }

  switch (message.message.messageType) {
    case 'APPROVE_CONTACT_REVEAL':
      return {
        status: 'APPROVE_REVEAL',
        direction: message.state,
        timestamp: message.message.time,
      }
    case 'DISAPPROVE_CONTACT_REVEAL':
      return {
        status: 'DISAPPROVE_REVEAL',
        direction: message.state,
        timestamp: message.message.time,
      }
    case 'REQUEST_CONTACT_REVEAL':
      return {
        status: 'REQUEST_REVEAL',
        direction: message.state,
        timestamp: message.message.time,
      }
    default:
      return undefined
  }
}

function latestEventFromMessages(
  messages: ChatMessageWithState[]
): ContactRevealEvent | undefined {
  let latestEvent: ContactRevealEvent | undefined

  for (const message of messages) {
    latestEvent = newerEvent(latestEvent, eventFromMessage(message))
  }

  return latestEvent
}

function eventFromTradeChecklist(
  tradeChecklist: TradeChecklistInState
): ContactRevealEvent | undefined {
  const {sent, received} = tradeChecklist.contact

  if (sent?.status && received?.status) {
    return sent.timestamp > received.timestamp
      ? {
          status: sent.status,
          direction: 'sent',
          timestamp: sent.timestamp,
        }
      : {
          status: received.status,
          direction: 'received',
          timestamp: received.timestamp,
        }
  }

  if (received?.status) {
    return {
      status: received.status,
      direction: 'received',
      timestamp: received.timestamp,
    }
  }

  if (sent?.status) {
    return {
      status: sent.status,
      direction: 'sent',
      timestamp: sent.timestamp,
    }
  }

  return undefined
}

export default function getContactRevealStatus({
  messages,
  tradeChecklist,
}: {
  messages: ChatMessageWithState[]
  tradeChecklist: TradeChecklistInState
}): ContactRevealStatus {
  const latestEvent = newerEvent(
    latestEventFromMessages(messages),
    eventFromTradeChecklist(tradeChecklist)
  )

  if (!latestEvent) return 'notStarted'

  return statusFromEvent({
    event: latestEvent,
    bothSharedPhones:
      !!tradeChecklist.contact.sent?.fullPhoneNumber &&
      !!tradeChecklist.contact.received?.fullPhoneNumber,
  })
}
