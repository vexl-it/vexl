import {XmarkCancelClose} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {areThereUpdatesToBeSentAtom} from '../../../../state/tradeChecklist/atoms/updatesToBeSentAtom'
import {andThenExpectBooleanNoErrors} from '../../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {submitTradeChecklistUpdatesActionAtom} from '../../atoms/updatesToBeSentAtom'
import {TradeChecklistItemPageLayout} from '../TradeChecklistItemPageLayout'
import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'

type Props = TradeChecklistStackScreenProps<'AgreeOnTradeDetails'>

function AgreeOnTradeDetailsScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const areThereUpdatesToBeSent = useAtomValue(areThereUpdatesToBeSentAtom)
  const submitChangesAndSendMessage = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const store = useStore()

  const closeChecklist = useCallback(() => {
    navigation.popTo(
      'ChatDetail',
      store.get(fromChatAtoms.chatWithMessagesKeys)
    )
  }, [navigation, store])

  return (
    <TradeChecklistItemPageLayout
      hideLeftChevron
      header={{
        rightActions: [{icon: XmarkCancelClose, onPress: closeChecklist}],
      }}
      bottomButton={{
        disabled: !areThereUpdatesToBeSent,
        text: t('common.send'),
        onPress: () => {
          void Effect.runPromise(
            andThenExpectBooleanNoErrors((success) => {
              if (success) closeChecklist()
            })(submitChangesAndSendMessage())
          )
        },
      }}
    >
      <OnlineOrInPersonTrade />
    </TradeChecklistItemPageLayout>
  )
}

export default AgreeOnTradeDetailsScreen
