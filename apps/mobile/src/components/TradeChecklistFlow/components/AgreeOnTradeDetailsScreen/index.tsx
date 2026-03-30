import {useFocusEffect} from '@react-navigation/native'
import {Button, NavButton, XmarkCancelClose} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {ScrollView} from 'react-native'
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
import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'

type Props = TradeChecklistStackScreenProps<'AgreeOnTradeDetails'>

function AgreeOnTradeDetailsScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
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
      setHeaderState((prev) => ({
        ...prev,
        hidden: true,
        hiddenAllTheWay: true,
      }))
    }, [setHeaderState])
  )

  const closeChecklist = useCallback(() => {
    void askAreYouSureAndClearUpdatesToBeSent()().then((success) => {
      if (success) {
        navigation.popTo(
          'ChatDetail',
          store.get(fromChatAtoms.chatWithMessagesKeys)
        )
      }
    })
  }, [askAreYouSureAndClearUpdatesToBeSent, navigation, store])

  return (
    <Stack f={1}>
      <Stack ai="flex-end" pt="$5" pb="$6">
        <NavButton
          onPress={closeChecklist}
          icon={XmarkCancelClose}
          variant="tetriary"
        />
      </Stack>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 24}}
      >
        <OnlineOrInPersonTrade />
      </ScrollView>
      <Stack pt="$4" pb="$2">
        <Button
          disabled={!areThereUpdatesToBeSent}
          size="large"
          variant="primary"
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
        >
          {t('common.send')}
        </Button>
      </Stack>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy hidden />
    </Stack>
  )
}

export default AgreeOnTradeDetailsScreen
