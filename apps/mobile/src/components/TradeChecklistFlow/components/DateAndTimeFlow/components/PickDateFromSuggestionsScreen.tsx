import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import {useCallback} from 'react'
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
import OptionsList, {type Item as OptionItem} from './OptionsList'

function createOptionsFromChosenDays(
  days: AvailableDateTimeOption[]
): Array<OptionItem<AvailableDateTimeOption>> {
  return days.map((day) => ({
    data: day,
    key: day.date.toString(),
    title: unixMillisecondsToLocaleDateTime(day.date).toLocaleString({
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    }),
    rightText: `${unixMillisecondsToLocaleDateTime(day.from).toLocaleString(
      DateTime.TIME_SIMPLE
    )} - ${unixMillisecondsToLocaleDateTime(day.to).toLocaleString(
      DateTime.TIME_SIMPLE
    )}`,
  }))
}

type Props = TradeChecklistStackScreenProps<'PickDateFromSuggestions'>

export default function PickDateFromSuggestionsScreen({
  navigation,
  route: {
    params: {chosenDays},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()

  const itemsToShowAtoms = useAtomValueRefreshOnFocus(
    useCallback(
      () => splitAtom(atom(createOptionsFromChosenDays(chosenDays))),
      [chosenDays]
    )
  )

  function onItemPress(data: AvailableDateTimeOption): void {
    navigation.navigate('PickTimeFromSuggestions', {
      chosenDay: data,
    })
  }

  return (
    <>
      <HeaderProxy
        title={t('tradeChecklist.dateAndTime.screenTitle')}
        onClose={() => {
          navigation.navigate('AgreeOnTradeDetails')
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
            chosenDays,
          })
        }}
        text={t('tradeChecklist.dateAndTime.addDifferentTime')}
      />
    </>
  )
}
