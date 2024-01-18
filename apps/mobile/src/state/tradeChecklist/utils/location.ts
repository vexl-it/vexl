import fastDeepEqual from 'fast-deep-equal'
import {type TradeChecklistInState} from '../domain'
import {type MeetingLocationChatMessage} from '@vexl-next/domain/src/general/tradeChecklist'

type MeetingLocationInState = TradeChecklistInState['location']

function extractLocation({data}: MeetingLocationChatMessage): {
  latitude: number
  longitude: number
} {
  return {latitude: data.latitude, longitude: data.longitude}
}

export function getAgreed(data: MeetingLocationInState):
  | {
      by: 'me' | 'them'
      data: MeetingLocationChatMessage
    }
  | undefined {
  if (!data.received || !data.sent) return

  if (
    fastDeepEqual(extractLocation(data.received), extractLocation(data.sent))
  ) {
    return {
      by: data.received.timestamp > data.sent.timestamp ? 'me' : 'them',
      data: data.sent,
    }
  }
  return undefined
}

export function getPendingSuggestion(data: MeetingLocationInState):
  | {
      by: 'me' | 'them'
      data: MeetingLocationChatMessage
    }
  | undefined {
  if (data.received && data.sent) {
    // Was agreed
    if (
      fastDeepEqual(extractLocation(data.received), extractLocation(data.sent))
    )
      return undefined
    if (data.received.timestamp > data.sent.timestamp)
      return {
        by: 'them',
        data: data.received,
      }
    return {data: data.sent, by: 'me'}
  }

  if (data.received) return {data: data.received, by: 'them'}
  if (data.sent) return {data: data.sent, by: 'me'}
  return undefined
}

export function getSubtitle(data: MeetingLocationInState): string | undefined {
  const agreed = getAgreed(data)
  if (agreed) {
    return `${agreed.data.data.address}${
      agreed.data.data.note ? ` \n${agreed.data.data.note}` : ''
    }`
  }

  const pending = getPendingSuggestion(data)
  if (pending) {
    return `${pending.data.data.address}${
      pending.data.data.note ? ` \n${pending.data.data.note}` : ''
    }`
  }

  return undefined
}
