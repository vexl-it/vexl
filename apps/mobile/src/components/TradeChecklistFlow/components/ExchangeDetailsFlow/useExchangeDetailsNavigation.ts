import {useNavigation} from '@react-navigation/native'
import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  discardExchangeDetailsDraftActionAtom,
  restoreExchangeDetailsDraftAfterFailedSubmitActionAtom,
} from '../../atoms/exchangeDetailsAtoms'
import {useTradeChecklistExitNavigation} from '../../useTradeChecklistExitNavigation'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../utils'

export default function useExchangeDetailsNavigation(): {
  readonly closeFlow: () => void
  readonly finishFlowWithPendingUpdates: () => void
} {
  const navigation =
    useNavigation<
      TradeChecklistStackScreenProps<'ExchangeDetails'>['navigation']
    >()
  const store = useStore()
  const wasOpenFromAgreeOnTradeDetailsScreen =
    useWasOpenFromAgreeOnTradeDetailsScreen()
  const restoreDraftAfterFailedSubmit = useSetAtom(
    restoreExchangeDetailsDraftAfterFailedSubmitActionAtom
  )
  const discardDraft = useSetAtom(discardExchangeDetailsDraftActionAtom)

  const closeFlow = useCallback(() => {
    discardDraft()

    if (wasOpenFromAgreeOnTradeDetailsScreen) {
      navigation.popTo('AgreeOnTradeDetails')
      return
    }

    navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
  }, [discardDraft, navigation, store, wasOpenFromAgreeOnTradeDetailsScreen])

  const finishFlowWithPendingUpdates = useTradeChecklistExitNavigation(
    restoreDraftAfterFailedSubmit
  )

  return {closeFlow, finishFlowWithPendingUpdates}
}
