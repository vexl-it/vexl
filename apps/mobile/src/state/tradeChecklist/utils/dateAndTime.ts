import {
  type AvailableDateTimeOption,
  type PickedDateTimeOption,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  type UnixMilliseconds,
  UnixMilliseconds0,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {DateTime} from 'luxon'
import {getCurrentLocale} from '../../../utils/localization/I18nProvider'
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

  // Picks needs to be send after suggestions
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
  return DateTime.fromMillis(unixMilliseconds)
    .setLocale(getCurrentLocale())
    .toLocaleString({
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
}

export function toStringWithRange(suggestion: AvailableDateTimeOption): string {
  const from = DateTime.fromMillis(suggestion.from).setLocale(
    getCurrentLocale()
  )
  const to = DateTime.fromMillis(suggestion.to).setLocale(getCurrentLocale())
  const date = DateTime.fromMillis(suggestion.date).setLocale(
    getCurrentLocale()
  )

  return `${date.toLocaleString({
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
  })} ${from.toLocaleString(DateTime.TIME_SIMPLE)} - ${to.toLocaleString(
    DateTime.TIME_SIMPLE
  )}`
}
