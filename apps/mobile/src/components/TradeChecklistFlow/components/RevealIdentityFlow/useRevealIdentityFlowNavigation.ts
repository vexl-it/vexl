import {useNavigation} from '@react-navigation/native'
import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  discardRevealIdentityDraftActionAtom,
  restoreRevealIdentityDraftAfterFailedSubmitActionAtom,
} from '../../atoms/revealIdentityAtoms'
import {useTradeChecklistExitNavigation} from '../../useTradeChecklistExitNavigation'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../utils'

export default function useRevealIdentityFlowNavigation(): {
  readonly closeFlow: () => void
  readonly finishFlowWithPendingUpdates: () => void
} {
  const navigation =
    useNavigation<
      TradeChecklistStackScreenProps<'RevealIdentitySummary'>['navigation']
    >()
  const store = useStore()
  const wasOpenFromAgreeOnTradeDetailsScreen =
    useWasOpenFromAgreeOnTradeDetailsScreen()
  const restoreRevealIdentityDraftAfterFailedSubmit = useSetAtom(
    restoreRevealIdentityDraftAfterFailedSubmitActionAtom
  )
  const discardRevealIdentityDraft = useSetAtom(
    discardRevealIdentityDraftActionAtom
  )

  const returnToFlowOrigin = useCallback(() => {
    if (wasOpenFromAgreeOnTradeDetailsScreen) {
      navigation.popTo('AgreeOnTradeDetails')
      return
    }

    navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
  }, [navigation, store, wasOpenFromAgreeOnTradeDetailsScreen])

  const closeFlow = useCallback(() => {
    discardRevealIdentityDraft()
    returnToFlowOrigin()
  }, [discardRevealIdentityDraft, returnToFlowOrigin])

  const finishFlowWithPendingUpdates = useTradeChecklistExitNavigation(
    restoreRevealIdentityDraftAfterFailedSubmit
  )

  return {closeFlow, finishFlowWithPendingUpdates}
}
