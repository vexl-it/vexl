import {type IdentityReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type TradeChecklistInState} from '../domain'

type ContactInState = TradeChecklistInState['contact']

export function getContactData(data: ContactInState):
  | {
      by: 'me' | 'them'
      contact: IdentityReveal
    }
  | undefined {
  const sentContact = data?.sent
  const receivedContact = data?.received
  const sentTimestamp = data?.sent?.timestamp ?? UnixMilliseconds0
  const receivedTimestamp = data?.received?.timestamp ?? UnixMilliseconds0

  if (sentTimestamp > receivedTimestamp && sentContact && receivedContact) {
    return {
      by: 'me',
      contact: {...receivedContact, status: sentContact.status},
    }
  }

  if (sentTimestamp > receivedTimestamp && sentContact) {
    return {by: 'me', contact: sentContact}
  }
  if (receivedTimestamp > sentTimestamp && receivedContact) {
    return {by: 'them', contact: receivedContact}
  }

  return undefined
}

export function contactRevealed(data: ContactInState): boolean {
  return (
    data.sent?.status === 'APPROVE_REVEAL' ||
    data.received?.status === 'APPROVE_REVEAL'
  )
}
