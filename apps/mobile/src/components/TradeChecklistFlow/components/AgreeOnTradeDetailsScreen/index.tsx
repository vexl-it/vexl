import {Button, NavigationBar, XmarkCancelClose} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {ScrollView} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {andThenExpectBooleanNoErrors} from '../../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {
  areThereUpdatesToBeSentAtom,
  askAreYouSureAndClearUpdatesToBeSentActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../atoms/updatesToBeSentAtom'
import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'

type Props = TradeChecklistStackScreenProps<'AgreeOnTradeDetails'>

function AgreeOnTradeDetailsScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeInsets = useSafeAreaInsets()
  const areThereUpdatesToBeSent = useAtomValue(areThereUpdatesToBeSentAtom)
  const submitChangesAndSendMessage = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const store = useStore()
  const askAreYouSureAndClearUpdatesToBeSent = useSetAtom(
    askAreYouSureAndClearUpdatesToBeSentActionAtom
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
    <Stack f={1} mt={safeInsets.top} mb={safeInsets.bottom} pt="$4">
      <NavigationBar
        style="back"
        rightActions={[
          {
            icon: XmarkCancelClose,
            onPress: closeChecklist,
          },
        ]}
      />
      <Stack m="$5" f={1}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 24}}
        >
          <OnlineOrInPersonTrade />
        </ScrollView>
        <Stack pt="$4">
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
      </Stack>
    </Stack>
  )
}

export default AgreeOnTradeDetailsScreen
