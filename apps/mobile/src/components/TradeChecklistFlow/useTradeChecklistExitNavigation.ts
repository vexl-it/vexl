import {useNavigation} from '@react-navigation/native'
import {Effect} from 'effect'
import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {type TradeChecklistStackScreenProps} from '../../navigationTypes'
import {chatWithMessagesKeys} from '../../state/tradeChecklist/atoms/fromChatAtoms'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import {submitTradeChecklistUpdatesActionAtom} from './atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from './utils'

export function useTradeChecklistExitNavigation(
  onSubmitFailed?: () => void
): () => void {
  const navigation =
    useNavigation<
      TradeChecklistStackScreenProps<'AgreeOnTradeDetails'>['navigation']
    >()
  const store = useStore()
  const wasOpenFromAgreeOnTradeDetailsScreen =
    useWasOpenFromAgreeOnTradeDetailsScreen()
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)

  return useCallback(() => {
    if (wasOpenFromAgreeOnTradeDetailsScreen) {
      navigation.popTo('AgreeOnTradeDetails')
      return
    }

    showLoadingOverlay(true)
    void Effect.runPromise(submitTradeChecklistUpdates())
      .then((success) => {
        if (success) {
          navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
          return
        }

        onSubmitFailed?.()
      })
      .finally(() => {
        showLoadingOverlay(false)
      })
  }, [
    navigation,
    onSubmitFailed,
    showLoadingOverlay,
    store,
    submitTradeChecklistUpdates,
    wasOpenFromAgreeOnTradeDetailsScreen,
  ])
}
