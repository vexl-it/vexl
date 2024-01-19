import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {type TradeChecklistInState} from './domain'

export function updateTradeChecklistState(
  state: TradeChecklistInState
): (args: {
  update: TradeChecklistUpdate
  direction: 'sent' | 'received'
}) => TradeChecklistInState {
  return ({
    update,
    direction,
  }: {
    update: TradeChecklistUpdate
    direction: 'sent' | 'received'
  }) => ({
    dateAndTime: {
      sent:
        (direction === 'sent' ? update.dateAndTime : state.dateAndTime.sent) ??
        state.dateAndTime.sent,
      received:
        (direction === 'received'
          ? update.dateAndTime
          : state.dateAndTime.received) ?? state.dateAndTime.received,
    },
    location: {
      sent:
        (direction === 'sent' ? update.location : state.location.sent) ??
        state.location.sent,
      received:
        (direction === 'received'
          ? update.location
          : state.location.received) ?? state.location.received,
    },
    amount: {
      sent:
        (direction === 'sent' ? update.amount : state.amount.sent) ??
        state.amount.sent,
      received:
        (direction === 'received' ? update.amount : state.amount.received) ??
        state.amount.received,
    },
    network: {
      sent:
        (direction === 'sent' ? update.network : state.network.sent) ??
        state.network.sent,
      received:
        (direction === 'received' ? update.network : state.network.received) ??
        state.network.received,
    },
    identity: {
      sent:
        (direction === 'sent' ? update.identity : state.identity.sent) ??
        state.identity.sent,
      received:
        (direction === 'received'
          ? update.identity
          : state.identity.received) ?? state.identity.received,
    },
    contact: {
      sent:
        (direction === 'sent' ? update.contact : state.contact?.sent) ??
        state.contact?.sent,
      received:
        (direction === 'received' ? update.contact : state.contact?.received) ??
        state.contact?.received,
    },
  })
}
