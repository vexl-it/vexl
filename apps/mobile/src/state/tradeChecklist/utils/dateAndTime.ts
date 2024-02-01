import {
  type AvailableDateTimeOption,
  type PickedDateTimeOption,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  UnixMilliseconds0,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {DateTime} from 'luxon'
import unixMillisecondsToLocaleDateTime from '../../../utils/unixMillisecondsToLocaleDateTime'
import {type TradeChecklistInState} from '../domain'

type DateAndTimeInState = TradeChecklistInState['dateAndTime']

export function getPick(
  data: DateAndTimeInState
): {by: 'me' | 'them'; pick: PickedDateTimeOption} | undefined {
  // For pick to be valid. There always need to be suggestions sent before
  if (!data.sent || !data.received) return undefined

  const sentPick = data.sent?.picks
  const receivedPick = data.received?.picks
  const sentSuggestions = data.sent?.suggestions
  const receivedSuggestions = data.received?.suggestions
  const sentTimestamp = data.sent.timestamp
  const receivedTimestamp = data.received.timestamp

  // Picks needs to be sent after suggestions
  if (sentTimestamp > receivedTimestamp && receivedSuggestions && sentPick) {
    const sentPickIsInSuggestions = receivedSuggestions.some(
      ({from, to}) => from <= sentPick.dateTime && sentPick.dateTime <= to
    )
    if (sentPickIsInSuggestions) {
      return {by: 'me', pick: sentPick}
    }
    return undefined
  }

  if (receivedTimestamp > sentTimestamp && sentSuggestions && receivedPick) {
    const receivedPickIsInSuggestions = sentSuggestions.some(
      ({from, to}) =>
        from <= receivedPick.dateTime && receivedPick.dateTime <= to
    )
    if (receivedPickIsInSuggestions) {
      return {by: 'them', pick: receivedPick}
    }
    return undefined
  }
}

export function getSuggestions(data: DateAndTimeInState):
  | {
      by: 'me' | 'them'
      suggestions: AvailableDateTimeOption[]
    }
  | undefined {
  const sentSuggestions = data.sent?.suggestions
  const receivedSuggestions = data.received?.suggestions
  const sentTimestamp = data.sent?.timestamp ?? UnixMilliseconds0
  const receivedTimestamp = data.received?.timestamp ?? UnixMilliseconds0

  if (sentTimestamp > receivedTimestamp && sentSuggestions) {
    return {by: 'me', suggestions: sentSuggestions}
  }
  if (receivedTimestamp > sentTimestamp && receivedSuggestions) {
    return {by: 'them', suggestions: receivedSuggestions}
  }

  return undefined
}

export function toStringWithTime(unixMilliseconds: UnixMilliseconds): string {
  return unixMillisecondsToLocaleDateTime(unixMilliseconds).toLocaleString({
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
}

export function toStringWithRange(suggestion: AvailableDateTimeOption): string {
  const from = unixMillisecondsToLocaleDateTime(suggestion.from)
  const to = unixMillisecondsToLocaleDateTime(suggestion.to)
  const date = unixMillisecondsToLocaleDateTime(suggestion.date)

  return `${date.toLocaleString({
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
  })} ${from.toLocaleString(DateTime.TIME_SIMPLE)} - ${to.toLocaleString(
    DateTime.TIME_SIMPLE
  )}`
}

export function dateAndTimeSettled(data: DateAndTimeInState): boolean {
  return !!getPick(data)
}

export function dateAndTimePending(data: DateAndTimeInState): boolean {
  return !!getSuggestions(data)
}
