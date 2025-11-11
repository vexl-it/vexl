import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import type {TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
import {useAtomValueRefreshOnFocus} from '../../../../../utils/useFocusMemo'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../PageWithNavigationHeader'
import Content from '../../Content'
import Header from '../../Header'
import {checkIsOldDateTimeMessage, convertDateTimesToNewFormat} from '../utils'
import OptionsList, {type Item as OptionItem} from './OptionsList'

function createOptionsFromChosenDays(
  days: AvailableDateTimeOption[]
): Array<OptionItem<AvailableDateTimeOption>> {
  const uniqueDates: AvailableDateTimeOption[] = []
  // TODO: remove this logic once all devices update to new checklist DateTime format
  const isOldChecklistDateTimeMessage = checkIsOldDateTimeMessage(days)

  days.forEach((day) => {
    if (uniqueDates.some((uniqueDay) => uniqueDay.date === day.date)) return

    uniqueDates.push(day)
  })

  const daysOptions = isOldChecklistDateTimeMessage
    ? convertDateTimesToNewFormat(days)
    : days

  return uniqueDates.map((day) => ({
    data: day,
    key: day.date.toString(),
    outdated: day.date < DateTime.now().startOf('day').toMillis(),
    title: unixMillisecondsToLocaleDateTime(day.date).toLocaleString({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    rightText: daysOptions
      .filter((d) => d.date === day.date)
      .map((d) =>
        unixMillisecondsToLocaleDateTime(d.to).toLocaleString(
          DateTime.TIME_SIMPLE
        )
      )
      .join(', '),
  }))
}

type Props = TradeChecklistStackScreenProps<'PickDateFromSuggestions'>

export default function PickDateFromSuggestionsScreen({
  navigation,
  route: {
    params: {chosenDateTimes},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()

  const itemsToShowAtoms = useAtomValueRefreshOnFocus(
    useCallback(
      () => splitAtom(atom(createOptionsFromChosenDays(chosenDateTimes))),
      [chosenDateTimes]
    )
  )

  function onItemPress(pickedOption: AvailableDateTimeOption): void {
    navigation.navigate('PickTimeFromSuggestions', {
      pickedOption,
      chosenDateTimes,
    })
  }

  return (
    <>
      <HeaderProxy
        title={t('tradeChecklist.dateAndTime.screenTitle')}
        onClose={() => {
          navigation.popTo('AgreeOnTradeDetails')
        }}
      />
      <Content>
        <Header title={t('tradeChecklist.dateAndTime.chooseTheDay')} />
        <Stack h="$1" />
        <OptionsList
          showChevron
          onItemPress={onItemPress}
          items={itemsToShowAtoms}
        />
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        onPress={() => {
          navigation.navigate('ChooseAvailableDays', {
            chosenDateTimes,
          })
        }}
        text={t('tradeChecklist.dateAndTime.addDifferentTime')}
      />
    </>
  )
}
