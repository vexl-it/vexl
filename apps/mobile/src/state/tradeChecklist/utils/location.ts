import {type MeetingLocationChatMessage} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import fastDeepEqual from 'fast-deep-equal'
import {type TradeChecklistInState} from '../domain'

type MeetingLocationInState = TradeChecklistInState['location']

function extractLocation({data}: MeetingLocationChatMessage): {
  latitude: number
  longitude: number
} {
  return {latitude: data.latitude, longitude: data.longitude}
}

interface LocationDataToDisplay {
  by: 'me' | 'them'
  locationData: MeetingLocationChatMessage
  status: 'accepted' | 'pending'
}

export function getLatestMeetingLocationDataMessage(
  data: MeetingLocationInState
): LocationDataToDisplay | undefined {
  const sentLocationData = data.sent
  const receivedLocationData = data.received
  const sentTimestamp = data.sent?.timestamp ?? UnixMilliseconds0
  const receivedTimestamp = data.received?.timestamp ?? UnixMilliseconds0

  const status =
    !sentLocationData || !receivedLocationData
      ? 'pending'
      : fastDeepEqual(
            extractLocation(sentLocationData),
            extractLocation(receivedLocationData)
          )
        ? 'accepted'
        : 'pending'

  if (sentTimestamp > receivedTimestamp && sentLocationData) {
    return {
      by: 'me',
      locationData: sentLocationData,
      status,
    }
  }
  if (receivedTimestamp > sentTimestamp && receivedLocationData) {
    return {
      by: 'them',
      locationData: {
        ...receivedLocationData,
      },
      status,
    }
  }

  return undefined
}

export function getSubtitle(data: MeetingLocationInState): string | undefined {
  const latestLocationDataMessage = getLatestMeetingLocationDataMessage(data)
  if (latestLocationDataMessage?.status === 'accepted') {
    return `${latestLocationDataMessage.locationData.data.address}${
      latestLocationDataMessage.locationData.data.note
        ? ` \n${latestLocationDataMessage.locationData.data.note}`
        : ''
    }`
  }

  if (latestLocationDataMessage?.status === 'pending') {
    return `${latestLocationDataMessage.locationData.data.address}${
      latestLocationDataMessage.locationData.data.note
        ? ` \n${latestLocationDataMessage.locationData.data.note}`
        : ''
    }`
  }

  return undefined
}

export function locationSettled(data: MeetingLocationInState): boolean {
  return getLatestMeetingLocationDataMessage(data)?.status === 'accepted'
}

export function locationPending(data: MeetingLocationInState): boolean {
  return getLatestMeetingLocationDataMessage(data)?.status === 'pending'
}
