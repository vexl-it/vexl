import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Calendar, ChecklistCell} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import {DateTime} from 'luxon'
import React, {useCallback, useMemo} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {tradeChecklistDateAndTimeDataAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import * as DateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {
  dateAndTimePickUpdateToBeSentAtom,
  tradeChecklistWithUpdatesMergedAtom,
} from '../../../atoms/updatesToBeSentAtom'
import mapTradeChecklistItemStatusToUiState from './mapTradeChecklistItemStatusToUiState'

function formatDateTime(millis: UnixMilliseconds): string {
  return unixMillisecondsToLocaleDateTime(millis).toLocaleString(
    DateTime.DATETIME_SHORT
  )
}

function DateAndTimeCell(): React.ReactElement {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const nextChecklistData = useAtomValue(tradeChecklistWithUpdatesMergedAtom)

  const tradeChecklistDateAndTimeData = useAtomValue(
    tradeChecklistDateAndTimeDataAtom
  )
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('DATE_AND_TIME'), [])
  )
  const dateAndTimePickUpdateToBeSent = useAtomValue(
    dateAndTimePickUpdateToBeSentAtom
  )

  const subtitle = tradeChecklistDateAndTimeData.received?.picks?.dateTime
    ? formatDateTime(tradeChecklistDateAndTimeData.received.picks.dateTime)
    : tradeChecklistDateAndTimeData.sent?.picks?.dateTime
      ? formatDateTime(tradeChecklistDateAndTimeData.sent.picks.dateTime)
      : dateAndTimePickUpdateToBeSent
        ? formatDateTime(dateAndTimePickUpdateToBeSent)
        : undefined

  const onPress = useCallback(() => {
    if (DateAndTime.dateAndTimeSettled(tradeChecklistDateAndTimeData)) {
      navigation.navigate('ChooseAvailableDays', {
        chosenDateTimes: tradeChecklistDateAndTimeData.sent?.suggestions,
      })
      return
    }

    const receivedSuggestions =
      tradeChecklistDateAndTimeData.received?.suggestions
    if (receivedSuggestions && receivedSuggestions.length > 0) {
      navigation.navigate('PickDateFromSuggestions', {
        chosenDateTimes: receivedSuggestions,
      })
    } else {
      navigation.navigate('ChooseAvailableDays', {
        chosenDateTimes: tradeChecklistDateAndTimeData.sent?.suggestions,
      })
    }
  }, [navigation, tradeChecklistDateAndTimeData])

  const suggestionsSubtitle = useMemo(() => {
    const suggestions = DateAndTime.getSuggestions(
      nextChecklistData.dateAndTime
    )

    if (suggestions)
      return `${t(
        suggestions.by === 'me'
          ? 'tradeChecklist.optionsDetail.DATE_AND_TIME.youAddedTimeOptions'
          : 'tradeChecklist.optionsDetail.DATE_AND_TIME.themAddedTimeOptions',
        {
          them: t('common.otherSide'),
          number: suggestions.suggestions.length,
        }
      )}`
  }, [nextChecklistData.dateAndTime, t])

  return (
    <ChecklistCell
      icon={Calendar}
      state={mapTradeChecklistItemStatusToUiState(itemStatus)}
      pressable
      onPress={onPress}
      subtitle={subtitle ?? suggestionsSubtitle}
      headline="Select date and time"
    />
  )
}

export default DateAndTimeCell
