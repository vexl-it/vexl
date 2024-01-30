import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useAtomValue} from 'jotai'
import {DateTime} from 'luxon'
import {useCallback, useMemo} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {
  otherSideDataAtom,
  tradeChecklistDateAndTimeDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import * as DateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import {
  dateAndTimePickUpdateToBeSentAtom,
  tradeChecklistWithUpdatesMergedAtom,
} from '../../../atoms/updatesToBeSentAtom'
import ChecklistCell from './ChecklistCell'

function formatDateTime(millis: UnixMilliseconds): string {
  return DateTime.fromMillis(Number(millis))
    .setLocale(getCurrentLocale())
    .toLocaleString(DateTime.DATETIME_SHORT)
}

function DateAndTimeCell(): JSX.Element {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const nextChecklistData = useAtomValue(tradeChecklistWithUpdatesMergedAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)

  const tradeChecklistDateAndTimeData = useAtomValue(
    tradeChecklistDateAndTimeDataAtom
  )
  const dateAndTimePickUpdateToBeSent = useAtomValue(
    dateAndTimePickUpdateToBeSentAtom
  )

  const sideNote = tradeChecklistDateAndTimeData.received?.picks?.dateTime
    ? formatDateTime(tradeChecklistDateAndTimeData.received.picks.dateTime)
    : tradeChecklistDateAndTimeData.sent?.picks?.dateTime
    ? formatDateTime(tradeChecklistDateAndTimeData.sent.picks.dateTime)
    : dateAndTimePickUpdateToBeSent
    ? formatDateTime(dateAndTimePickUpdateToBeSent)
    : undefined

  const onPress = useCallback(() => {
    if (DateAndTime.dateAndTimeSettled(tradeChecklistDateAndTimeData)) {
      navigation.navigate('ChooseAvailableDays', {
        chosenDays: tradeChecklistDateAndTimeData.sent?.suggestions,
      })
      return
    }

    const receivedSuggestions =
      tradeChecklistDateAndTimeData.received?.suggestions
    if (receivedSuggestions && receivedSuggestions.length > 0) {
      navigation.navigate('PickDateFromSuggestions', {
        chosenDays: receivedSuggestions,
      })
    } else {
      navigation.navigate('ChooseAvailableDays', {
        chosenDays: tradeChecklistDateAndTimeData.sent?.suggestions,
      })
    }
  }, [navigation, tradeChecklistDateAndTimeData])

  const subtitle = useMemo(() => {
    const suggestions = DateAndTime.getSuggestions(
      nextChecklistData.dateAndTime
    )

    if (suggestions)
      return `${t(
        suggestions.by === 'me'
          ? 'tradeChecklist.optionsDetail.DATE_AND_TIME.youAddedTimeOptions'
          : 'tradeChecklist.optionsDetail.DATE_AND_TIME.themAddedTimeOptions',
        {
          them: otherSideData.userName,
          number: suggestions.suggestions.length,
        }
      )}`
  }, [nextChecklistData.dateAndTime, otherSideData.userName, t])

  return (
    <ChecklistCell
      item="DATE_AND_TIME"
      onPress={onPress}
      subtitle={subtitle}
      sideNote={sideNote}
    />
  )
}

export default DateAndTimeCell
