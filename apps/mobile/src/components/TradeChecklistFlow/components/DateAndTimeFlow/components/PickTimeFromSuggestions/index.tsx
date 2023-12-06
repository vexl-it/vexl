import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import {useCallback} from 'react'
import {Stack} from 'tamagui'
import type {TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../../PageWithNavigationHeader'
import {
  saveDateTimePickActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../atoms/updatesToBeSentAtom'
import Content from '../../../Content'
import Header from '../../../Header'
import OptionsList from '../OptionsList'
import {useState} from './state'
import {useGoBackXTimes} from '../../../../../../utils/navigation'

type Props = TradeChecklistStackScreenProps<'PickTimeFromSuggestions'>

function PickTimeFromSuggestions({
  navigation,
  route: {
    params: {chosenDay, submitUpdateOnTimePick},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const goBackXTimes = useGoBackXTimes()

  const {selectItem, selectedItem, itemsAtoms} = useState(chosenDay)
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const saveDateTimePick = useSetAtom(saveDateTimePickActionAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )

  const onItemPress = useCallback(
    (item: DateTime) => {
      if (submitUpdateOnTimePick) {
        selectItem(item)
      } else {
        saveDateTimePick({dateTime: UnixMilliseconds.parse(item.toMillis())})
        // This works but assumes we are staying in the same navigator
        // (there are more than 2 items in current navigator history)
        goBackXTimes(2)
      }
    },
    [goBackXTimes, saveDateTimePick, selectItem, submitUpdateOnTimePick]
  )

  const onFooterButtonPress = useCallback(() => {
    if (!selectedItem) return

    showLoadingOverlay(true)
    saveDateTimePick({
      dateTime: UnixMilliseconds.parse(selectedItem.data.toMillis()),
    })
    void submitTradeChecklistUpdates()()
      .then((success) => {
        if (!success) return
        goBackXTimes(2)
      })
      .finally(() => {
        showLoadingOverlay(false)
      })
  }, [
    goBackXTimes,
    saveDateTimePick,
    selectedItem,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
  ])

  return (
    <>
      <HeaderProxy
        title={DateTime.fromMillis(chosenDay.date).toLocaleString({
          day: 'numeric',
          month: 'numeric',
          weekday: 'short',
        })}
        onClose={goBack}
      />

      <Content>
        <Header title={t('tradeChecklist.dateAndTime.selectTime')} />
        <Stack h="$1" />
        <OptionsList<DateTime> onItemPress={onItemPress} items={itemsAtoms} />
      </Content>

      <FooterButtonProxy
        text={t('common.continue')}
        hidden={!submitUpdateOnTimePick}
        disabled={!selectedItem}
        onPress={onFooterButtonPress}
      />
    </>
  )
}

export default PickTimeFromSuggestions
