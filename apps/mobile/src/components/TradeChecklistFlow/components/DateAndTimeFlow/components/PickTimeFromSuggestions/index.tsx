import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect} from 'effect/index'
import {useSetAtom, useStore} from 'jotai'
import {type DateTime} from 'luxon'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import type {TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import unixMillisecondsToLocaleDateTime from '../../../../../../utils/unixMillisecondsToLocaleDateTime'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../../PageWithNavigationHeader'
import {
  saveDateTimePickActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../../utils'
import Content from '../../../Content'
import Header from '../../../Header'
import OptionsList from '../OptionsList'
import {useState} from './state'

type Props = TradeChecklistStackScreenProps<'PickTimeFromSuggestions'>

function PickTimeFromSuggestions({
  navigation,
  route: {
    params: {chosenDateTimes, pickedOption},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()

  const shouldSendOnSubmit = !useWasOpenFromAgreeOnTradeDetailsScreen()
  const {selectItem, selectedItem, itemsAtoms} = useState(
    chosenDateTimes,
    pickedOption
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const saveDateTimePick = useSetAtom(saveDateTimePickActionAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )

  const onItemPress = useCallback(
    (item: DateTime) => {
      if (shouldSendOnSubmit) {
        selectItem(item)
      } else {
        saveDateTimePick({dateTime: UnixMilliseconds.parse(item.toMillis())})
        navigation.popTo('AgreeOnTradeDetails')
      }
    },
    [navigation, saveDateTimePick, selectItem, shouldSendOnSubmit]
  )

  const onFooterButtonPress = useCallback(() => {
    if (!selectedItem) return

    showLoadingOverlay(true)
    saveDateTimePick({
      dateTime: UnixMilliseconds.parse(selectedItem.data.toMillis()),
    })
    void Effect.runPromise(submitTradeChecklistUpdates())
      .then((success) => {
        if (!success) return
        navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
      })
      .finally(() => {
        showLoadingOverlay(false)
      })
  }, [
    navigation,
    saveDateTimePick,
    selectedItem,
    showLoadingOverlay,
    store,
    submitTradeChecklistUpdates,
  ])

  return (
    <>
      <HeaderProxy
        title={unixMillisecondsToLocaleDateTime(
          pickedOption.date
        ).toLocaleString({
          day: 'numeric',
          month: 'numeric',
          weekday: 'short',
        })}
        onClose={() => {
          navigation.navigate('AgreeOnTradeDetails')
        }}
      />

      <Content>
        <Header title={t('tradeChecklist.dateAndTime.selectTime')} />
        <Stack h="$1" />
        <OptionsList<DateTime> onItemPress={onItemPress} items={itemsAtoms} />
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        text={t('common.continue')}
        hidden={!shouldSendOnSubmit}
        disabled={!selectedItem}
        onPress={onFooterButtonPress}
      />
    </>
  )
}

export default PickTimeFromSuggestions
