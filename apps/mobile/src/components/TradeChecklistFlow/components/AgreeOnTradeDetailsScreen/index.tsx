import {useFocusEffect} from '@react-navigation/native'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {andThenExpectBooleanNoErrors} from '../../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../PageWithNavigationHeader'
import headerStateAtom from '../../../PageWithNavigationHeader/state/headerStateAtom'
import {
  areThereUpdatesToBeSentAtom,
  askAreYouSureAndClearUpdatesToBeSentActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../atoms/updatesToBeSentAtom'
import Content from '../Content'
import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'

type Props = TradeChecklistStackScreenProps<'AgreeOnTradeDetails'>

function AgreeOnTradeDetailsScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const offerForTradeChecklist = useAtomValue(fromChatAtoms.originOfferAtom)
  const areThereUpdatesToBeSent = useAtomValue(areThereUpdatesToBeSentAtom)
  const submitChangesAndSendMessage = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const store = useStore()
  const askAreYouSureAndClearUpdatesToBeSent = useSetAtom(
    askAreYouSureAndClearUpdatesToBeSentActionAtom
  )
  const setHeaderState = useSetAtom(headerStateAtom)

  useFocusEffect(
    useCallback(() => {
      setHeaderState((prev) => ({...prev, hidden: true}))
    }, [setHeaderState])
  )

  return (
    <Stack f={1}>
      <Content scrollable>
        <OnlineOrInPersonTrade />
      </Content>
      <PrimaryFooterButtonProxy
        hidden={
          !!offerForTradeChecklist?.offerInfo.publicPart.locationState.includes(
            'ONLINE'
          ) && !areThereUpdatesToBeSent
        }
        text={t('common.cancel')}
        onPress={() => {
          void Effect.runPromise(askAreYouSureAndClearUpdatesToBeSent()).then(
            (success: boolean) => {
              if (success) {
                navigation.popTo(
                  'ChatDetail',
                  store.get(fromChatAtoms.chatWithMessagesKeys)
                )
              }
            }
          )
        }}
      />
      <SecondaryFooterButtonProxy
        disabled={
          !!offerForTradeChecklist?.offerInfo.publicPart.locationState.includes(
            'IN_PERSON'
          ) && !areThereUpdatesToBeSent
        }
        text={
          !!offerForTradeChecklist?.offerInfo.publicPart.locationState.includes(
            'IN_PERSON'
          ) || !!areThereUpdatesToBeSent
            ? t('common.send')
            : t('tradeChecklist.acknowledgeAndContinue')
        }
        onPress={() => {
          void Effect.runPromise(
            andThenExpectBooleanNoErrors((success) => {
              if (success) {
                navigation.popTo(
                  'ChatDetail',
                  store.get(fromChatAtoms.chatWithMessagesKeys)
                )
              }
            })(submitChangesAndSendMessage())
          )
        }}
      />
    </Stack>
  )
}

export default AgreeOnTradeDetailsScreen
