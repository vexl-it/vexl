import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import {useCallback} from 'react'
import {Stack} from 'tamagui'
import type {TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtomValueRefreshOnFocus} from '../../../../../utils/useFocusMemo'
import useSafeGoBack from '../../../../../utils/useSafeGoBack'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../PageWithNavigationHeader'
import Content from '../../Content'
import Header from '../../Header'
import OptionsList, {type Item as OptionItem} from './OptionsList'

function empty(): void {}

function createOptionsFromChosenDays(
  days: AvailableDateTimeOption[]
): Array<OptionItem<AvailableDateTimeOption>> {
  return days.map((day) => ({
    data: day,
    key: day.date.toString(),
    title: DateTime.fromMillis(day.date).toLocaleString({
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    }),
    rightText: `${DateTime.fromMillis(day.from).toLocaleString(
      DateTime.TIME_SIMPLE
    )} - ${DateTime.fromMillis(day.to).toLocaleString(DateTime.TIME_SIMPLE)}`,
  }))
}

type Props = TradeChecklistStackScreenProps<'PickDateFromSuggestions'>
export default function PickDateFromSuggestionsScreen(
  props: Props
): JSX.Element {
  const goBack = useSafeGoBack()
  const {t} = useTranslation()

  const itemsToShowAtoms = useAtomValueRefreshOnFocus(
    useCallback(
      () =>
        splitAtom(
          atom(createOptionsFromChosenDays(props.route.params.chosenDays))
        ),
      [props.route.params.chosenDays]
    )
  )

  function onItemPress(data: AvailableDateTimeOption): void {
    props.navigation.navigate('PickTimeFromSuggestions', {
      chosenDay: data,
      submitUpdateOnTimePick: props.route.params.submitUpdateOnTimePick,
    })
  }

  return (
    <>
      <HeaderProxy
        title={t('tradeChecklist.dateAndTime.screenTitle')}
        onClose={goBack}
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
        hidden
        text={t('common.continue')}
        onPress={empty}
      />
    </>
  )
}
