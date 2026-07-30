import {useNavigation} from '@react-navigation/native'
import {Effect} from 'effect/index'
import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  discardRevealIdentityDraftActionAtom,
  restoreRevealIdentityDraftAfterFailedSubmitActionAtom,
} from '../../atoms/revealIdentityAtoms'
import {submitTradeChecklistUpdatesActionAtom} from '../../atoms/updatesToBeSentAtom'
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
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
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

  const finishFlowWithPendingUpdates = useCallback(() => {
    if (wasOpenFromAgreeOnTradeDetailsScreen) {
      returnToFlowOrigin()
      return
    }

    void Effect.runPromise(submitTradeChecklistUpdates()).then((success) => {
      if (success) {
        returnToFlowOrigin()
        return
      }

      restoreRevealIdentityDraftAfterFailedSubmit()
    })
  }, [
    restoreRevealIdentityDraftAfterFailedSubmit,
    returnToFlowOrigin,
    submitTradeChecklistUpdates,
    wasOpenFromAgreeOnTradeDetailsScreen,
  ])

  return {closeFlow, finishFlowWithPendingUpdates}
}
