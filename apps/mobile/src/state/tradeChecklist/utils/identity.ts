import {type IdentityReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type TradeChecklistInState} from '../domain'

type IdentityInState = TradeChecklistInState['identity']

export function getIdentityData(data: IdentityInState):
  | {
      by: 'me' | 'them'
      identity: IdentityReveal
    }
  | undefined {
  const sentIdentity = data.sent
  const receivedIdentity = data.received
  const sentTimestamp = data.sent?.timestamp ?? UnixMilliseconds0
  const receivedTimestamp = data.received?.timestamp ?? UnixMilliseconds0

  if (sentTimestamp > receivedTimestamp && sentIdentity && receivedIdentity) {
    return {
      by: 'me',
      identity: {...receivedIdentity, status: sentIdentity.status},
    }
  }

  if (sentTimestamp > receivedTimestamp && sentIdentity) {
    return {by: 'me', identity: sentIdentity}
  }

  if (receivedTimestamp > sentTimestamp && receivedIdentity) {
    return {by: 'them', identity: receivedIdentity}
  }

  return undefined
}
